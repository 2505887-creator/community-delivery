import { useState } from 'react';
import { ArrowRight, Menu, X, User, Wrench, Truck } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how' },
  { label: 'About', href: '#about' },
  { label: 'Help Center', href: '#help' },
];

interface Props {
  onSignIn: (role?: 'tenant' | 'provider' | 'driver') => void;
  onGetStarted: () => void;
}

export default function LD_Navbar({ onSignIn, onGetStarted }: Props) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="landing-nav">
      <div className="landing-container nav-inner">
        <a href="/" className="brand" aria-label="OmniServe home" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true"><span>OS</span></span>
          <span className="brand-copy"><strong>OmniServe</strong><small>Delivery • Commerce • Jobs</small></span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <ul className="main-nav-links">{navLinks.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>
          <div className="nav-actions">
            <button type="button" className="secondary-btn nav-signin" onClick={() => onSignIn()}>Sign In</button>
            <button type="button" className="primary-btn nav-cta" onClick={onGetStarted}>Get Started <ArrowRight size={17} aria-hidden="true" /></button>
          </div>
        </nav>

        <button type="button" className="nav-toggle" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {open && <div className="mobile-nav"><div className="landing-container mobile-nav-inner"><nav aria-label="Mobile navigation">
        <ul className="mobile-nav-links">{navLinks.map((link) => <li key={link.href}><a href={link.href} onClick={closeMenu}>{link.label}</a></li>)}</ul>
        <div className="mobile-nav-role-links">
          <button onClick={() => { onSignIn('tenant'); closeMenu(); }}><User size={16}/> Customer sign in</button>
          <button onClick={() => { onSignIn('provider'); closeMenu(); }}><Wrench size={16}/> Provider sign in</button>
          <button onClick={() => { onSignIn('driver'); closeMenu(); }}><Truck size={16}/> Driver sign in</button>
        </div>
        <div className="mobile-nav-actions">
          <button type="button" className="secondary-btn" onClick={() => { onSignIn(); closeMenu(); }}>Sign In</button>
          <button type="button" className="primary-btn" onClick={() => { onGetStarted(); closeMenu(); }}>Get Started <ArrowRight size={17} /></button>
        </div>
      </nav></div></div>}
    </header>
  );
}
