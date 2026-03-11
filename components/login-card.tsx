export function LoginCard() {
  return (
    <section className="card">
      <p className="badge">Login</p>
      <h2 style={{ margin: '14px 0 8px', fontSize: 32 }}>Magic link sign in</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        The fiat version will use email magic links so users can fund and settle challenges without crypto wallets.
      </p>
      <label>
        <div style={{ marginBottom: 8 }}>Email</div>
        <input placeholder="you@example.com" />
      </label>
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button className="buttonPrimary">Send magic link</button>
      </div>
    </section>
  );
}
