# Fiat Route Product Decisions

## Locked Decisions

- **Processor:** Stripe Connect
- **Activation rule:** both sides must fund before the challenge becomes active
- **Result flow:** users agree inside the app
- **Settlement:** payout triggered after agreement
- **Dispute fallback:** auto refund after timeout
- **Repo:** separate fiat repo from the crypto version

## What is still needed later

- Stripe account credentials / keys
- exact Stripe Connect account structure
- branding / naming decisions
- support/dispute messaging
