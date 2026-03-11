# ChallengeEscrow Fiat

A non-crypto version of ChallengeEscrow using a payment processor instead of blockchain.

## Core Idea

Users fund a shared pool using a payment processor. The app manages challenge creation, acceptance, and result agreement. Funds are released from the pool when both parties agree, or held/refunded/escalated when they do not.

## Direction

This is a separate product track from the Base Sepolia on-chain version.

- **on-chain repo:** `/home/kdot/projects/challenge-escrow`
- **fiat repo:** `/home/kdot/projects/challenge-escrow-fiat`

## Best processor candidates

### 1. Stripe Connect
Best fit for early product exploration.

Why:
- marketplace/platform primitives
- split payouts
- delayed payouts (closest thing to pseudo-escrow)
- strong docs
- built-in KYC/compliance support

### 2. Adyen for Platforms
Strong enterprise option.

Why:
- very capable for platforms and split payments
- strong compliance/risk tooling
- better for a bigger operation than an early MVP

### 3. PayPal for Marketplaces / Payouts
Potentially useful, but less clean for this exact product shape.

Why:
- familiar brand
- payout tools
- weaker product fit for escrow-like custom logic

## Product Model

### What stays in the app/backend
- create challenge
- invite opponent
- accept challenge
- submit result
- detect agreement
- manage dispute/refund workflow

### What the processor handles
- card/bank funding
- pooled platform-held funds / delayed payout equivalent
- payout/release
- compliance rails

## Recommended MVP

Build this like a platform workflow, not like a pure escrow company.

1. creator creates challenge
2. creator funds challenge
3. opponent accepts and funds
4. both parties submit result in app
5. if both agree, app triggers payout
6. if they disagree, app moves to dispute/refund flow

## Important reality

True legal escrow is regulated. For MVP purposes, the likely practical path is:
- use platform-held funds / delayed disbursement style flows
- not market it as formal licensed escrow
- frame it as challenge settlement / pooled payout workflow

## Open questions
- Can Stripe Connect delayed payout model support the exact UX we want?
- Do we want both users to fund before the challenge becomes active?
- What is the refund/dispute policy?
- Do we want platform fee take-rate?
