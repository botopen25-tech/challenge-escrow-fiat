import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { fundChallenge, getChallenge, markChallengePaidOut, setChallengeStatus, submitResult, updatePayoutEmail } from '../../../../lib/challenge-store';

function isAlreadyRefundedError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes('already been refunded');
}

async function getChargeIdFromPaymentIntent(stripe: Stripe, paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const latestCharge = paymentIntent.latest_charge;
  if (!latestCharge) {
    throw new Error(`No charge found for payment intent ${paymentIntentId}`);
  }
  return typeof latestCharge === 'string' ? latestCharge : latestCharge.id;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const challenge = await getChallenge(params.id);
    if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ challenge });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load challenge';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    if (body?.type === 'fund') {
      const side = body?.side as 'creator' | 'opponent' | undefined;
      if (!side) return NextResponse.json({ error: 'Missing side' }, { status: 400 });
      const challenge = await fundChallenge(params.id, side);
      if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ challenge });
    }

    if (body?.type === 'payout_profile') {
      const side = body?.side as 'creator' | 'opponent' | undefined;
      const payoutEmail = body?.payoutEmail as string | undefined;
      if (!side || !payoutEmail) return NextResponse.json({ error: 'Missing payout profile fields' }, { status: 400 });
      const challenge = await updatePayoutEmail(params.id, side, payoutEmail);
      return NextResponse.json({ challenge });
    }

    if (body?.type === 'result') {
      const existing = await getChallenge(params.id);
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      if (['Refunded', 'Paid out'].includes(existing.status)) {
        return NextResponse.json({ challenge: existing });
      }

      const side = body?.side as 'creator' | 'opponent' | undefined;
      const choice = body?.choice as 'creator_won' | 'opponent_won' | 'tie' | undefined;
      if (!side || !choice) return NextResponse.json({ error: 'Missing result fields' }, { status: 400 });

      if (existing.status === 'Refund processing' && existing.resolution === 'tie') {
        return NextResponse.json({ challenge: existing });
      }

      const challenge = await submitResult(params.id, side, choice);
      if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      if (challenge.status === 'Refund processing') {
        if (!challenge.creatorPaymentIntentId || !challenge.opponentPaymentIntentId) {
          const failed = await setChallengeStatus(params.id, 'Payout failed');
          return NextResponse.json({ challenge: failed, error: 'Missing payment intent ids for refund' }, { status: 500 });
        }

        try {
          const stripe = getStripe();
          await stripe.refunds.create({
            payment_intent: challenge.creatorPaymentIntentId,
            reason: 'requested_by_customer',
            metadata: { challengeId: challenge.id, side: 'creator' },
          });

          try {
            await stripe.refunds.create({
              payment_intent: challenge.opponentPaymentIntentId,
              reason: 'requested_by_customer',
              metadata: { challengeId: challenge.id, side: 'opponent' },
            });
          } catch (error) {
            if (!isAlreadyRefundedError(error)) throw error;
          }

          const refunded = await setChallengeStatus(params.id, 'Refunded');
          return NextResponse.json({ challenge: refunded });
        } catch (error) {
          if (isAlreadyRefundedError(error)) {
            const refunded = await setChallengeStatus(params.id, 'Refunded');
            return NextResponse.json({ challenge: refunded });
          }

          const failed = await setChallengeStatus(params.id, 'Payout failed');
          const message = error instanceof Error ? error.message : 'Refund failed';
          return NextResponse.json({ challenge: failed, error: message }, { status: 500 });
        }
      }

      if (challenge.status === 'Payout processing') {
        const winnerSide = challenge.resolution;
        const winnerAccountId = winnerSide === 'creator'
          ? challenge.creatorStripeAccountId
          : winnerSide === 'opponent'
            ? challenge.opponentStripeAccountId
            : null;
        const winnerReady = winnerSide === 'creator'
          ? challenge.creatorStripeOnboardingComplete
          : winnerSide === 'opponent'
            ? challenge.opponentStripeOnboardingComplete
            : false;

        if (!winnerSide || winnerSide === 'tie') {
          const failed = await setChallengeStatus(params.id, 'Payout failed');
          return NextResponse.json({ challenge: failed, error: 'No winner side available for payout' }, { status: 500 });
        }

        if (!winnerAccountId || !winnerReady) {
          const failed = await setChallengeStatus(params.id, 'Payout failed');
          return NextResponse.json({ challenge: failed, error: 'Winner Stripe Connect account is not ready' }, { status: 500 });
        }

        if (!challenge.creatorPaymentIntentId || !challenge.opponentPaymentIntentId) {
          const failed = await setChallengeStatus(params.id, 'Payout failed');
          return NextResponse.json({ challenge: failed, error: 'Missing payment intent ids for payout' }, { status: 500 });
        }

        try {
          const stripe = getStripe();
          const creatorChargeId = await getChargeIdFromPaymentIntent(stripe, challenge.creatorPaymentIntentId);
          const opponentChargeId = await getChargeIdFromPaymentIntent(stripe, challenge.opponentPaymentIntentId);
          const amount = Math.round(Number(String(challenge.stake).replace(/[^0-9.]/g, '')) * 100);

          if (!amount || Number.isNaN(amount)) {
            throw new Error('Invalid challenge stake for payout');
          }

          const transferOne = await stripe.transfers.create({
            amount,
            currency: 'usd',
            destination: winnerAccountId,
            source_transaction: creatorChargeId,
            metadata: { challengeId: challenge.id, winnerSide, leg: 'creator_funding' },
          });

          const transferTwo = await stripe.transfers.create({
            amount,
            currency: 'usd',
            destination: winnerAccountId,
            source_transaction: opponentChargeId,
            metadata: { challengeId: challenge.id, winnerSide, leg: 'opponent_funding' },
          });

          const paid = await markChallengePaidOut(params.id, [transferOne.id, transferTwo.id]);
          return NextResponse.json({ challenge: paid });
        } catch (error) {
          const failed = await setChallengeStatus(params.id, 'Payout failed');
          const message = error instanceof Error ? error.message : 'Winner payout failed';
          return NextResponse.json({ challenge: failed, error: message }, { status: 500 });
        }
      }

      return NextResponse.json({ challenge });
    }

    return NextResponse.json({ error: 'Unsupported update type' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update challenge';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
