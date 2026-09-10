import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/landing.css';

export default function CustomerSignup() {
  const { signUp, resendConfirmation } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, name, 'tenant');
      if (!result.success) {
        setError(result.error || 'Could not create your account.');
        return;
      }
      if (result.needsEmailConfirmation) {
        setConfirmed(true);
        return;
      }
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    const result = await resendConfirmation(email);
    setLoading(false);
    setError(result.success ? 'Confirmation email sent again. Check your inbox and spam folder.' : result.error || 'Could not resend email.');
  };

  return (
    <div className="provider-signup-page">
      <div className="provider-signup-visual">
        <div className="provider-signup-glow" />
        <div className="landing-container provider-signup-inner">
          <a className="signup-brand" href="/">
            <span className="brand-mark"><span /><i /></span>
            <span><strong>OmniServe</strong><small>Delivery • Commerce • Jobs</small></span>
          </a>
          <div className="signup-hero-copy">
            <p className="eyebrow">CUSTOMER ACCOUNT</p>
            <h1>Everything local, <span>in one place.</span></h1>
            <p>Find verified professionals, order from local stores, request transport and keep your active jobs in one secure workspace.</p>
            <div className="signup-benefits">
              <span><ShieldCheck size={16} /> Secure account</span>
              <span><CheckCircle2 size={16} /> Verified local providers</span>
              <span><ArrowRight size={16} /> Track your requests</span>
            </div>
          </div>
        </div>
      </div>

      <div className="provider-signup-panel">
        <div className="signup-form-wrap">
          <div className="mobile-signup-brand">
            <a href="/" className="brand">
              <span className="brand-mark"><span /><i /></span>
              <span><strong>OmniServe</strong><small>Delivery • Commerce • Jobs</small></span>
            </a>
          </div>
          <p className="eyebrow">CUSTOMER ACCOUNT</p>
          <h2>Create your customer account</h2>
          <p className="signup-muted">Create an account to request services, shop locally and track orders.</p>

          {confirmed ? (
            <div className="space-y-4 mt-6">
              <div className="signup-alert success" role="status">
                <CheckCircle2 size={18} />
                <span>We sent a confirmation link to <strong>{email}</strong>. Confirm your email before signing in.</span>
              </div>
              <button className="signup-submit" onClick={resend} disabled={loading}>
                {loading ? 'Sending…' : 'Resend confirmation email'} <ArrowRight size={16} />
              </button>
              <a className="signup-login block text-center" href="/login">Return to sign in</a>
            </div>
          ) : (
            <form onSubmit={submit} className="provider-form">
              <label>Full name
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoComplete="name" required />
              </label>
              <label>Email
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
              </label>
              <label>Password
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="password-toggle" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              {error && <div className="signup-alert error" role="alert"><UserRound size={16} />{error}</div>}
              <button className="signup-submit" disabled={loading}>
                {loading ? 'Creating account…' : <>Create customer account <ArrowRight size={16} /></>}
              </button>
              <p className="signup-terms">By continuing, you agree to the OmniServe terms and privacy policy.</p>
            </form>
          )}

          {!confirmed && <p className="signup-login">Already have an account? <a href="/login">Sign in</a></p>}
        </div>
      </div>
    </div>
  );
}
