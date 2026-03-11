'use client';

import { useEffect, useState } from 'react';
import type { FiatChallenge } from '../lib/challenge-store';

export function ChallengeList({ viewerEmail }: { viewerEmail?: string | null }) {
  const [challenges, setChallenges] = useState<FiatChallenge[]>([]);

  async function load() {
    const res = await fetch('/api/challenges', { cache: 'no-store' });
    const data = await res.json();
    setChallenges(data.challenges ?? []);
  }

  useEffect(() => {
    load().catch(() => setChallenges([]));
  }, []);

  async function updateChallenge(id: string, payload: Record<string, string>) {
    await fetch(`/api/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await load();
  }

  const filtered = viewerEmail
    ? challenges.filter((challenge) => challenge.creator === viewerEmail || challenge.opponent === viewerEmail)
    : challenges;

  return (
    <div className="grid grid-2">
      {filtered.map((challenge) => {
        const mySide = viewerEmail === challenge.creator ? 'creator' : viewerEmail === challenge.opponent ? 'opponent' : null;
        return (
          <article key={challenge.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.18em' }}>{challenge.id}</div>
                <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>{challenge.title}</h2>
              </div>
              <div className="badge">{challenge.status}</div>
            </div>
            <div className="grid grid-2" style={{ marginTop: 20 }}>
              <div><div className="muted">Creator</div><div>{challenge.creator}</div></div>
              <div><div className="muted">Opponent</div><div>{challenge.opponent}</div></div>
              <div><div className="muted">Stake</div><div>{challenge.stake}</div></div>
              <div><div className="muted">Agreement</div><div>{challenge.agreement}</div></div>
              <div><div className="muted">Creator funded</div><div>{challenge.creatorFunded ? 'Yes' : 'No'}</div></div>
              <div><div className="muted">Opponent funded</div><div>{challenge.opponentFunded ? 'Yes' : 'No'}</div></div>
              <div><div className="muted">Creator result</div><div>{challenge.creatorResult ?? 'Waiting'}</div></div>
              <div><div className="muted">Opponent result</div><div>{challenge.opponentResult ?? 'Waiting'}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              {!challenge.creatorFunded ? <button className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'fund', side: 'creator' })}>Mark creator funded</button> : null}
              {!challenge.opponentFunded ? <button className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'fund', side: 'opponent' })}>Mark opponent funded</button> : null}
              {challenge.status === 'Waiting on results' && mySide ? (
                <>
                  <button className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'result', side: mySide, choice: 'creator_won' })}>Creator won</button>
                  <button className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'result', side: mySide, choice: 'opponent_won' })}>Opponent won</button>
                  <button className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'result', side: mySide, choice: 'tie' })}>Tie</button>
                </>
              ) : null}
            </div>
          </article>
        );
      })}
      {!filtered.length ? <section className="card"><p className="muted">No challenges tied to this account yet.</p></section> : null}
    </div>
  );
}
