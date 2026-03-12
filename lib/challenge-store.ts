import { supabaseAdmin } from './supabase-admin';

export type FiatChallengeStatus =
  | 'Draft'
  | 'Waiting for creator funding'
  | 'Waiting for opponent funding'
  | 'Active'
  | 'Waiting on results'
  | 'Awaiting payout'
  | 'Payout processing'
  | 'Paid out'
  | 'Refund processing'
  | 'Refunded'
  | 'Disputed'
  | 'Payout failed';

export type FiatChallengeResult = 'creator_won' | 'opponent_won' | 'tie';
export type FiatChallengeResolution = 'creator' | 'opponent' | 'tie' | null;

export type FiatChallenge = {
  id: string;
  title: string;
  creator: string;
  opponent: string;
  stake: string;
  rules: string;
  creatorFunded: boolean;
  opponentFunded: boolean;
  creatorResult?: FiatChallengeResult;
  opponentResult?: FiatChallengeResult;
  status: FiatChallengeStatus;
  agreement: 'Pending' | 'Waiting on results' | 'Agreed' | 'Conflict';
  resolution?: FiatChallengeResolution;
  payoutTarget?: string | null;
  creatorPayoutEmail?: string | null;
  opponentPayoutEmail?: string | null;
  creatorCheckoutSessionId?: string | null;
  opponentCheckoutSessionId?: string | null;
  creatorPaymentIntentId?: string | null;
  opponentPaymentIntentId?: string | null;
  createdAt?: string;
};

type ChallengeRow = {
  id: string;
  title: string;
  creator: string;
  opponent: string;
  stake: string;
  rules: string;
  creator_funded: boolean;
  opponent_funded: boolean;
  creator_result: FiatChallengeResult | null;
  opponent_result: FiatChallengeResult | null;
  status: FiatChallengeStatus;
  agreement: 'Pending' | 'Waiting on results' | 'Agreed' | 'Conflict';
  resolution: FiatChallengeResolution;
  payout_target: string | null;
  creator_payout_email: string | null;
  opponent_payout_email: string | null;
  creator_checkout_session_id: string | null;
  opponent_checkout_session_id: string | null;
  creator_payment_intent_id: string | null;
  opponent_payment_intent_id: string | null;
  created_at: string;
};

function toChallenge(row: ChallengeRow): FiatChallenge {
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    opponent: row.opponent,
    stake: row.stake,
    rules: row.rules,
    creatorFunded: row.creator_funded,
    opponentFunded: row.opponent_funded,
    creatorResult: row.creator_result ?? undefined,
    opponentResult: row.opponent_result ?? undefined,
    status: row.status,
    agreement: row.agreement,
    resolution: row.resolution ?? undefined,
    payoutTarget: row.payout_target,
    creatorPayoutEmail: row.creator_payout_email,
    opponentPayoutEmail: row.opponent_payout_email,
    creatorCheckoutSessionId: row.creator_checkout_session_id,
    opponentCheckoutSessionId: row.opponent_checkout_session_id,
    creatorPaymentIntentId: row.creator_payment_intent_id,
    opponentPaymentIntentId: row.opponent_payment_intent_id,
    createdAt: row.created_at,
  };
}

function deriveResolution(result: FiatChallengeResult | null, creatorPayoutEmail: string | null, opponentPayoutEmail: string | null) {
  if (!result) return { resolution: null, payoutTarget: null };
  if (result === 'creator_won') return { resolution: 'creator' as const, payoutTarget: creatorPayoutEmail };
  if (result === 'opponent_won') return { resolution: 'opponent' as const, payoutTarget: opponentPayoutEmail };
  return { resolution: 'tie' as const, payoutTarget: null };
}

export async function listChallenges() {
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toChallenge(row as ChallengeRow));
}

export async function getChallenge(id: string) {
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? toChallenge(data as ChallengeRow) : null;
}

