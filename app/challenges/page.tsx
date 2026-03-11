import { TopTabs } from '../../components/top-tabs';
import { ChallengeList } from '../../components/challenge-list';

export default function ChallengesPage() {
  return (
    <main className="shell grid" style={{ gap: 24 }}>
      <TopTabs />
      <section className="grid" style={{ gap: 16 }}>
        <div>
          <p className="badge">Challenges</p>
          <h1 style={{ margin: '14px 0 8px', fontSize: 40 }}>Funding and settlement queue</h1>
          <p className="muted">Live draft board for the non-crypto challenge flow.</p>
        </div>
        <ChallengeList />
      </section>
    </main>
  );
}
