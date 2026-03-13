# Supabase setup for challenges

Run this SQL in the Supabase SQL editor:

```sql
create extension if not exists pgcrypto;

create table if not exists public.challenges (
  id text primary key default 'cef_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  title text not null,
  creator text not null,
  opponent text not null,
  stake text not null,
  rules text not null default '',
  creator_funded boolean not null default false,
  opponent_funded boolean not null default false,
  creator_result text,
  opponent_result text,
  status text not null default 'Waiting for creator funding',
  agreement text not null default 'Pending',
  resolution text,
  payout_target text,
  creator_payout_email text,
  opponent_payout_email text,
  creator_stripe_account_id text,
  opponent_stripe_account_id text,
  creator_stripe_onboarding_complete boolean not null default false,
  opponent_stripe_onboarding_complete boolean not null default false,
  payout_transfer_ids text,
  creator_checkout_session_id text,
  opponent_checkout_session_id text,
  creator_payment_intent_id text,
  opponent_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table public.challenges add column if not exists resolution text;
alter table public.challenges add column if not exists payout_target text;
alter table public.challenges add column if not exists creator_payout_email text;
alter table public.challenges add column if not exists opponent_payout_email text;
alter table public.challenges add column if not exists creator_stripe_account_id text;
alter table public.challenges add column if not exists opponent_stripe_account_id text;
alter table public.challenges add column if not exists creator_stripe_onboarding_complete boolean not null default false;
alter table public.challenges add column if not exists opponent_stripe_onboarding_complete boolean not null default false;
alter table public.challenges add column if not exists payout_transfer_ids text;
alter table public.challenges add column if not exists creator_checkout_session_id text;
alter table public.challenges add column if not exists opponent_checkout_session_id text;
alter table public.challenges add column if not exists creator_payment_intent_id text;
alter table public.challenges add column if not exists opponent_payment_intent_id text;

alter table public.challenges disable row level security;
```

## Winner payout path now
- matched `creator_won` or `opponent_won` votes move to `Payout processing`
- backend attempts Stripe transfers to the winner's Connect account
- on success -> `Paid out`
- on failure -> `Payout failed`

## Tie path
- matching `tie` votes -> refunds both original payments -> `Refunded`
