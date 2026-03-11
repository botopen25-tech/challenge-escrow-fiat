'use client';

import { useEffect, useState } from 'react';
import { TopTabs } from '../../components/top-tabs';
import { CreateFiatWagerForm } from '../../components/create-fiat-wager-form';
import { supabase } from '../../lib/supabase';

export default function CreatePage() {
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
      {loading ? <section className="card"><p className="muted">Checking auth…</p></section> : null}
      {!loading && !email ? (
        <section className="card">
          <p className="badge">Auth required</p>
          <h1 style={{ margin: '14px 0 8px', fontSize: 40 }}>Sign in before creating a wager</h1>
          <p className="muted">Go back home and use the magic link login first.</p>
        </section>
      ) : null}
      {!loading && email ? <CreateFiatWagerForm /> : null}
    </main>
  );
}
