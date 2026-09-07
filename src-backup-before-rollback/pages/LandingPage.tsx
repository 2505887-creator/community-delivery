import LD_Navbar from './components/LD_Navbar';
import LD_Hero from './components/LD_Hero';
import LD_TrustStrip from './components/LD_TrustStrip';
import '../../../styles/landing.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LD_Navbar />

      <main>
        <section className="hero" aria-label="OmniServe introduction">
          <div className="landing-container">
            <LD_Hero />
          </div>
        </section>

        <section className="trust-section" aria-label="OmniServe trust indicators">
          <div className="landing-container">
            <LD_TrustStrip />
          </div>
        </section>
      </main>
    </div>
  );
}
