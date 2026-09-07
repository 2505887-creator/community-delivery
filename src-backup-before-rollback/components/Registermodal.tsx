import React, { useState } from 'react';
import { User, Lock, Mail, X, MailCheck } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth, SELF_SERVICE_ROLES } from '../contexts/AuthContext';

interface RegisterModalProps {
  onClose: () => void;
  onRegistered?: () => void;
}

export default function RegisterModal({ onClose, onRegistered }: RegisterModalProps) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signUp(email, password, name, role);
      if (!result.success) {
        setError(result.error || 'Registration failed');
        return;
      }
      if (result.needsEmailConfirmation) {
        setAwaitingConfirmation(true);
        return;
      }
      onRegistered?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl text-center">
          <MailCheck className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-slate-900 text-lg mb-2">Check your email</h3>
          <p className="text-sm text-slate-600 mb-4">
            We sent a verification link to <span className="font-semibold">{email}</span>. Confirm it
            to activate your {role} account, then sign in.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">JV</div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Create your OmniServe account</h3>
              <p className="text-xs text-slate-500">Join as a tenant, provider, driver, or store</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="text-xs font-semibold text-slate-600">Name</label>
            <div className="mt-1 relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your name"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="text-xs font-semibold text-slate-600">Email</label>
            <div className="mt-1 relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-password" className="text-xs font-semibold text-slate-600">Password</label>
            <div className="mt-1 relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Choose a strong password (min 8 characters)"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Account type</label>
            <div className="mt-1 flex gap-2 text-xs flex-wrap">
              {SELF_SERVICE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-1 rounded-full border capitalize ${
                    role === r ? 'bg-slate-900 text-white' : 'bg-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Admin accounts are granted manually and can't be self-registered.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