export async function createChallenge(input: Omit<FiatChallenge, 'id' | 'status' | 'agreement' | 'creatorFunded' | 'opponentFunded' | 'creatorResult' | 'opponentResult' | 'resolution' | 'payoutTarget' | 'creatorCheckoutSessionId' | 'opponentCheckoutSessionId' | 'creatorPaymentIntentId' | 'opponentPaymentIntentId' | 'createdAt'>) {
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .insert({
      title: input.title,
      creator: input.creator,
      opponent: input.opponent,
      stake: input.stake,
      rules: input.rules,
      creator_funded: false,
      opponent_funded: false,
      status: 'Waiting for creator funding',
      agreement: 'Pending',
      resolution: null,
      payout_target: null,
      creator_payout_email: input.creatorPayoutEmail,
      opponent_payout_email: input.opponentPayoutEmail,
      creator_checkout_session_id: null,
      opponent_checkout_session_id: null,
      creator_payment_intent_id: null,
      opponent_payment_intent_id: null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}

export async function markFundingCaptured(id: string, side: 'creator' | 'opponent', checkoutSessionId: string | null, paymentIntentId: string | null) {
  const current = await getChallenge(id);
  if (!current) return null;

  const creatorFunded = side === 'creator' ? true : current.creatorFunded;
  const opponentFunded = side === 'opponent' ? true : current.opponentFunded;

  let status: FiatChallengeStatus = 'Waiting for creator funding';
  let agreement: FiatChallenge['agreement'] = current.agreement;

  if (creatorFunded && opponentFunded) {
    status = 'Waiting on results';
    agreement = 'Waiting on results';
  } else if (creatorFunded) {
    status = 'Waiting for opponent funding';
    agreement = 'Pending';
  }

  const update: Record<string, string | boolean | null> = {
    creator_funded: creatorFunded,
    opponent_funded: opponentFunded,
    status,
    agreement,
  };

  if (side === 'creator') {
    update.creator_checkout_session_id = checkoutSessionId;
    update.creator_payment_intent_id = paymentIntentId;
  } else {
    update.opponent_checkout_session_id = checkoutSessionId;
    update.opponent_payment_intent_id = paymentIntentId;
  }

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}

export async function updatePayoutEmail(id: string, side: 'creator' | 'opponent', payoutEmail: string) {
  const update = side === 'creator'
    ? { creator_payout_email: payoutEmail }
    : { opponent_payout_email: payoutEmail };

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}

export async function fundChallenge(id: string, side: 'creator' | 'opponent') {
  return markFundingCaptured(id, side, null, null);
}

export async function submitResult(id: string, side: 'creator' | 'opponent', choice: FiatChallengeResult) {
  const current = await getChallenge(id);
  if (!current) return null;

  const creatorResult = side === 'creator' ? choice : current.creatorResult ?? null;
  const opponentResult = side === 'opponent' ? choice : current.opponentResult ?? null;

  let agreement: FiatChallenge['agreement'] = 'Waiting on results';
  let status: FiatChallengeStatus = 'Waiting on results';
  let resolution: FiatChallengeResolution = null;
  let payoutTarget: string | null = null;

  if (creatorResult && opponentResult) {
    if (creatorResult === opponentResult) {
      agreement = 'Agreed';
      const derived = deriveResolution(creatorResult, current.creatorPayoutEmail ?? current.creator, current.opponentPayoutEmail ?? current.opponent);
      resolution = derived.resolution;
      payoutTarget = derived.payoutTarget;
      status = resolution === 'tie' ? 'Refund processing' : 'Payout processing';
    } else {
      agreement = 'Conflict';
      status = 'Disputed';
    }
  }

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .update({
      creator_result: creatorResult,
      opponent_result: opponentResult,
      agreement,
      status,
      resolution,
      payout_target: payoutTarget,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}

export async function setChallengeStatus(id: string, status: FiatChallengeStatus) {
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}
