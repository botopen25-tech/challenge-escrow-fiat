export type FiatChallengeStatus =
  | 'Draft'
  | 'Waiting for creator funding'
  | 'Waiting for opponent funding'
  | 'Active'
  | 'Waiting on results'
  | 'Awaiting payout'
  | 'Disputed';

export type FiatChallenge = {
  id: string;
  title: string;
  creator: string;
  opponent: string;
  stake: string;
  rules: string;
  creatorFunded: boolean;
  opponentFunded: boolean;
  creatorResult?: 'creator_won' | 'opponent_won' | 'tie';
  opponentResult?: 'creator_won' | 'opponent_won' | 'tie';
  status: FiatChallengeStatus;
  agreement: 'Pending' | 'Waiting on results' | 'Agreed' | 'Conflict';
};

const challenges: FiatChallenge[] = [
  {
    id: 'cef_001',
    title: 'Friday workout challenge',
    creator: 'Kaiden',
    opponent: 'Friend',
    stake: '$25',
    rules: 'Most miles by Sunday night wins.',
    creatorFunded: true,
    opponentFunded: false,
    status: 'Waiting for opponent funding',
    agreement: 'Pending',
  },
  {
    id: 'cef_002',
    title: 'March Madness side bet',
    creator: 'Kaiden',
    opponent: 'Chris',
    stake: '$50',
    rules: 'Higher bracket score after the final wins.',
    creatorFunded: true,
    opponentFunded: true,
    status: 'Waiting on results',
    agreement: 'Waiting on results',
  },
];

export function listChallenges() {
  return challenges;
}

export function createChallenge(input: Omit<FiatChallenge, 'id' | 'status' | 'agreement' | 'creatorFunded' | 'opponentFunded' | 'creatorResult' | 'opponentResult'>) {
  const id = `cef_${String(challenges.length + 1).padStart(3, '0')}`;
  const challenge: FiatChallenge = {
    id,
    ...input,
    creatorFunded: false,
    opponentFunded: false,
    status: 'Waiting for creator funding',
    agreement: 'Pending',
  };
  challenges.unshift(challenge);
  return challenge;
}

export function fundChallenge(id: string, side: 'creator' | 'opponent') {
  const challenge = challenges.find((item) => item.id === id);
  if (!challenge) return null;

  if (side === 'creator') challenge.creatorFunded = true;
  if (side === 'opponent') challenge.opponentFunded = true;

  if (challenge.creatorFunded && challenge.opponentFunded) {
    challenge.status = 'Waiting on results';
    challenge.agreement = 'Waiting on results';
  } else if (challenge.creatorFunded) {
    challenge.status = 'Waiting for opponent funding';
  } else {
    challenge.status = 'Waiting for creator funding';
  }

  return challenge;
}

export function submitResult(id: string, side: 'creator' | 'opponent', choice: 'creator_won' | 'opponent_won' | 'tie') {
  const challenge = challenges.find((item) => item.id === id);
  if (!challenge) return null;

  if (side === 'creator') challenge.creatorResult = choice;
  if (side === 'opponent') challenge.opponentResult = choice;

  if (challenge.creatorResult && challenge.opponentResult) {
    if (challenge.creatorResult === challenge.opponentResult) {
      challenge.agreement = 'Agreed';
      challenge.status = 'Awaiting payout';
    } else {
      challenge.agreement = 'Conflict';
      challenge.status = 'Disputed';
    }
  } else {
    challenge.agreement = 'Waiting on results';
    challenge.status = 'Waiting on results';
  }

  return challenge;
}
