import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface LoginModalProps { initialRole?: UserRole | 'admin'; onClose: () => void; onLoggedIn: () => void; onForgotPassword?: () => void; }

export default function LoginModal({ initialRole = 'tenant', onClose, onLoggedIn, onForgotPassword }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'admin'>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, resendConfirmation } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) { setError(result.error || 'Sign in failed'); return; }
      if (result.role !== selectedRole && result.role !== 'admin') {
        setError(`This account is registered as a ${result.role}. Select ${result.role} to continue.`);
        await import('../lib/supabaseClient').then(({ supabase }) => supabase.auth.signOut());
        return;
      }
      onLoggedIn(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An unexpected error occurred.'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    if (!email) { setError('Enter your email first.'); return; }
    setError(''); setLoading(true);
    const result = await resendConfirmation(email);
    setLoading(false);
    setError(result.success ? 'Confirmation email sent. Check your inbox and spam folder.' : result.error || 'Could not resend the confirmation email.');
  };

  return <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="signin-title">
    <div className="auth-modal">
      <button className="auth-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
      <div className="auth-brand"><span className="auth-brand-mark">OS</span><div><strong>Omni<span>Serve</span></strong><small>Delivery • Commerce • Jobs</small></div></div>
      <div className="auth-heading"><div className="auth-icon"><ShieldCheck size={19}/></div><div><h2 id="signin-title">Welcome back</h2><p>Sign in to your OmniServe workspace.</p></div></div>
      <div className="auth-role-grid" aria-label="Account type">
        {(['tenant','provider','driver','merchant'] as UserRole[]).map(role => <button key={role} type="button" onClick={() => setSelectedRole(role)} className={selectedRole === role ? 'active' : ''}>{role === 'tenant' ? 'Customer' : role[0].toUpperCase()+role.slice(1)}</button>)}
      </div>
      <form onSubmit={handleSignIn} className="auth-form">
        <label>Email<div className="auth-input"><Mail size={16}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
        <label>Password<div className="auth-input"><LockKeyhole size={16}/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required/><button type="button" className="password-toggle" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
        {error && <div className="auth-alert" role="alert">{error}</div>}
        <button className="auth-primary" disabled={loading}>{loading ? 'Signing in…' : <>Sign in as {selectedRole === 'tenant' ? 'Customer' : selectedRole[0].toUpperCase()+selectedRole.slice(1)} <ArrowRight size={17}/></>}</button>
      </form>
      {error.toLowerCase().includes('confirm') && <button className="auth-link" onClick={resend} disabled={loading}>Resend confirmation email</button>}
      {onForgotPassword && <button className="auth-link" onClick={onForgotPassword}>Forgot your password?</button>}
      <p className="auth-foot">Secure authentication powered by Supabase.</p>
    </div>
  </div>;
}
