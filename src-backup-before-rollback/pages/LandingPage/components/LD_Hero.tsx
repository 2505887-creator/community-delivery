import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export default function LD_Hero() {
  return (
    <div className="hero-inner">
      <div className="hero-copy">
        <p className="eyebrow">DELIVERY • COMMERCE • JOBS</p>

        <h1>
          Fast delivery. Local services.{' '}
          <span>One platform.</span>
        </h1>

        <p className="hero-description">
          OmniServe connects residents, local providers, merchants, and
          delivery professionals in one trusted platform built for modern
          communities.
        </p>

        <div className="hero-actions">
          <a
            href="/customer/signup"
            className="primary-btn"
            aria-label="Get started with OmniServe"
          >
            Get Started
            <ArrowRight size={18} aria-hidden="true" />
          </a>

          <a
            href="/provider/signup"
            className="secondary-btn"
            aria-label="Become an OmniServe provider"
          >
            Become a Provider
          </a>
        </div>

        <div className="hero-trust" aria-label="OmniServe benefits">
          <div className="hero-trust-item">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Trusted local providers</span>
          </div>

          <div className="hero-trust-item">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Secure payments</span>
          </div>

          <div className="hero-trust-item">
            <MapPin size={18} aria-hidden="true" />
            <span>Real-time updates</span>
          </div>
        </div>
      </div>

      <div className="hero-product" aria-label="OmniServe product preview">
        <div className="phone">
          <div className="phone-screen">
            <div className="phone-header">
              <div>
                <span className="phone-label">Welcome back</span>
                <strong>OmniServe</strong>
              </div>

              <div className="phone-avatar">OS</div>
            </div>

            <div className="phone-location">
              <MapPin size={15} aria-hidden="true" />
              <span>Your community</span>
            </div>

            <div className="phone-card">
              <div className="phone-card-top">
                <span>Active delivery</span>
                <span className="status-pill">On the way</span>
              </div>

              <strong>Water Delivery</strong>

              <div className="delivery-progress">
                <span className="progress-dot active" />
                <span className="progress-line active" />
                <span className="progress-dot active" />
                <span className="progress-line" />
                <span className="progress-dot" />
              </div>

              <div className="delivery-labels">
                <span>Confirmed</span>
                <span>On the way</span>
                <span>Delivered</span>
              </div>
            </div>

            <div className="phone-section-title">
              <strong>Popular services</strong>
              <span>View all</span>
            </div>

            <div className="phone-services">
              <div className="phone-service">
                <div className="phone-service-icon">💧</div>
                <span>Water</span>
              </div>

              <div className="phone-service">
                <div className="phone-service-icon">🛒</div>
                <span>Shopping</span>
              </div>

              <div className="phone-service">
                <div className="phone-service-icon">📦</div>
                <span>Delivery</span>
              </div>
            </div>

            <div className="phone-bottom-nav">
              <span className="active">Home</span>
              <span>Orders</span>
              <span>Services</span>
              <span>Profile</span>
            </div>
          </div>
        </div>

        <div className="floating-tag floating-tag-top">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>Trusted service</span>
        </div>

        <div className="floating-tag floating-tag-bottom">
          <MapPin size={16} aria-hidden="true" />
          <span>Live tracking</span>
        </div>
      </div>
    </div>
  );
}
