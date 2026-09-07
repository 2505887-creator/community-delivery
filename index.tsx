import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ResetPasswordPage from './components/ResetPasswordPage';
import LandingPage from './pages/LandingPage/LandingPage';
import ProviderSignup from './pages/ProviderSignup';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

function Root() {
  const pathname = window.location.pathname;

  const isResetPasswordRoute = pathname === '/auth/reset-password';
  const isProviderSignup = pathname === '/provider/signup';
  const isLandingRoute = pathname === '/';

  if (isResetPasswordRoute) {
    return <ResetPasswordPage />;
  }

  if (isProviderSignup) {
    return <ProviderSignup />;
  }

  if (isLandingRoute) {
    return <LandingPage />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);