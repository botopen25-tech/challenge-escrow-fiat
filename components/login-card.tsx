'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

export function LoginCard() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Sending magic link...');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Magic link sent. Check your email.');
  }

  return (
    <section className="card">
      <p className="badge">Login</p>
      <h2 style={{ margin: '14px 0 8px', fontSize: 32 }}>Magic link sign in</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        Sign in with email to create and manage fiat challenges.
      </p>
      <form onSubmit={onSubmit}>
        <label>
          <div style={{ marginBottom: 8 }}>Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="buttonPrimary" type="submit">Send magic link</button>
        </div>
      </form>
      {message ? <p style={{ marginTop: 16 }} className="muted">{message}</p> : null}
    </section>
  );
}
