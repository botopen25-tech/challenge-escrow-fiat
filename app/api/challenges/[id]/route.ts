import { NextResponse } from 'next/server';
import { fundChallenge, getChallenge, submitResult } from '../../../../lib/challenge-store';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const challenge = await getChallenge(params.id);
    if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ challenge });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load challenge';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    if (body?.type === 'fund') {
      const side = body?.side as 'creator' | 'opponent' | undefined;
      if (!side) return NextResponse.json({ error: 'Missing side' }, { status: 400 });
      const challenge = await fundChallenge(params.id, side);
      if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ challenge });
    }

    if (body?.type === 'result') {
      const side = body?.side as 'creator' | 'opponent' | undefined;
      const choice = body?.choice as 'creator_won' | 'opponent_won' | 'tie' | undefined;
      if (!side || !choice) return NextResponse.json({ error: 'Missing result fields' }, { status: 400 });
      const challenge = await submitResult(params.id, side, choice);
      if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ challenge });
    }

    return NextResponse.json({ error: 'Unsupported update type' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update challenge';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
