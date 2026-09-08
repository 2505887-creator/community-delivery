import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface RegisterModalProps {
  onClose: () => void;
  onRegistered: () => void;
}

export default function RegisterModal({ onClose, onRegistered }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('tenant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  
  const { signUp } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signUp(email, password, name, selectedRole);
      
      if (!result.success) {
        setError(result.error || 'Sign up failed');
        setLoading(false);
        return;
      }

      if (result.needsEmailConfirmation) {
        setNeedsEmailConfirmation(true);
        setError('');
      } else {
        // Account created and authenticated
        onRegistered();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (needsEmailConfirmation) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
          <h2 className="font-bold text-xl text-slate-900">Check Your Email</h2>
          <p className="text-sm text-slate-600">
            We've sent a confirmation link to <strong>{email}</strong>. Click it to verify your account and get started.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl space-y-6">
        <div>
          <h2 className="font-bold text-xl text-slate-900">Create Account</h2>
          <p className="text-sm text-slate-500 mt-1">Join OmniServe today</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Sign up as:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['tenant', 'provider', 'driver', 'merchant'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role as UserRole)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedRole === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-sm rounded-lg transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}