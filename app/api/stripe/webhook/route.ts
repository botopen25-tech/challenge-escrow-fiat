import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { markFundingCaptured } from '../../../../lib/challenge-store';
import { getStripe } from '../../../../lib/stripe';

export async function POST(request: Request) {
  const signature = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook configuration' }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const challengeId = session.metadata?.challengeId;
    const side = session.metadata?.side as 'creator' | 'opponent' | undefined;
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

    if (challengeId && side) {
      await markFundingCaptured(challengeId, side, session.id, paymentIntentId);
    }
  }

  return NextResponse.json({ received: true });
}
