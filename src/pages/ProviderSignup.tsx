import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Wrench, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import '../styles/landing.css';

export default function ProviderSignup() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [license, setLicense] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [category, setCategory] = useState('plumbing');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null);
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirm) return setError('Please complete all required fields.');
    if (password.length < 8) return setError('Use a password with at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, name.trim(), 'provider', { phone: phone.trim(), licenseNumber: license.trim(), vehicle: vehicle.trim(), category });
      if (!result.success) { setError(result.error || 'Could not create your account.'); setLoading(false); return; }
      if (result.needsEmailConfirmation) {
        setMessage('Account created. Confirm your email, then sign in. Your provider workspace will be initialized automatically.');
        setLoading(false); return;
      }
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setMessage('Account created. Sign in to continue your provider setup.'); setLoading(false); return; }
      const response = await fetch('/api/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), category, title: 'Local service professional', hourlyRate: 1200, phone: phone.trim(), licenseNumber: license.trim() || undefined, bio: vehicle.trim() ? `Equipment / vehicle: ${vehicle.trim()}` : undefined, lat: -1.2864, lng: 36.8172, address: 'Nairobi, Kenya' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setError(payload.error || 'Your account was created, but the provider profile could not be saved.'); setLoading(false); return; }
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.message || 'Provider registration failed.'); setLoading(false);
    }
  };

  return <div className="provider-signup-page">
    <div className="provider-signup-visual">
      <div className="provider-signup-glow" />
      <div className="landing-container provider-signup-inner">
        <a className="signup-brand" href="/"><span className="brand-mark"><span /><i /></span><span><strong>OmniServe</strong><small>Delivery • Commerce • Jobs</small></span></a>
        <div className="signup-hero-copy"><p className="eyebrow">JOIN THE LOCAL NETWORK</p><h1>Turn your skills into <span>new opportunities.</span></h1><p>Build your provider profile, receive nearby requests and keep every job in one professional workspace.</p><div className="signup-benefits"><span><ShieldCheck size={16} /> Verified profile</span><span><Wrench size={16} /> Local service requests</span><span><Truck size={16} /> Flexible work</span></div></div>
      </div>
    </div>
    <div className="provider-signup-panel">
      <div className="signup-form-wrap"><div className="mobile-signup-brand"><a href="/" className="brand"><span className="brand-mark"><span /><i /></span><span><strong>OmniServe</strong><small>Delivery • Commerce • Jobs</small></span></a></div><p className="eyebrow">PROVIDER ACCOUNT</p><h2>Create your provider account</h2><p className="signup-muted">Start with the basics. You can refine your service profile later.</p>
        <form onSubmit={onSubmit} className="provider-form">
          <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Brian Otieno" autoComplete="name" /></label>
          <div className="form-two"><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label><label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07xx xxx xxx" autoComplete="tel" /></label></div>
          <div className="form-two"><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" /></label><label>Confirm password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" /></label></div>
          <label>Primary service<select value={category} onChange={e => setCategory(e.target.value)}><option value="plumbing">Plumbing</option><option value="electrical">Electrical</option><option value="cleaning">Cleaning</option><option value="carpentry">Carpentry</option><option value="appliances">Appliances</option></select></label>
          <div className="form-two"><label>License / ID <span>optional</span><input value={license} onChange={e => setLicense(e.target.value)} placeholder="Licence or ID number" /></label><label>Vehicle / equipment <span>optional</span><input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Boda, tools, van..." /></label></div>
          {error && <div className="signup-alert error" role="alert">{error}</div>}{message && <div className="signup-alert success" role="status"><CheckCircle2 size={16} />{message}</div>}
          <button className="signup-submit" disabled={loading}>{loading ? 'Creating account…' : <>Create provider account <ArrowRight size={16} /></>}</button>
          <p className="signup-terms">By continuing, you agree to the OmniServe terms and privacy policy.</p>
        </form>
        <p className="signup-login">Already have an account? <a href="/login">Sign in</a></p>
      </div>
    </div>
  </div>;
}
