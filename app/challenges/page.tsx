'use client';

import { useEffect, useState } from 'react';
import { TopTabs } from '../../components/top-tabs';
import { ChallengeList } from '../../components/challenge-list';
import { supabase } from '../../lib/supabase';

export default function ChallengesPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    });
  }, []);

  return (
    <main className="shell grid" style={{ gap: 24 }}>
      <TopTabs />
      <section className="grid" style={{ gap: 16 }}>
        <div>
          <p className="badge">Challenges</p>
          <h1 style={{ margin: '14px 0 8px', fontSize: 40 }}>Funding and settlement queue</h1>
          <p className="muted">{loading ? 'Checking auth…' : email ? `Showing challenges for ${email}` : 'Sign in to see challenges tied to your account.'}</p>
        </div>
        {!loading ? <ChallengeList viewerEmail={email} /> : null}
      </section>
    </main>
  );
}
