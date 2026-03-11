'use client';

import { useEffect, useState } from 'react';
import type { FiatChallenge } from '../lib/challenge-store';

export function ChallengeList() {
  const [challenges, setChallenges] = useState<FiatChallenge[]>([]);

  async function load() {
    const res = await fetch('/api/challenges', { cache: 'no-store' });
    const data = await res.json();
    setChallenges(data.challenges ?? []);
  }

  useEffect(() => {
    load().catch(() => setChallenges([]));
  }, []);

  async function fund(id: string, side: 'creator' | 'opponent') {
    await fetch(`/api/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side }),
    });
    await load();
  }

  return (
    <div className="grid grid-2">
      {challenges.map((challenge) => (
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
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            {!challenge.creatorFunded ? <button className="buttonSecondary" onClick={() => fund(challenge.id, 'creator')}>Mark creator funded</button> : null}
            {!challenge.opponentFunded ? <button className="buttonSecondary" onClick={() => fund(challenge.id, 'opponent')}>Mark opponent funded</button> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
