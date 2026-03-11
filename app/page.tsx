import { TopTabs } from '../components/top-tabs';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="shell grid" style={{ gap: 24 }}>
      <TopTabs />
      <section className="card grid grid-2" style={{ alignItems: 'start' }}>
        <div>
          <p className="badge">ChallengeEscrow Fiat</p>
          <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: '16px 0' }}>Make the bet. Fund the pool. Settle with Stripe.</h1>
          <p className="muted" style={{ maxWidth: 560, fontSize: 18, lineHeight: 1.7 }}>
            This version keeps the same social wager idea without wallets or crypto. Both sides fund first, the challenge becomes active, and the app releases funds after agreement.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link className="buttonPrimary" href="/create">Create a fiat wager</Link>
            <Link className="buttonSecondary" href="/challenges">See challenges</Link>
          </div>
        </div>
        <div className="card" style={{ background: 'rgba(2,6,23,.45)' }}>
          <p className="badge">How it works</p>
          <div className="grid" style={{ marginTop: 16 }}>
            <div><strong>1. Create</strong><p className="muted">Set stake, opponent, and rules.</p></div>
            <div><strong>2. Fund</strong><p className="muted">Both sides fund before the challenge becomes active.</p></div>
            <div><strong>3. Agree</strong><p className="muted">When both sides agree, the app triggers payout.</p></div>
            <div><strong>4. Refund</strong><p className="muted">If not resolved in time, auto-refund is the default fallback.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
