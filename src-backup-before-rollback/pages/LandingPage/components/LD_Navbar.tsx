
import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how' },
  { label: 'About', href: '#about' },
  { label: 'Help Center', href: '#help' },
];

export default function LD_Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="landing-nav">
      <div className="landing-container nav-inner">
        <a
          href="/"
          className="brand"
          aria-label="OmniServe home"
          onClick={closeMenu}
        >
          <span className="brand-mark" aria-hidden="true">
            OS
          </span>

          <span className="brand-copy">
            <strong>OmniServe</strong>
            <small>Delivery • Commerce • Jobs</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <ul className="main-nav-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <a href="/login" className="secondary-btn nav-signin">
              Sign In
            </a>

            <a href="/customer/signup" className="primary-btn nav-cta">
              Get Started
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {open && (
        <div className="mobile-nav">
          <div className="landing-container mobile-nav-inner">
            <nav aria-label="Mobile navigation">
              <ul className="mobile-nav-links">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} onClick={closeMenu}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mobile-nav-actions">
                <a
                  href="/login"
                  className="secondary-btn"
                  onClick={closeMenu}
                >
                  Sign In
                </a>

                <a
                  href="/customer/signup"
                  className="primary-btn"
                  onClick={closeMenu}
                >
                  Get Started
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
