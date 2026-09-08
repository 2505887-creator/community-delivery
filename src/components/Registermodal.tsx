import { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck, UserRound, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface RegisterModalProps { onClose: () => void; onRegistered: () => void; }

export default function RegisterModal({ onClose, onRegistered }: RegisterModalProps) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('');
  const [selectedRole,setSelectedRole]=useState<UserRole>('tenant'); const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false); const [confirmed,setConfirmed]=useState(false);
  const { signUp, resendConfirmation } = useAuth();

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result=await signUp(email,password,name,selectedRole);
      if(!result.success){setError(result.error||'Could not create your account.');return;}
      if(result.needsEmailConfirmation){setConfirmed(true);return;}
      onRegistered(); onClose();
    } catch(err){setError(err instanceof Error?err.message:'Registration failed.');}
    finally{setLoading(false);}
  };

  const resend=async()=>{setLoading(true);const r=await resendConfirmation(email);setLoading(false);setError(r.success?'Confirmation email sent again. Check your inbox and spam folder.':r.error||'Could not resend email.');};

  if(confirmed) return <div className="auth-overlay"><div className="auth-modal auth-success">
    <button className="auth-close" onClick={onClose} aria-label="Close"><X size={18}/></button><div className="auth-success-icon"><CheckCircle2 size={32}/></div>
    <div className="auth-brand"><span className="auth-brand-mark">OS</span><div><strong>Omni<span>Serve</span></strong><small>Delivery • Commerce • Jobs</small></div></div>
    <h2>Check your inbox</h2><p>We sent a confirmation link to <strong>{email}</strong>. Confirm it before signing in.</p>
    <button className="auth-primary" onClick={resend} disabled={loading}>{loading?'Sending…':'Resend confirmation email'} <ArrowRight size={17}/></button>
    <button className="auth-secondary" onClick={onClose}>Back to OmniServe</button>
  </div></div>;

  return <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="signup-title"><div className="auth-modal auth-register">
    <button className="auth-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
    <div className="auth-brand"><span className="auth-brand-mark">OS</span><div><strong>Omni<span>Serve</span></strong><small>Delivery • Commerce • Jobs</small></div></div>
    <div className="auth-heading"><div className="auth-icon"><UserRound size={19}/></div><div><h2 id="signup-title">Create your account</h2><p>Join the local network in a few seconds.</p></div></div>
    <div className="auth-role-grid">{(['tenant','provider','driver','merchant'] as UserRole[]).map(role=><button key={role} type="button" onClick={()=>setSelectedRole(role)} className={selectedRole===role?'active':''}>{role==='tenant'?'Customer':role[0].toUpperCase()+role.slice(1)}</button>)}</div>
    <form onSubmit={submit} className="auth-form">
      <label>Full name<div className="auth-input"><UserRound size={16}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" autoComplete="name" required/></div></label>
      <label>Email<div className="auth-input"><input className="no-icon-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
      <label>Password<div className="auth-input"><input className="no-icon-input" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required/><button type="button" className="password-toggle" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
      {error&&<div className="auth-alert" role="alert">{error}</div>}
      <button className="auth-primary" disabled={loading}>{loading?'Creating account…':<>Create {selectedRole==='tenant'?'customer':selectedRole} account <ArrowRight size={17}/></>}</button>
    </form>
    <p className="auth-foot"><ShieldCheck size={13}/> We’ll send a verification email before your first sign-in.</p>
  </div></div>;
}
