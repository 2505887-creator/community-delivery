import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuth } from './contexts/AuthContext';
import App from './App.tsx';
import ResetPasswordPage from './components/ResetPasswordPage';
import LandingPage from './pages/LandingPage/LandingPage';
import ProviderSignup from './pages/ProviderSignup';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Router wrapper component that checks auth state
function Root() {
  const { user, loading } = useAuth();
  const pathname = window.location.pathname;

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="landing-loading">
        <div className="landing-loading-mark">OS</div>
        <span>Loading OmniServe…</span>
      </div>
    );
  }

  // Special routes that bypass the auth check
  if (pathname === '/auth/reset-password') {
    return <ResetPasswordPage />;
  }

  if (pathname === '/provider/signup') {
    return <ProviderSignup />;
  }

  // Landing page route - only show if NOT authenticated
  if (pathname === '/' && !user) {
    return <LandingPage />;
  }

  // If user is authenticated, always show the App (portal)
  if (user) {
    return <App />;
  }

  // If trying to access any other route without authentication, redirect to landing
  if (pathname !== '/' && !user) {
    window.location.replace('/');
    return null;
  }

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);