import { NextResponse } from 'next/server';
import { createChallenge, listChallenges } from '../../../lib/challenge-store';

export async function GET() {
  return NextResponse.json({ challenges: listChallenges() });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.title || !body?.creator || !body?.opponent || !body?.stake) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const challenge = createChallenge({
    title: String(body.title),
    creator: String(body.creator),
    opponent: String(body.opponent),
    stake: String(body.stake),
    rules: String(body.rules ?? ''),
  });

  return NextResponse.json({ challenge }, { status: 201 });
}
