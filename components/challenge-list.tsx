'use client';

import { useEffect, useState } from 'react';
import type { FiatChallenge } from '../lib/challenge-store';

export function ChallengeList() {
  const [challenges, setChallenges] = useState<FiatChallenge[]>([]);

  useEffect(() => {
    fetch('/api/challenges', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setChallenges(data.challenges ?? []))
      .catch(() => setChallenges([]));
  }, []);

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
          </div>
        </article>
      ))}
    </div>
  );
}
