import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface LoginModalProps {
  initialRole?: UserRole | 'admin';
  onClose: () => void;
  onLoggedIn: () => void;
  onForgotPassword?: () => void;
}

export default function LoginModal({ 
  initialRole = 'tenant', 
  onClose, 
  onLoggedIn,
  onForgotPassword 
}: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'admin'>(initialRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (!result.success) {
        setError(result.error || 'Sign in failed');
        setLoading(false);
        return;
      }

      // Check if user's role matches selected role (for multi-role users)
      const userRole = result.role;
      if (userRole !== selectedRole && userRole !== 'admin') {
        setError(`Your account is registered as a ${userRole}. You cannot sign in as a ${selectedRole}.`);
        setLoading(false);
        return;
      }

      // Success - trigger callback and close modal
      onLoggedIn();
      onClose();
      
      // Auth state change will automatically trigger main.tsx routing to App
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl space-y-6">
        <div>
          <h2 className="font-bold text-xl text-slate-900">Sign In</h2>
          <p className="text-sm text-slate-500 mt-1">Access your OmniServe account</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Sign in as:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['tenant', 'provider', 'driver'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
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

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-sm rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password Link */}
        {onForgotPassword && (
          <button
            onClick={onForgotPassword}
            className="w-full text-center text-xs text-blue-600 hover:text-blue-500 font-semibold"
          >
            Forgot your password?
          </button>
        )}

        {/* Close Button */}
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