import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ResetPasswordPage from './components/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Route detection
const pathname = window.location.pathname;
const isLandingRoute = pathname === '/';
const isProviderSignup = pathname === '/provider/signup';
let LandingPage: any = null;
let ProviderSignup: any = null;

if (isLandingRoute) {
  LandingPage = (await import('./pages/LandingPage/LandingPage')).default;
}

if (isProviderSignup) {
  ProviderSignup = (await import('./pages/ProviderSignup')).default;
}

function Root() {
  const isResetPasswordRoute = window.location.pathname === '/auth/reset-password';
  if (isResetPasswordRoute) return <ResetPasswordPage />;
  if (isProviderSignup && ProviderSignup) return <ProviderSignup />;
  if (isLandingRoute && LandingPage) return <LandingPage />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);
