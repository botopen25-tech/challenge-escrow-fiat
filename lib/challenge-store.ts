import { supabaseAdmin } from './supabase-admin';

export type FiatChallengeStatus =
  | 'Draft'
  | 'Waiting for creator funding'
  | 'Waiting for opponent funding'
  | 'Active'
  | 'Waiting on results'
  | 'Awaiting payout'
  | 'Disputed';

export type FiatChallengeResult = 'creator_won' | 'opponent_won' | 'tie';

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
    createdAt: row.created_at,
  };
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

export async function createChallenge(input: Omit<FiatChallenge, 'id' | 'status' | 'agreement' | 'creatorFunded' | 'opponentFunded' | 'creatorResult' | 'opponentResult' | 'createdAt'>) {
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
    })
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}

export async function fundChallenge(id: string, side: 'creator' | 'opponent') {
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

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .update({
      creator_funded: creatorFunded,
      opponent_funded: opponentFunded,
      status,
      agreement,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}

export async function submitResult(id: string, side: 'creator' | 'opponent', choice: FiatChallengeResult) {
  const current = await getChallenge(id);
  if (!current) return null;

  const creatorResult = side === 'creator' ? choice : current.creatorResult ?? null;
  const opponentResult = side === 'opponent' ? choice : current.opponentResult ?? null;

  let agreement: FiatChallenge['agreement'] = 'Waiting on results';
  let status: FiatChallengeStatus = 'Waiting on results';

  if (creatorResult && opponentResult) {
    if (creatorResult === opponentResult) {
      agreement = 'Agreed';
      status = 'Awaiting payout';
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
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toChallenge(data as ChallengeRow);
}
