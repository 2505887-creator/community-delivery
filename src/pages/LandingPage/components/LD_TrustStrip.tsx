import { Star, Users, Check, ShieldCheck } from 'lucide-react';

export default function LD_TrustStrip(){
  return (
    <div className="container" style={{marginTop:18}}>
      <div className="trust-strip" role="region" aria-label="Trusted by">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Star width={16} height={16} />
          <div>
            <div style={{fontSize:12,color:'var(--muted)'}}>4.9/5 average</div>
            <div style={{fontWeight:800}}>Trusted by customers & providers</div>
          </div>
        </div>

        <div style={{width:1,background:'var(--border)',height:36}} aria-hidden></div>

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Users width={16} height={16} />
          <div>
            <div style={{fontSize:12,color:'var(--muted)'}}>10K+ deliveries</div>
            <div style={{fontWeight:800}}>Local reach</div>
          </div>
        </div>

        <div style={{width:1,background:'var(--border)',height:36}} aria-hidden></div>

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Check width={16} height={16} />
          <div>
            <div style={{fontSize:12,color:'var(--muted)'}}>2K+ providers</div>
            <div style={{fontWeight:800}}>Verified network</div>
          </div>
        </div>

        <div style={{width:1,background:'var(--border)',height:36}} aria-hidden></div>

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <ShieldCheck width={16} height={16} />
          <div>
            <div style={{fontSize:12,color:'var(--muted)'}}>Secure payments</div>
            <div style={{fontWeight:800}}>Protected transactions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
