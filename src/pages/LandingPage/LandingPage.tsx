import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShieldCheck, Star, Truck, Users, Wrench, ShoppingBag, WalletCards, Smartphone, ChevronRight } from 'lucide-react';
import LD_Navbar from './components/LD_Navbar';
import LD_Hero from './components/LD_Hero';
import LD_TrustStrip from './components/LD_TrustStrip';
import LoginModal from '../../components/LoginModal';
import RegisterModal from '../../components/Registermodal';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/landing.css';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [loginRole, setLoginRole] = useState<'tenant' | 'provider' | 'driver'>('tenant');

  useEffect(() => {
    // Auto-open auth modals based on URL parameters when NOT authenticated
    if (!loading && !user) {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      const requestedRole = params.get('role');
      if (window.location.pathname === '/login' || auth === 'login') {
        if (requestedRole === 'provider' || requestedRole === 'driver' || requestedRole === 'tenant') setLoginRole(requestedRole);
        setAuthMode('login');
      }
      if (auth === 'register') setAuthMode('register');
    }
  }, [loading, user]);

  const openLogin = (role: 'tenant' | 'provider' | 'driver' = 'tenant') => { setLoginRole(role); setAuthMode('login'); };
  const openRegister = () => setAuthMode('register');

  // Show loading state
  if (loading) return <div className="landing-loading"><div className="landing-loading-mark">OS</div><span>Loading OmniServe…</span></div>;

  // This should never happen because main.tsx will show App if user exists
  // But adding as safety check
  if (user) return <div className="landing-loading"><div className="landing-loading-mark">OS</div><span>Redirecting…</span></div>;

  return <div className="landing-page">
    <LD_Navbar onSignIn={openLogin} onGetStarted={openRegister} />
    <main>
      <section className="hero" aria-label="OmniServe introduction"><div className="landing-container"><LD_Hero onGetStarted={openRegister} onProvider={() => { setLoginRole('provider'); setAuthMode('login'); }} /></div></section>
      <section className="trust-section"><div className="landing-container"><LD_TrustStrip /></div></section>

      <section id="features" className="landing-section">
        <div className="landing-container"><div className="section-heading"><span className="section-kicker">ONE CONNECTED NETWORK</span><h2>Everything local, connected in one place.</h2><p>Custom built for African communities.</p></div>
          <div className="feature-grid">
            {[
              [ShieldCheck, 'Secure & verified', 'Role-aware accounts, verified providers and secure authentication keep every interaction accountable.'],
              [Truck, 'Real-time delivery', 'Follow active deliveries and dispatches with clear status updates from request to completion.'],
              [Wrench, 'Verified providers', 'Find plumbers, electricians, cleaners, technicians and other local professionals.'],
              [ShoppingBag, 'Local commerce', 'Connect nearby stores and customers through a single service and delivery network.'],
              [WalletCards, 'Simple payments', 'Keep service totals, delivery fees and payment methods visible before you confirm.'],
              [Users, 'Flexible work', 'Providers and drivers get focused workspaces for requests, active jobs and history.'],
            ].map(([Icon, title, description]) => { const I = Icon as typeof ShieldCheck; return <article className="feature-card" key={title as string}><div className="feature-icon"><I size={21}/></div><div className="feature-text"><h3>{title as string}</h3><p>{description as string}</p></div></article>; })}
          </div>
        </div>
      </section>

      <section id="how" className="landing-section section-soft"><div className="landing-container how-grid">
        <div><span className="section-kicker">HOW IT WORKS</span><h2>One platform. Three focused experiences.</h2><p>Sign in once and OmniServe takes you directly to the workspace for your role.</p></div>
        <div className="role-preview"><div className="role-preview-top"><span className="live-dot"/> ROLE-AWARE PORTAL</div><div className="role-tabs"><span className="active"><Users size={15}/> Customer</span><span><Wrench size={15}/> Provider</span><span><Truck size={15}/> Driver</span></div><div className="role-preview-detail"><div className="role-preview-icon"><ShoppingBag size={34}/></div><div><h4>Browse & order services</h4><p>Discover verified providers and stores near you. Track orders in real-time with live GPS and secure messaging.</p></div></div></div>
      </div></section>

      <section id="about" className="landing-section"><div className="landing-container about-grid"><div className="about-photo"><div className="photo-caption"><MapPin size={15}/> Nairobi, Kenya</div></div><div className="about-copy"><span className="section-kicker">BUILT FOR YOUR COMMUNITY</span><h2>Trusted local delivery and services.</h2><p>OmniServe started as a vision to make everyday services more accessible across Africa. We started in Nairobi and are expanding rapidly.</p><ul className="about-list"><li><CheckCircle2 size={17}/><span><strong>Provider verified:</strong> Every driver, cleaner, and technician is checked and reviewed.</span></li><li><CheckCircle2 size={17}/><span><strong>Real-time tracking:</strong> Know exactly where your order is, with live GPS updates.</span></li><li><CheckCircle2 size={17}/><span><strong>Secure payments:</strong> Pay safely with support for multiple payment methods.</span></li><li><CheckCircle2 size={17}/><span><strong>Local jobs:</strong> Flexible work for drivers and service professionals.</span></li></ul></div></div></section>

      <section id="help" className="landing-section final-section"><div className="landing-container"><div className="final-cta"><div><span className="section-kicker">READY WHEN YOU ARE</span><h2>Join OmniServe today.</h2><p>Whether you're looking for fast delivery, local services, or flexible work — OmniServe connects you with what you need.</p></div><div className="final-cta-buttons"><button onClick={openRegister} className="primary-btn">Get Started Now<ArrowRight size={17}/></button><button onClick={() => openLogin('provider')} className="secondary-btn">Become a Provider<ArrowRight size={17}/></button></div></div></div></section>
    </main>
    <footer className="landing-footer"><div className="landing-container footer-inner"><div><strong>OmniServe</strong><span>Delivery • Commerce • Jobs</span></div><div><strong>Quick Links</strong><a href="#features">Features</a><a href="#how">How it works</a><a href="#about">About</a></div><div><strong>Support</strong><a href="#help">Help center</a><a href="#help">Contact us</a></div></div><div className="landing-container footer-bottom"><span>© 2024 OmniServe. All rights reserved.</span><div><a href="#">Privacy Policy</a><span>•</span><a href="#">Terms of Service</a></div></div></footer>

    {authMode === 'login' && <LoginModal initialRole={loginRole} onClose={() => setAuthMode(null)} onLoggedIn={() => {}} />}
    {authMode === 'register' && <RegisterModal onClose={() => setAuthMode(null)} onRegistered={() => setAuthMode('login')} />}
  </div>;
}
