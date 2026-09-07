import React, { useState } from 'react';
import { User, Lock, LogIn, X, Wrench, Truck, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  onLoggedIn?: (role: UserRole | 'admin') => void;
  onForgotPassword?: () => void;
  initialRole?: UserRole;
}

const roleOptions: { value: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'tenant', label: 'Customer', description: 'Order services, shopping & delivery', icon: User },
  { value: 'provider', label: 'Provider', description: 'Manage service requests & jobs', icon: Wrench },
  { value: 'driver', label: 'Driver', description: 'Manage deliveries & dispatches', icon: Truck },
];

export default function LoginModal({ onClose, onLoggedIn, onForgotPassword, initialRole = 'tenant' }: LoginModalProps) {
  const { signIn, signOut } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Sign in failed');
        return;
      }

      if (result.role !== role && result.role !== 'admin') {
        await signOut();
        const actual = result.role === 'tenant' ? 'Customer' : result.role === 'provider' ? 'Provider' : result.role === 'driver' ? 'Driver' : 'Store';
        setError(`This account is registered as ${actual}. Choose ${actual} above to continue.`);
        return;
      }

      onLoggedIn?.(result.role);
      onClose();
      window.location.assign('/portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/15">OS</div>
            <div>
              <h3 id="login-title" className="font-display font-bold text-slate-950 text-xl">Sign in to OmniServe</h3>
              <p className="text-xs text-slate-500 mt-0.5">Use the account type that matches your OmniServe role.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label="Close">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5" aria-label="Account type">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const selected = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { setRole(option.value); setError(null); }}
                className={`text-left rounded-2xl border p-3 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${selected ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <Icon className={`w-4 h-4 mb-2 ${selected ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span className="block text-xs font-bold text-slate-900">{option.label}</span>
                <span className="block text-[10px] leading-4 text-slate-500 mt-0.5">{option.description}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold text-slate-700">Email</label>
            <div className="mt-1.5 relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">Password</label>
              {onForgotPassword && <button type="button" onClick={onForgotPassword} className="text-xs text-emerald-700 hover:underline">Forgot password?</button>}
            </div>
            <div className="mt-1.5 relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter password" className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-colors">
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in…' : `Continue as ${role === 'tenant' ? 'Customer' : role === 'provider' ? 'Provider' : 'Driver'}`}
          </button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Your account role is verified against your authenticated profile before you enter the portal.</span>
        </div>
      </div>
    </div>
  );
}
