import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ResetPasswordPage from './components/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Landing page lazy import to avoid bundling when not used heavily
const isLandingRoute = window.location.pathname === '/';
let LandingPage: any = null;
if (isLandingRoute) {
  // dynamic import to keep initial bundle small for SPA users
  LandingPage = (await import('./pages/LandingPage/LandingPage')).default;
}

function Root() {
  const isResetPasswordRoute = window.location.pathname === '/auth/reset-password';
  if (isResetPasswordRoute) return <ResetPasswordPage />;
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
