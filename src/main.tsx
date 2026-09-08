import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuth } from './contexts/AuthContext';
import App from './App.tsx';
import ResetPasswordPage from './components/ResetPasswordPage';
import LandingPage from './pages/LandingPage/LandingPage';
import ProviderSignup from './pages/ProviderSignup';
import AccountSettings from './pages/AccountSettings';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

function Root() {
  const { user, loading } = useAuth();
  const pathname = window.location.pathname;

  if (loading) {
    return (
      <div className="landing-loading">
        <div className="landing-loading-mark">OS</div>
        <span>Loading OmniServe…</span>
      </div>
    );
  }

  if (pathname === '/auth/reset-password') {
    return <ResetPasswordPage />;
  }

  if (pathname === '/provider/signup') {
    return <ProviderSignup />;
  }

  if (pathname === '/settings') {
    if (!user) {
      window.location.href = '/';
      return null;
    }

    return <AccountSettings />;
  }

  if (pathname === '/admin') {
    if (!user) {
      window.location.href = '/';
      return null;
    }

    if (user.role !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Access denied
            </h1>
            <p className="mt-2 text-slate-600">
              You do not have permission to access the admin dashboard.
            </p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="mt-5 px-4 py-2 rounded-lg bg-slate-900 text-white"
            >
              Return home
            </button>
          </div>
        </div>
      );
    }

    return <AdminDashboard />;
  }

  if (user) {
    return <App />;
  }

  return <LandingPage />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);