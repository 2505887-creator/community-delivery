import { ArrowRight, ShieldCheck, MapPin, Database, Star } from 'lucide-react';

export default function LD_Hero(){
  return (
    <>
      <div>
        <p className="eyebrow">DELIVERY • COMMERCE • JOBS</p>
        <h1 className="hero-headline">Fast, Reliable <span style={{color:'var(--primary)'}}>Delivery</span> at Your Doorstep</h1>
        <p className="hero-sub">OmniServe connects customers with trusted providers — from delivery drivers and couriers to local sellers and service professionals.</p>

        <div style={{marginTop:20,display:'flex',gap:12,alignItems:'center'}}>
          <a href="/customer/signup" className="btn btn-primary" aria-label="Sign up as customer">Sign Up as Customer <ArrowRight /></a>
          <a href="/provider/signup" className="btn btn-ghost" aria-label="Join as provider">Join as Provider</a>
        </div>

        <div style={{marginTop:16,display:'flex',gap:12,alignItems:'center'}} aria-hidden>
          <div className="trust-strip" style={{maxWidth:420}}>
            <div className="trust-item"><ShieldCheck width={16} height={16} /> Secure Payments</div>
            <div className="trust-item"><MapPin width={16} height={16} /> Real-Time Tracking</div>
            <div className="trust-item"><Database width={16} height={16} /> Powered by Supabase</div>
          </div>
        </div>
      </div>

      {/* Phone mock visual */}
      <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
        <div className="phone-mock" role="img" aria-label="OmniServe app preview">
          <div className="phone-screen">
            <div style={{padding:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div style={{width:10,height:10,background:'var(--primary)',borderRadius:6}}></div>
                <div style={{fontWeight:700}}>Community Delivery</div>
              </div>
              <div style={{fontSize:12,color:'var(--muted)'}}>Live</div>
            </div>

            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="260" height="420" viewBox="0 0 260 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="260" height="420" rx="20" fill="#F5FFF9" />
                <circle cx="60" cy="60" r="8" fill="#0F9D76" />
                <circle cx="200" cy="120" r="6" fill="#7C6EE6" />
                <path d="M60 60 C 100 80, 160 100, 200 120" stroke="#0F9D76" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="36" y="260" width="188" height="84" rx="10" fill="#FFFFFF" stroke="#E7F7F1" />
                <text x="48" y="290" fontSize="12" fill="#102A2A">Order #8432</text>
                <text x="48" y="308" fontSize="11" fill="#607572">Driver is 2 min away • ETA 4m</text>
              </svg>
            </div>

            <div style={{padding:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:12,color:'var(--muted)'}}>ETA 4m</div>
                <div style={{fontWeight:700,color:'var(--primary)'}}>On the way</div>
              </div>
            </div>

            {/* Floating small card */}
            <div className="floating-card" style={{left:-24,bottom:28}}>
              <div style={{fontSize:12,fontWeight:800}}>Order confirmed</div>
              <div className="floating-small">Payment successful</div>
            </div>

            <div className="floating-card" style={{right:12,top:24}}>
              <div style={{fontSize:12,fontWeight:800}}>Driver is 2 min away</div>
              <div className="floating-small">Ahmed K. • 4.9★</div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
