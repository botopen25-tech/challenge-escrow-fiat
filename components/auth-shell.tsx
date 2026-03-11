'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { LoginCard } from './login-card';

type SessionEmail = string | null;

export function AuthShell() {
  const [email, setEmail] = useState<SessionEmail>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
  }

  if (loading) {
    return (
      <section className="card">
        <p className="badge">Account</p>
        <h2 style={{ margin: '14px 0 8px', fontSize: 32 }}>Checking session…</h2>
        <p className="muted">Loading your auth state.</p>
      </section>
    );
  }

  if (!email) {
    return <LoginCard />;
  }

  return (
    <section className="card">
      <p className="badge">Account</p>
      <h2 style={{ margin: '14px 0 8px', fontSize: 32 }}>You’re signed in</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Signed in as <strong style={{ color: 'white' }}>{email}</strong></p>
      <div className="grid" style={{ gap: 12 }}>
        <Link className="buttonPrimary" href="/create">Create a fiat wager</Link>
        <Link className="buttonSecondary" href="/challenges">View my challenges</Link>
        <button className="buttonSecondary" onClick={signOut} type="button">Sign out</button>
      </div>
    </section>
  );
}
