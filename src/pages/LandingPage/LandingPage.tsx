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
    if (!loading && user) { window.location.replace('/portal'); return; }
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

  if (loading || user) return <div className="landing-loading"><div className="landing-loading-mark">OS</div><span>Loading OmniServe…</span></div>;

  return <div className="landing-page">
    <LD_Navbar onSignIn={openLogin} onGetStarted={openRegister} />
    <main>
      <section className="hero" aria-label="OmniServe introduction"><div className="landing-container"><LD_Hero onGetStarted={openRegister} onProvider={() => { setLoginRole('provider'); setAuthMode('register'); }} /></div></section>
      <section className="trust-section"><div className="landing-container"><LD_TrustStrip /></div></section>

      <section id="features" className="landing-section">
        <div className="landing-container"><div className="section-heading"><span className="section-kicker">ONE CONNECTED NETWORK</span><h2>Everything local, connected in one place.</h2><p>Customers discover help, providers manage work, and drivers move orders — with one consistent OmniServe experience.</p></div>
          <div className="feature-grid">
            {[
              [ShieldCheck, 'Secure & verified', 'Role-aware accounts, verified providers and secure authentication keep every interaction accountable.'],
              [Truck, 'Real-time delivery', 'Follow active deliveries and dispatches with clear status updates from request to completion.'],
              [Wrench, 'Verified providers', 'Find plumbers, electricians, cleaners, technicians and other local professionals.'],
              [ShoppingBag, 'Local commerce', 'Connect nearby stores and customers through a single service and delivery network.'],
              [WalletCards, 'Simple payments', 'Keep service totals, delivery fees and payment methods visible before you confirm.'],
              [Users, 'Flexible work', 'Providers and drivers get focused workspaces for requests, active jobs and history.'],
            ].map(([Icon, title, description]) => { const I = Icon as typeof ShieldCheck; return <article className="feature-card" key={title as string}><div className="feature-icon"><I size={21}/></div><h3>{title as string}</h3><p>{description as string}</p><span className="feature-link">Explore <ChevronRight size={14}/></span></article>; })}
          </div>
        </div>
      </section>

      <section id="how" className="landing-section section-soft"><div className="landing-container how-grid">
        <div><span className="section-kicker">HOW IT WORKS</span><h2>One platform. Three focused experiences.</h2><p>Sign in once and OmniServe takes you directly to the workspace for your role.</p><div className="flow-card"><div className="flow-item"><span>01</span><div><strong>Customer</strong><p>Choose a service, request what you need, track the job and rate the experience.</p></div></div><div className="flow-item"><span>02</span><div><strong>Provider</strong><p>Build your profile, receive nearby requests, accept jobs and manage earnings.</p></div></div><div className="flow-item"><span>03</span><div><strong>Driver</strong><p>Go online, receive dispatches, update delivery status and complete trips.</p></div></div></div></div>
        <div className="role-preview"><div className="role-preview-top"><span className="live-dot"/> ROLE-AWARE PORTAL</div><div className="role-tabs"><span className="active"><Users size={15}/> Customer</span><span><Wrench size={15}/> Provider</span><span><Truck size={15}/> Driver</span></div><div className="role-dashboard"><div><span>Today's activity</span><strong>Everything in one workspace</strong></div><div className="mini-metrics"><div><b>Live</b><span>Requests</span></div><div><b>24/7</b><span>Access</span></div><div><b>1</b><span>Account</span></div></div><div className="route-line"><span/><i/><span/><i/><span/></div></div></div>
      </div></section>

      <section id="about" className="landing-section"><div className="landing-container about-grid"><div className="about-photo"><div className="photo-caption"><MapPin size={15}/> Nairobi, Kenya</div></div><div><span className="section-kicker">BUILT FOR AFRICAN COMMUNITIES</span><h2>Local context, professional technology.</h2><p>OmniServe is designed around the way neighbourhood services actually move: people, businesses, skilled professionals and riders working together.</p><div className="about-points"><div><CheckCircle2/><span><b>Trust first</b>Profiles, ratings and verification help people choose confidently.</span></div><div><Clock3/><span><b>Fast by design</b>Clear status, nearby providers and delivery visibility reduce uncertainty.</span></div><div><Smartphone/><span><b>Built to scale</b>A single product foundation can support more cities and service categories over time.</span></div></div></div></div></section>

      <section id="help" className="landing-section final-section"><div className="landing-container"><div className="final-cta"><div><span className="section-kicker">READY WHEN YOU ARE</span><h2>Choose your OmniServe experience.</h2><p>Sign in as a customer, provider or driver and go straight to the tools that belong to you.</p></div><div className="role-cta-grid"><button onClick={() => openLogin('tenant')}><Users/><span>Customer sign in</span><ArrowRight/></button><button onClick={() => openLogin('provider')}><Wrench/><span>Provider sign in</span><ArrowRight/></button><button onClick={() => openLogin('driver')}><Truck/><span>Driver sign in</span><ArrowRight/></button></div></div></div></section>
    </main>
    <footer className="landing-footer"><div className="landing-container footer-inner"><div><strong>OmniServe</strong><span>Delivery • Commerce • Jobs</span></div><div>Built for African communities • © {new Date().getFullYear()}</div></div></footer>

    {authMode === 'login' && <LoginModal initialRole={loginRole} onClose={() => setAuthMode(null)} onLoggedIn={() => {}} />}
    {authMode === 'register' && <RegisterModal onClose={() => setAuthMode(null)} onRegistered={() => setAuthMode('login')} />}
  </div>;
}
