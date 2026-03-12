import { NextResponse } from 'next/server';
import { createChallenge, listChallenges } from '../../../lib/challenge-store';

export async function GET() {
  try {
    return NextResponse.json({ challenges: await listChallenges() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load challenges';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.creator || !body?.opponent || !body?.stake) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const challenge = await createChallenge({
      title: String(body.title),
      creator: String(body.creator),
      opponent: String(body.opponent),
      stake: String(body.stake),
      rules: String(body.rules ?? ''),
      creatorPayoutEmail: String(body.creatorPayoutEmail ?? body.creator),
      opponentPayoutEmail: String(body.opponentPayoutEmail ?? body.opponent),
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create challenge';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
