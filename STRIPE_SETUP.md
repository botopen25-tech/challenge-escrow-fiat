# Stripe Setup

## Required env vars
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

## Webhook endpoint
Set Stripe webhook URL to:
- `/api/stripe/webhook`

For Vercel production that means:
- `https://<your-domain>/api/stripe/webhook`

Listen for event:
- `checkout.session.completed`

## Current flow
- challenge funding button creates a Stripe Checkout session
- completed checkout webhook marks creator or opponent as funded
- when both are funded, challenge becomes active
