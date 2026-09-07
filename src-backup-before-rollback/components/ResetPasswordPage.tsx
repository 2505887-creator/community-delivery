import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Rendered at /auth/reset-password. Supabase's reset-password email link
 * lands here with a recovery session already attached (handled by
 * detectSessionInUrl: true in src/lib/supabaseClient.ts), so this page just
 * needs to collect and submit the new password.
 */
export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) {
        setError(result.error || 'Could not update password');
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl">
        {done ? (
          <div className="text-center">
            <ShieldCheck className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h1 className="font-display font-bold text-slate-900 text-xl mb-2">Password updated</h1>
            <p className="text-sm text-slate-600 mb-4">
              You're signed in with your new password. You can close this tab and return to the app.
            </p>
            <a href="/" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">
              Go to app
            </a>
          </div>
        ) : (
          <>
            <h1 className="font-display font-bold text-slate-900 text-xl mb-1">Choose a new password</h1>
            <p className="text-sm text-slate-500 mb-6">This link is single-use and expires shortly.</p>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="text-xs font-semibold text-slate-600">New password</label>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-600">Confirm password</label>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
