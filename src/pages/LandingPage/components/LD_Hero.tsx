import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Search, Droplets, ShoppingBag, Wrench, Truck } from 'lucide-react';

interface Props { onGetStarted: () => void; onProvider: () => void; }

export default function LD_Hero({ onGetStarted, onProvider }: Props) {
  return <div className="hero-inner">
    <div className="hero-copy">
      <div className="hero-badge"><span className="hero-badge-dot" /> Serving communities across Africa</div>
      <p className="eyebrow">DELIVERY • COMMERCE • JOBS</p>
      <h1>Fast delivery.<br/><span>Local services.</span><br/>One platform.</h1>
      <p className="hero-description">OmniServe connects customers with trusted local providers, delivery riders and service professionals — making everyday services easier, faster and more accessible.</p>
      <div className="hero-actions">
        <button type="button" onClick={onGetStarted} className="primary-btn">Get Started <ArrowRight size={18} /></button>
        <button type="button" onClick={onProvider} className="secondary-btn">Become a Provider</button>
      </div>
      <div className="hero-trust"><div><ShieldCheck size={18}/><span>Trusted local providers</span></div><div><CheckCircle2 size={18}/><span>Secure payments</span></div><div><MapPin size={18}/><span>Real-time updates</span></div></div>
    </div>

    <div className="hero-product" aria-label="OmniServe application preview">
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="phone-header"><div><span className="phone-label">Welcome back</span><strong>OmniServe</strong></div><div className="phone-avatar">OS</div></div>
          <div className="phone-location"><MapPin size={14}/><span>Nairobi, Kenya</span></div>
          <div className="phone-search"><Search size={14}/><span>What do you need today?</span></div>
          <div className="phone-services">
            <div className="phone-service"><div className="phone-service-icon"><Droplets/></div><span>Water</span></div>
            <div className="phone-service"><div className="phone-service-icon"><span>🍔</span></div><span>Food</span></div>
            <div className="phone-service"><div className="phone-service-icon"><ShoppingBag/></div><span>Shopping</span></div>
            <div className="phone-service"><div className="phone-service-icon"><Wrench/></div><span>Services</span></div>
          </div>
          <div className="phone-card"><div className="phone-card-top"><span>• DELIVERY IN PROGRESS</span><span className="status-pill">On the way</span></div><strong>Water Delivery</strong><p>Your provider is on the way</p><div className="delivery-progress"><span className="progress-dot active"/><span className="progress-line active"/><span className="progress-dot active"/><span className="progress-line active"/><span className="progress-dot"/></div></div>
          <div className="phone-section-title"><strong>Nearby providers</strong><span>View all</span></div>
          <div className="provider-mini"><div className="provider-avatar">FE</div><div><strong>Francisca E.</strong><span>Water delivery</span></div><b>★ 4.9</b></div>
          <div className="provider-mini"><div className="provider-avatar alt">MC</div><div><strong>Mercy C.</strong><span>Local services</span></div><b>★ 4.8</b></div>
          <div className="phone-bottom-nav"><span className="active">Home</span><span>Explore</span><span>Orders</span><span>Profile</span></div>
        </div>
      </div>
      <div className="floating-tag floating-tag-top"><CheckCircle2 size={16}/><span>Provider connected</span><small>Ready to serve your area</small></div>
      <div className="floating-tag floating-tag-bottom"><Truck size={16}/><span>Rider nearby</span><small>Arriving in 4 minutes</small></div>
    </div>
  </div>;
}
