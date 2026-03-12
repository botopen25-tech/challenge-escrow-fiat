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
  creator_checkout_session_id text,
  opponent_checkout_session_id text,
  creator_payment_intent_id text,
  opponent_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table public.challenges add column if not exists resolution text;
alter table public.challenges add column if not exists payout_target text;
alter table public.challenges add column if not exists creator_checkout_session_id text;
alter table public.challenges add column if not exists opponent_checkout_session_id text;
alter table public.challenges add column if not exists creator_payment_intent_id text;
alter table public.challenges add column if not exists opponent_payment_intent_id text;

alter table public.challenges disable row level security;
