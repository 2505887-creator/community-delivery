import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function ProviderSignup() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [license, setLicense] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password || !confirm) {
      setError('Please fill the required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUp(email.trim(), password, name.trim(), 'provider');
      if (!res.success) {
        setError(res.error || 'Failed to sign up');
        setLoading(false);
        return;
      }

      if (res.needsEmailConfirmation) {
        setMessage('Check your email to confirm your provider account.');
        setLoading(false);
        return;
      }

      // Optionally persist provider metadata via a backend API (license, phone, vehicle)
      // We'll POST to /api/providers to save additional info if the endpoint exists.
      try {
        await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, license, vehicle }),
        });
      } catch (err) {
        // non-fatal; it's fine if backend isn't wired yet
        console.warn('Failed to post provider metadata:', err);
      }

      // Redirect to login (or root) after successful sign-up
      window.location.href = '/login';
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Sign up failed');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{padding:'48px 20px',maxWidth:760}}>
      <div className="card" style={{display:'flex',gap:24,alignItems:'stretch'}}>
        <div style={{flex:1}}>
          <h1 style={{fontSize:28,margin:0,fontWeight:800}}>Create a Provider Account</h1>
          <p style={{color:'var(--muted)',marginTop:8}}>Join OmniServe as a provider — get access to jobs, fast payouts and tools to manage your work.</p>

          <form onSubmit={onSubmit} style={{marginTop:18,display:'grid',gap:12}} aria-label="Provider sign up form">
            <label className="sr-only">Full name
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="" aria-label="Full name" />
            </label>

            <label className="sr-only">Email
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" aria-label="Email address" />
            </label>

            <label className="sr-only">Phone
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" aria-label="Phone number" />
            </label>

            <label className="sr-only">Password
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" aria-label="Password" />
            </label>

            <label className="sr-only">Confirm password
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" aria-label="Confirm password" />
            </label>

            <label className="sr-only">License / ID (optional)
              <input value={license} onChange={e => setLicense(e.target.value)} placeholder="License or ID (optional)" aria-label="License or ID" />
            </label>

            <label className="sr-only">Vehicle / Equipment (optional)
              <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Vehicle / Equipment (optional)" aria-label="Vehicle or equipment" />
            </label>

            {error && <div role="alert" style={{color:'crimson',fontWeight:700}}>{error}</div>}
            {message && <div role="status" style={{color:'var(--primary)',fontWeight:700}}>{message}</div>}

            <div style={{display:'flex',gap:12,marginTop:8}}>
              <button type="submit" className="btn btn-primary" disabled={loading} aria-disabled={loading}>{loading ? 'Creating...' : 'Create Provider Account'}</button>
              <a href="/login" className="btn btn-ghost">Sign in</a>
            </div>

            <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>By creating an account you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</div>
          </form>
        </div>

        <div style={{width:320,display:'flex',flexDirection:'column',gap:12,justifyContent:'center'}}>
          <div style={{padding:16,background:'linear-gradient(180deg,var(--primary-light),#ffffff)',borderRadius:12}}>
            <div style={{fontWeight:800}}>Provider tools</div>
            <ul style={{marginTop:8,fontSize:13,color:'var(--muted)'}}>
              <li>Fast payouts</li>
              <li>Performance analytics</li>
              <li>Availability &amp; service area</li>
            </ul>
          </div>

          <div style={{padding:12,fontSize:13,color:'var(--muted)'}}>Have questions? Contact <a href="mailto:support@communitydelivery.co.ke">support@communitydelivery.co.ke</a></div>
        </div>
      </div>
    </div>
  );
}
