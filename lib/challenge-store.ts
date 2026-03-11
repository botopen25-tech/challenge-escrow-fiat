export type FiatChallenge = {
  id: string;
  title: string;
  creator: string;
  opponent: string;
  stake: string;
  rules: string;
  status: 'Draft' | 'Waiting for opponent funding' | 'Active' | 'Waiting on results';
  agreement: 'Pending' | 'Waiting on results' | 'Agreed';
};

const challenges: FiatChallenge[] = [
  {
    id: 'cef_001',
    title: 'Friday workout challenge',
    creator: 'Kaiden',
    opponent: 'Friend',
    stake: '$25',
    rules: 'Most miles by Sunday night wins.',
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
    status: 'Active',
    agreement: 'Waiting on results',
  },
];

export function listChallenges() {
  return challenges;
}

export function createChallenge(input: Omit<FiatChallenge, 'id' | 'status' | 'agreement'>) {
  const id = `cef_${String(challenges.length + 1).padStart(3, '0')}`;
  const challenge: FiatChallenge = {
    id,
    ...input,
    status: 'Waiting for opponent funding',
    agreement: 'Pending',
  };
  challenges.unshift(challenge);
  return challenge;
}
