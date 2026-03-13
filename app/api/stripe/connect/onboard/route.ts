import { NextResponse } from 'next/server';
import { getStripe } from '../../../../../lib/stripe';
import { getChallenge, updateStripeAccount } from '../../../../../lib/challenge-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const challengeId = body?.challengeId as string | undefined;
    const side = body?.side as 'creator' | 'opponent' | undefined;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!challengeId || !side) {
      return NextResponse.json({ error: 'Missing challengeId or side' }, { status: 400 });
    }

    if (!siteUrl) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SITE_URL' }, { status: 500 });
    }

    const challenge = await getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const stripe = getStripe();
    const existingAccountId = side === 'creator' ? challenge.creatorStripeAccountId : challenge.opponentStripeAccountId;
    const payoutEmail = side === 'creator' ? (challenge.creatorPayoutEmail ?? challenge.creator) : (challenge.opponentPayoutEmail ?? challenge.opponent);

    let accountId = existingAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: payoutEmail ?? undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          challengeId,
          side,
        },
      });
      accountId = account.id;
      await updateStripeAccount(challengeId, side, accountId, false);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/challenges?connect=refresh`,
      return_url: `${siteUrl}/challenges?connect=return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url, accountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start Stripe Connect onboarding';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
