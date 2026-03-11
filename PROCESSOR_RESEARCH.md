# Payment Processor Research for ChallengeEscrow Fiat

## Question
Can we build a version of ChallengeEscrow without blockchain using a payment processor API?

## Short answer
Yes, but the architecture changes.

You generally do **not** get trustless on-chain escrow behavior.
Instead, you build a platform/marketplace-style product where:
- the platform coordinates the challenge
- the payment processor handles money movement
- the app decides when to release funds based on agreement/dispute logic

## Best fits

### Stripe Connect
Most likely best for an MVP.

Useful features:
- marketplace/platform support
- transfers and payouts
- delayed payouts
- KYC/compliance support
- strong developer experience

Best interpretation:
- creator funds challenge
- opponent funds challenge
- platform holds/restricts release logic in app workflow
- payout triggered once both parties agree

### Adyen for Platforms
Powerful but heavier.

Useful features:
- split payments
- delayed capture / delayed payout style flows
- enterprise-grade platform/compliance tooling

Best interpretation:
- strong later-stage option if the product becomes serious

### PayPal for Marketplaces
Possible but less ideal.

Useful features:
- payouts
- familiar brand
- some marketplace support

Less ideal because:
- product feels less native for custom challenge settlement logic

## Compliance / business reality
This is the big difference from crypto.

With fiat:
- you are much closer to payments compliance land
- you should avoid pretending to be a licensed escrow company unless you actually are one
- the safer framing is platform-held or delayed payout workflow

## Product recommendation

### Best non-crypto version
- off-card/app challenge coordination
- processor-backed funding and payout
- app decides release only when agreement is present
- dispute/refund path for disagreement

## Recommended build order
1. choose processor (Stripe Connect likely)
2. model challenge lifecycle in backend
3. model funding state per participant
4. build agreement flow
5. build payout trigger flow
6. build refund/dispute admin path

## Why this may actually be better for mainstream users
- no wallet friction
- no chain/network confusion
- easier onboarding
- better fit for non-crypto users

## Why it may be harder operationally
- more compliance sensitivity
- more platform liability
- more dependence on processor policies
- weaker “trustless” story
