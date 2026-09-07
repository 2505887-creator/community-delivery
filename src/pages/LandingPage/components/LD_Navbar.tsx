import { useState, useEffect } from 'react';
import { Menu, X, User, LogIn, ArrowRight } from 'lucide-react';

export default function LD_Navbar(){
  const [open, setOpen] = useState(false);
  // compact on scroll
  useEffect(() => {
    const onScroll = () => {
      const el = document.querySelector('.ld-navbar');
      if(!el) return;
      if(window.scrollY > 40) el.classList.add('compact'); else el.classList.remove('compact');
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  },[]);

  return (
    <header className="ld-navbar" style={{position:'sticky',top:0,zIndex:60,backdropFilter:'blur(6px)'}}>
      <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {/* Logo */}
          <a href="/" aria-label="OmniServe homepage" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
            <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0" stopColor="#0F9D76" />
                  <stop offset="1" stopColor="#08745A" />
                </linearGradient>
              </defs>
              <path d="M24 4C15.163 4 8 11.163 8 20c0 9.167 12 22 16 24 4-2 16-14.833 16-24 0-8.837-7.163-16-16-16z" fill="url(#g1)" />
              <circle cx="24" cy="18" r="5" fill="#fff" />
              <path d="M15 34c3-2 6-5 9-5s6 3 9 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            </svg>
            <div style={{lineHeight:1}}>
              <div style={{fontWeight:800,fontSize:16,color:'var(--ink)'}}>OmniServe</div>
              <div style={{fontSize:11,color:'var(--muted)',letterSpacing:'0.6px'}}>Delivery • Commerce • Jobs</div>
            </div>
          </a>
        </div>

        <nav style={{display:'flex',alignItems:'center',gap:18}} aria-label="Main navigation">
          <ul style={{display:'flex',gap:14,listStyle:'none',margin:0,padding:0}} className="ld-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#help">Help Center</a></li>
          </ul>

          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <a href="/login" className="btn btn-ghost" aria-label="Sign in">Sign In</a>
            <a href="/customer/signup" className="btn btn-primary" aria-label="Get started">Get Started <ArrowRight className="icon" /></a>
          </div>

          {/* Mobile toggle */}
          <button className="ld-mobile-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" style={{display:'none'}}>
            {open ? <X /> : <Menu />}
          </button>
        </nav>
      </div>

      {/* Simple mobile menu fallback (hidden by CSS by default) */}
      {open && (
        <div id="mobile-menu" style={{background:'white',borderTop:'1px solid var(--border)'}}>
          <div className="container" style={{padding:'12px 20px',display:'flex',flexDirection:'column',gap:8}}>
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#about">About</a>
            <a href="#help">Help Center</a>
            <a href="/login" className="btn btn-ghost">Sign In</a>
            <a href="/customer/signup" className="btn btn-primary">Get started</a>
          </div>
        </div>
      )}
    </header>
  );
}
