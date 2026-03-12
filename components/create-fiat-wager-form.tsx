'use client';

import { FormEvent, useState } from 'react';

export function CreateFiatWagerForm({ creatorEmail }: { creatorEmail: string }) {
  const [form, setForm] = useState({ title: '', opponent: '', opponentPayoutEmail: '', stake: '', rules: '' });
  const [message, setMessage] = useState('');
  const [createdId, setCreatedId] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setCreatedId('');
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        creator: creatorEmail,
        creatorPayoutEmail: creatorEmail,
        opponentPayoutEmail: form.opponentPayoutEmail || form.opponent,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Could not create challenge');
      return;
    }
    setCreatedId(data.challenge.id);
    setMessage('Draft challenge created. Next step is creator funding.');
    setForm({ title: '', opponent: '', opponentPayoutEmail: '', stake: '', rules: '' });
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <p className="badge">Create wager</p>
      <h1 style={{ margin: '14px 0 8px', fontSize: 40 }}>Create a funded challenge</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Signed in as <strong style={{ color: 'white' }}>{creatorEmail}</strong>. This challenge will belong to your account.</p>
      <div className="grid grid-2">
        <label><div style={{ marginBottom: 8 }}>Creator</div><input value={creatorEmail} readOnly /></label>
        <label><div style={{ marginBottom: 8 }}>Opponent</div><input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="Friend email or username" /></label>
        <label><div style={{ marginBottom: 8 }}>Creator payout email</div><input value={creatorEmail} readOnly /></label>
        <label><div style={{ marginBottom: 8 }}>Opponent payout email</div><input value={form.opponentPayoutEmail} onChange={(e) => setForm({ ...form, opponentPayoutEmail: e.target.value })} placeholder="Optional — defaults to opponent field" /></label>
        <label><div style={{ marginBottom: 8 }}>Stake</div><input value={form.stake} onChange={(e) => setForm({ ...form, stake: e.target.value })} placeholder="$25" /></label>
        <label><div style={{ marginBottom: 8 }}>Title</div><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Friday workout challenge" /></label>
      </div>
      <label style={{ display: 'block', marginTop: 20 }}><div style={{ marginBottom: 8 }}>Rules</div><textarea rows={5} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="How the winner is determined, proof rules, refund timing..." /></label>
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}><button className="buttonPrimary" type="submit">Create draft wager</button></div>
      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}
      {createdId ? <p className="muted" style={{ marginTop: 8 }}>Challenge ID: {createdId}</p> : null}
    </form>
  );
}
