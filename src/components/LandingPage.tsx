import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Menu,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import '../../styles/landing.css';

const services = [
  {
    icon: Wrench,
    title: 'Trusted local services',
    text: 'Find verified plumbers, electricians, cleaners, carpenters and other skilled professionals close to you.',
  },
  {
    icon: Truck,
    title: 'Delivery that moves',
    text: 'Send groceries, pharmacy items, parcels and everyday essentials across your neighbourhood.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'More opportunities',
    text: 'Local providers can receive jobs, build their reputation and grow a sustainable business.',
  },
];

const steps = [
  ['01', 'Tell us what you need', 'Choose a service, delivery or local provider.'],
  ['02', 'Match with someone nearby', 'See trusted providers and clear job details before you book.'],
  ['03', 'Track it from start to finish', 'Stay updated while your order or service moves forward.'],
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => setCompact(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={`ld-navbar ${compact ? 'compact' : ''}`}>
      <div className="container ld-navbar-inner">
        <a href="/" className="ld-brand" aria-label="OmniServe home">
          <span className="ld-brand-mark">
            <span className="brand-ring" />
            <span className="brand-dot" />
          </span>
          <span className="ld-brand-text">
            <strong>OmniServe</strong>
            <small>Community network</small>
          </span>
        </a>

        <nav className={`ld-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
          <a href="#features" onClick={close}>Services</a>
          <a href="#how" onClick={close}>How it works</a>
          <a href="#about" onClick={close}>Our community</a>
          <a href="#help" onClick={close}>Help</a>
          <div className="ld-nav-actions">
            <a href="/login" className="ld-signin">Sign in</a>
            <a href="/customer/signup" className="btn btn-primary btn-small">
              Get started <ArrowRight size={15} />
            </a>
          </div>
        </nav>

        <button
          type="button"
          className="ld-mobile-toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="landing-hero">
      <div className="hero-copy">
        <div className="hero-location">
          <span className="location-pulse" />
          <MapPin size={14} />
          <span>Built around local communities</span>
        </div>

        <p className="eyebrow">SERVICES • DELIVERY • OPPORTUNITIES</p>

        <h1 className="hero-headline">
          Get things done.
          <span>Keep community moving.</span>
        </h1>

        <p className="hero-sub">
          OmniServe connects residents with trusted local professionals, merchants and
          drivers — making everyday services and deliveries easier, clearer and closer
          to home.
        </p>

        <div className="hero-actions">
          <a href="/customer/signup" className="btn btn-primary">
            Find a service <ArrowRight size={17} />
          </a>
          <a href="/provider/signup" className="btn btn-ghost">Earn with your skills</a>
        </div>

        <div className="hero-proof">
          <div className="proof-avatars" aria-hidden>
            <span>J</span><span>A</span><span>M</span><span>+</span>
          </div>
          <div>
            <div className="proof-rating">
              <Star size={14} fill="currentColor" />
              <strong>Trusted local network</strong>
            </div>
            <p>Residents, drivers and skilled providers on one platform.</p>
          </div>
        </div>

        <div className="hero-mini-points">
          <span><ShieldCheck size={15} /> Verified providers</span>
          <span><Clock3 size={15} /> Live status</span>
          <span><CheckCircle2 size={15} /> Clear pricing</span>
        </div>
      </div>

      <div className="hero-visual-wrap">
        <div className="hero-sun" />
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />

        <div className="hero-phone">
          <div className="phone-notch" />
          <div className="phone-top">
            <div>
              <small>Good afternoon</small>
              <strong>What can we help with?</strong>
            </div>
            <div className="phone-avatar">OS</div>
          </div>

          <div className="phone-search">
            <MapPin size={15} />
            <span>Search services near you</span>
          </div>

          <div className="phone-section-title">
            <strong>Popular nearby</strong>
            <span>View all</span>
          </div>

          <div className="phone-services">
            <div className="phone-service service-green">
              <Wrench size={19} /><strong>Repairs</strong><small>12 pros</small>
            </div>
            <div className="phone-service service-gold">
              <Truck size={19} /><strong>Delivery</strong><small>Fast nearby</small>
            </div>
            <div className="phone-service service-orange">
              <span className="service-emoji">🛒</span><strong>Groceries</strong><small>Local stores</small>
            </div>
          </div>

          <div className="phone-order-card">
            <div className="order-card-head">
              <span className="status-pill">● ON THE WAY</span><span>#OS-2841</span>
            </div>
            <div className="order-route">
              <div className="route-icon"><Truck size={16} /></div>
              <div><strong>Essential delivery</strong><span>Driver is nearby • ETA 8 min</span></div>
            </div>
            <div className="phone-progress"><span /></div>
          </div>

          <div className="phone-bottom-nav">
            <span className="active">Home</span><span>Orders</span><span>Messages</span><span>Profile</span>
          </div>
        </div>

        <div className="floating-card floating-job">
          <div className="floating-icon"><Wrench size={16} /></div>
          <div><strong>New service request</strong><span>Plumbing • 1.8 km away</span></div>
        </div>

        <div className="floating-card floating-verified">
          <CheckCircle2 size={19} />
          <div><strong>Verified provider</strong><span>4.9 ★ • 120+ jobs</span></div>
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    [ShieldCheck, 'Verified', 'Trusted providers'],
    [Zap, 'Fast', 'Nearby help & delivery'],
    [Star, 'Rated', 'Community feedback'],
    [Smartphone, 'Mobile-first', 'Made for everyday use'],
  ];

  return (
    <div className="trust-strip" role="region" aria-label="OmniServe benefits">
      {items.map(([Icon, label, text]) => (
        <div className="trust-item" key={String(label)}>
          <div className="trust-icon"><Icon size={17} /></div>
          <div><strong>{label as string}</strong><span>{text as string}</span></div>
        </div>
      ))}
      <div className="trust-live"><CheckCircle2 size={16} /> Designed for African communities</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />

      <main>
        <section className="landing-hero-shell">
          <div className="container"><Hero /></div>
        </section>

        <div className="container"><TrustStrip /></div>

        <section id="features" className="landing-section">
          <div className="container">
            <div className="section-heading">
              <span className="section-kicker">ONE COMMUNITY. MANY SOLUTIONS.</span>
              <h2>Everything your neighbourhood needs, in one place.</h2>
              <p>
                OmniServe brings residents, skilled providers, merchants and drivers
                together around the way African communities already work: local, practical
                and people-first.
              </p>
            </div>

            <div className="features-grid">
              {services.map(({ icon: Icon, title, text }) => (
                <article className="feature-card" key={title}>
                  <div className="icon-circle"><Icon size={22} /></div>
                  <h3 className="feature-title">{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>

            <div className="community-banner">
              <div className="community-banner-copy">
                <span className="section-kicker">MADE FOR THE WAY WE LIVE</span>
                <h3>From the estate gate to the doorstep.</h3>
                <p>
                  Whether it is a leaking tap in Kilimani, groceries for a family in
                  Ruaka, or a parcel heading across town, the platform keeps the whole
                  journey visible.
                </p>
              </div>
              <div className="community-points">
                <div><CheckCircle2 size={18} /> Local providers</div>
                <div><CheckCircle2 size={18} /> Clear job status</div>
                <div><CheckCircle2 size={18} /> Mobile-first experience</div>
                <div><CheckCircle2 size={18} /> Secure account access</div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="landing-section landing-section-soft">
          <div className="container how-grid">
            <div>
              <span className="section-kicker">HOW IT WORKS</span>
              <h2>Simple enough for everyday use.</h2>
              <p className="section-lead">
                No complicated process. Choose what you need, connect with the right
                person and follow the progress.
              </p>
              <div className="steps-list">
                {steps.map(([number, title, text]) => (
                  <div className="step-row" key={number}>
                    <span className="step-number">{number}</span>
                    <div><h3>{title}</h3><p>{text}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="africa-card">
              <div className="africa-card-top">
                <div>
                  <span className="live-dot">● LIVE COMMUNITY NETWORK</span>
                  <h3>People serving people.</h3>
                </div>
                <MapPin size={25} />
              </div>

              <div className="network-map">
                <span className="map-label label-one">Nairobi</span>
                <span className="map-label label-two">Westlands</span>
                <span className="map-label label-three">Kilimani</span>
                <span className="map-label label-four">Ruaka</span>
                <div className="route route-one" /><div className="route route-two" />
                <div className="map-pin pin-one"><Wrench size={13} /></div>
                <div className="map-pin pin-two"><Truck size={13} /></div>
                <div className="map-pin pin-three"><Smartphone size={13} /></div>
              </div>

              <div className="africa-card-footer">
                <span><Clock3 size={15} /> Real-time updates</span>
                <span><ShieldCheck size={15} /> Verified network</span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="landing-section">
          <div className="container values-grid">
            <div className="value-panel">
              <span className="section-kicker">WHY OMNISERVE</span>
              <h2>Technology with a local heartbeat.</h2>
              <p>
                We are building more than a delivery marketplace. OmniServe is designed
                to help communities discover reliable help while giving local businesses
                and skilled workers a digital place to grow.
              </p>
              <a className="text-link" href="/provider/signup">Become a provider <ArrowRight size={17} /></a>
            </div>

            <div className="values-list">
              <div><span>01</span><h3>Trust first</h3><p>Profiles, ratings and verification help customers make confident choices.</p></div>
              <div><span>02</span><h3>Local by design</h3><p>Neighbourhood context, practical services and local providers stay at the centre.</p></div>
              <div><span>03</span><h3>Built to grow</h3><p>The same platform can support residents today and a wider provider network tomorrow.</p></div>
            </div>
          </div>
        </section>

        <section id="help" className="container">
          <div className="final-cta">
            <div>
              <span className="section-kicker">READY WHEN YOU ARE</span>
              <h2>Need something done?</h2>
              <p>Find a trusted local service or start building your provider profile.</p>
            </div>
            <div className="cta-actions">
              <a href="/customer/signup" className="btn btn-white">Get started <ArrowRight size={17} /></a>
              <a href="/provider/signup" className="btn btn-outline-white">Join as a provider</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container footer-inner">
          <div>
            <strong>OmniServe</strong>
            <span>Local services. Local people. One connected community.</span>
          </div>
          <div className="footer-note">Built for African communities • © {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
