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
  created_at timestamptz not null default now()
);

alter table public.challenges add column if not exists resolution text;
alter table public.challenges add column if not exists payout_target text;

alter table public.challenges disable row level security;
```

Optional but recommended for server writes on Vercel:
- add `SUPABASE_SERVICE_ROLE_KEY` to the app env vars

Current code will fall back to the anon key if service role is not set.

## Current payout-state behavior
- matching `creator_won` votes -> `Payout processing`
- matching `opponent_won` votes -> `Payout processing`
- matching `tie` votes -> `Refund processing`
- conflicting votes -> `Disputed`

This is state-machine logic only for now. Real Stripe payouts/refunds are not wired yet.
