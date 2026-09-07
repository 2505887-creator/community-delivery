import LD_Navbar from './components/LD_Navbar';
import LD_Hero from './components/LD_Hero';
import LD_TrustStrip from './components/LD_TrustStrip';
import '../../styles/landing.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LD_Navbar />
      <main className="container">
        <section className="landing-hero" aria-label="Hero">
          <LD_Hero />
        </section>

        <section style={{marginTop:20}}>
          <LD_TrustStrip />
        </section>

        {/* Further landing sections will be added in follow-up commits */}

      </main>
    </div>
  );
}
