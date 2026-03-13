'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FiatChallenge } from '../lib/challenge-store';

function formatResolution(challenge: FiatChallenge) {
  if (!challenge.resolution) return 'Not resolved yet';
  if (challenge.resolution === 'creator') return challenge.status === 'Paid out' ? `Creator payout sent (${challenge.payoutTarget})` : `Creator payout queued (${challenge.payoutTarget})`;
  if (challenge.resolution === 'opponent') return challenge.status === 'Paid out' ? `Opponent payout sent (${challenge.payoutTarget})` : `Opponent payout queued (${challenge.payoutTarget})`;
  if (challenge.status === 'Refunded') return 'Tie detected — both sides refunded';
  return 'Tie detected — refund path queued';
}

export function ChallengeList({ viewerEmail }: { viewerEmail?: string | null }) {
  const [challenges, setChallenges] = useState<FiatChallenge[]>([]);
  const [message, setMessage] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get('checkout');
  const connectState = searchParams.get('connect');

  async function load() {
    const res = await fetch('/api/challenges', { cache: 'no-store' });
    const data = await res.json();
    setChallenges(data.challenges ?? []);
  }

  useEffect(() => {
    load().catch(() => setChallenges([]));
  }, []);

  useEffect(() => {
    if (!checkoutState && !connectState) return;
    load().catch(() => setChallenges([]));
    const timer = window.setTimeout(() => {
      router.replace('/challenges');
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [checkoutState, connectState, router]);

  async function updateChallenge(id: string, payload: Record<string, string>) {
    setMessage('');
    setBusyKey(`${id}:${payload.type}:${payload.side ?? ''}`);
    const res = await fetch(`/api/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusyKey('');
    if (!res.ok) {
      setMessage(data.error || 'Could not update challenge');
      if (data.challenge) await load();
      return;
    }
    await load();
  }

  async function startFunding(id: string, side: 'creator' | 'opponent') {
    setMessage('');
    setBusyKey(`${id}:fund:${side}`);
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: id, side }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyKey('');
    if (!res.ok) {
      setMessage(data.error || 'Stripe checkout failed to start');
      return;
    }
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMessage('Stripe checkout did not return a redirect URL');
  }

  async function startConnectOnboarding(id: string, side: 'creator' | 'opponent') {
    setMessage('');
    setBusyKey(`${id}:connect:${side}`);
    const res = await fetch('/api/stripe/connect/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: id, side }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyKey('');
    if (!res.ok) {
      setMessage(data.error || 'Could not start Connect onboarding');
      return;
    }
    if (data.url) {
      window.location.href = data.url;
      return;
    }
  }

  async function refreshConnectStatus(id: string, side: 'creator' | 'opponent') {
    setMessage('');
    setBusyKey(`${id}:connect-status:${side}`);
    const res = await fetch('/api/stripe/connect/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: id, side }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyKey('');
    if (!res.ok) {
      setMessage(data.error || 'Could not refresh Connect status');
      return;
    }
    await load();
  }

  const normalizedViewerEmail = viewerEmail?.trim().toLowerCase() ?? null;
  const filtered = normalizedViewerEmail
    ? challenges.filter((challenge) => {
        const creator = challenge.creator?.trim().toLowerCase();
        const opponent = challenge.opponent?.trim().toLowerCase();
        const creatorPayoutEmail = challenge.creatorPayoutEmail?.trim().toLowerCase();
        const opponentPayoutEmail = challenge.opponentPayoutEmail?.trim().toLowerCase();
        return creator === normalizedViewerEmail || opponent === normalizedViewerEmail || creatorPayoutEmail === normalizedViewerEmail || opponentPayoutEmail === normalizedViewerEmail;
      })
    : challenges;

  return (
    <div className="grid" style={{ gap: 16 }}>
      {checkoutState === 'success' ? <section className="card"><p>Stripe checkout completed. Refreshing challenge state…</p></section> : null}
      {checkoutState === 'cancelled' ? <section className="card"><p>Stripe checkout was cancelled.</p></section> : null}
      {connectState === 'return' ? <section className="card"><p>Returned from Stripe Connect onboarding. Refreshing payout status…</p></section> : null}
      {connectState === 'refresh' ? <section className="card"><p>Stripe Connect asked for another pass. Try onboarding again.</p></section> : null}
      {message ? <section className="card"><p>{message}</p></section> : null}
      <div className="grid grid-2">
        {filtered.map((challenge) => {
          const creatorMatches = [challenge.creator, challenge.creatorPayoutEmail].filter(Boolean).some((value) => value?.trim().toLowerCase() === normalizedViewerEmail);
          const opponentMatches = [challenge.opponent, challenge.opponentPayoutEmail].filter(Boolean).some((value) => value?.trim().toLowerCase() === normalizedViewerEmail);
          const mySide = creatorMatches ? 'creator' : opponentMatches ? 'opponent' : null;
          const canFundCreator = mySide === 'creator' && !challenge.creatorFunded;
          const canFundOpponent = mySide === 'opponent' && !challenge.opponentFunded;
          const canVote = challenge.status === 'Waiting on results' && mySide;
          const myStripeReady = mySide === 'creator' ? challenge.creatorStripeOnboardingComplete : mySide === 'opponent' ? challenge.opponentStripeOnboardingComplete : false;
          const myStripeAccountId = mySide === 'creator' ? challenge.creatorStripeAccountId : mySide === 'opponent' ? challenge.opponentStripeAccountId : null;
          const waitingOnOtherSide = !mySide ? 'Sign in as a participant to fund this wager.' : mySide === 'creator' && !challenge.opponentFunded ? 'Opponent must log in to fund their side.' : mySide === 'opponent' && !challenge.creatorFunded ? 'Creator must log in to fund their side.' : '';

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
                <div><div className="muted">Creator payout email</div><div>{challenge.creatorPayoutEmail ?? challenge.creator}</div></div>
                <div><div className="muted">Opponent payout email</div><div>{challenge.opponentPayoutEmail ?? challenge.opponent}</div></div>
                <div><div className="muted">Creator Connect</div><div>{challenge.creatorStripeOnboardingComplete ? 'Ready' : challenge.creatorStripeAccountId ? 'Needs onboarding' : 'Not started'}</div></div>
                <div><div className="muted">Opponent Connect</div><div>{challenge.opponentStripeOnboardingComplete ? 'Ready' : challenge.opponentStripeAccountId ? 'Needs onboarding' : 'Not started'}</div></div>
                <div><div className="muted">Creator funded</div><div>{challenge.creatorFunded ? 'Yes' : 'No'}</div></div>
                <div><div className="muted">Opponent funded</div><div>{challenge.opponentFunded ? 'Yes' : 'No'}</div></div>
                <div><div className="muted">Creator result</div><div>{challenge.creatorResult ?? 'Waiting'}</div></div>
                <div><div className="muted">Opponent result</div><div>{challenge.opponentResult ?? 'Waiting'}</div></div>
                <div><div className="muted">Resolution</div><div>{formatResolution(challenge)}</div></div>
                <div><div className="muted">Payout target</div><div>{challenge.payoutTarget ?? 'None yet'}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                {mySide && !myStripeReady ? <button type="button" className="buttonSecondary" disabled={busyKey === `${challenge.id}:connect:${mySide}`} onClick={() => startConnectOnboarding(challenge.id, mySide)}>{busyKey === `${challenge.id}:connect:${mySide}` ? 'Opening Connect…' : 'Set up winner payouts'}</button> : null}
                {mySide && myStripeAccountId ? <button type="button" className="buttonSecondary" disabled={busyKey === `${challenge.id}:connect-status:${mySide}`} onClick={() => refreshConnectStatus(challenge.id, mySide)}>{busyKey === `${challenge.id}:connect-status:${mySide}` ? 'Refreshing…' : 'Refresh payout status'}</button> : null}
                {canFundCreator ? <button type="button" className="buttonSecondary" disabled={busyKey === `${challenge.id}:fund:creator`} onClick={() => startFunding(challenge.id, 'creator')}>{busyKey === `${challenge.id}:fund:creator` ? 'Opening Stripe…' : 'Fund my side'}</button> : null}
                {canFundOpponent ? <button type="button" className="buttonSecondary" disabled={busyKey === `${challenge.id}:fund:opponent`} onClick={() => startFunding(challenge.id, 'opponent')}>{busyKey === `${challenge.id}:fund:opponent` ? 'Opening Stripe…' : 'Fund my side'}</button> : null}
                {challenge.status !== 'Waiting on results' && !challenge.status.includes('processing') && waitingOnOtherSide ? <p className="muted" style={{ margin: 0 }}>{waitingOnOtherSide}</p> : null}
                {canVote ? (
                  <>
                    <button type="button" className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'result', side: mySide, choice: 'creator_won' })}>Creator won</button>
                    <button type="button" className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'result', side: mySide, choice: 'opponent_won' })}>Opponent won</button>
                    <button type="button" className="buttonSecondary" onClick={() => updateChallenge(challenge.id, { type: 'result', side: mySide, choice: 'tie' })}>Tie</button>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length ? <section className="card"><p className="muted">No challenges tied to this account yet.</p></section> : null}
    </div>
  );
}
