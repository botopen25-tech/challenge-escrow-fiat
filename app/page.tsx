import { TopTabs } from '../components/top-tabs';
import Link from 'next/link';
import { AuthShell } from '../components/auth-shell';

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
        <AuthShell />
      </section>
    </main>
  );
}
