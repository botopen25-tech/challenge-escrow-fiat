import { NextResponse } from 'next/server';
import { getStripe } from '../../../../../lib/stripe';
import { getChallenge, updateStripeAccount } from '../../../../../lib/challenge-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const challengeId = body?.challengeId as string | undefined;
    const side = body?.side as 'creator' | 'opponent' | undefined;

    if (!challengeId || !side) {
      return NextResponse.json({ error: 'Missing challengeId or side' }, { status: 400 });
    }

    const challenge = await getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const accountId = side === 'creator' ? challenge.creatorStripeAccountId : challenge.opponentStripeAccountId;
    if (!accountId) {
      return NextResponse.json({ error: 'No Stripe account found for this side' }, { status: 404 });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    const onboardingComplete = !!account.details_submitted && !!account.charges_enabled;
    const updated = await updateStripeAccount(challengeId, side, accountId, onboardingComplete);

    return NextResponse.json({ challenge: updated, onboardingComplete, accountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not refresh Connect status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
