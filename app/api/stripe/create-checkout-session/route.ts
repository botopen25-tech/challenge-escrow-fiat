import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { getChallenge } from '../../../../lib/challenge-store';

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
    const amount = Number(String(challenge.stake).replace(/[^0-9.]/g, ''));

    if (!amount || Number.isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid challenge stake' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${siteUrl}/challenges?checkout=success`,
      cancel_url: `${siteUrl}/challenges?checkout=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `${challenge.title} — ${side} funding`,
              description: `Fund ${side} side of ${challenge.id}`,
            },
          },
        },
      ],
      metadata: {
        challengeId,
        side,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
