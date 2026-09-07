import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  Wifi,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { VerifiedPro, Order, OrderStatus } from '../types';
import { supabase } from '../lib/supabaseClient';

interface ProviderDashboardProps {
  pros: VerifiedPro[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, proId?: string) => void;
  onSelectOrderToTrack: (order: Order) => void;
}

const KSH = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

const statusLabels: Record<string, string> = {
  assigned: 'Assigned',
  en_route: 'En route',
  arrived: 'At site',
  in_progress: 'Working',
  completed: 'Completed',
};

const fallbackPro: VerifiedPro = {
  id: 'pro-1',
  name: 'Your Provider Profile',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
  category: 'plumbing',
  title: 'Verified Local Service Professional',
  rating: 4.9,
  reviewCount: 0,
  hourlyRate: 1200,
  isVerified: true,
  licenseNumber: 'Pending profile',
  yearsExperience: 5,
  distanceMiles: 0,
  responseTimeMin: 20,
  specialties: ['Home repairs', 'Emergency response'],
  badges: ['Verified'],
  phone: '',
  completedJobs: 0,
  bio: '',
  location: { lat: -1.2864, lng: 36.8172, address: 'Nairobi, Kenya' },
};

export default function ProviderDashboard({
  pros = [],
  orders = [],
  onUpdateOrderStatus,
  onSelectOrderToTrack,
}: ProviderDashboardProps) {
  const [selectedProId, setSelectedProId] = useState(pros[0]?.id || fallbackPro.id);
  const [isOnline, setIsOnline] = useState(Boolean(pros[0]?.isOnline));
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'history'>('overview');
  const [showProfile, setShowProfile] = useState(false);

  const currentPro = pros.find((pro) => pro.id === selectedProId) || pros[0] || fallbackPro;

  const toggleAvailability = async () => {
    const next = !isOnline;
    setIsOnline(next);
    if (!currentPro || currentPro.id === fallbackPro.id) return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('You are not signed in');
      const response = await fetch(`/api/services/${currentPro.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isOnline: next }),
      });
      if (!response.ok) throw new Error('Availability update failed');
    } catch (error) {
      console.error('Failed to update availability:', error);
      setIsOnline(!next);
    }
  };

  const proOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.type === 'service' &&
          (order.providerId === currentPro.id ||
            (order.status === 'pending' &&
              (!order.category || order.category === currentPro.category))),
      ),
    [orders, currentPro.id, currentPro.category],
  );

  const pendingJobs = proOrders.filter((order) => order.status === 'pending');
  const activeJobs = proOrders.filter(
    (order) => !['pending', 'completed', 'cancelled'].includes(order.status),
  );
  const completedJobs = proOrders.filter((order) => order.status === 'completed');

  const earnings = completedJobs.reduce((sum, order) => sum + order.total, 0);
  const activeValue = activeJobs.reduce((sum, order) => sum + order.total, 0);
  const responseRate = proOrders.length
    ? Math.round(((proOrders.length - pendingJobs.length) / proOrders.length) * 100)
    : 100;

  const money = (amount: number) => KSH.format(Number.isFinite(amount) ? amount : 0);

  const nextAction = (order: Order) => {
    if (order.status === 'assigned') return ['en_route', 'Start trip'];
    if (order.status === 'en_route') return ['arrived', 'Mark arrived'];
    if (order.status === 'arrived') return ['in_progress', 'Start work'];
    if (order.status === 'in_progress') return ['completed', 'Complete job'];
    return [null, null];
  };

  return (
    <div id="provider-dashboard-view" className="provider-dashboard">
      <section className="provider-welcome">
        <div>
          <div className="provider-kicker">
            <span className={isOnline ? 'online-dot' : 'offline-dot'} />
            {isOnline ? 'YOU ARE AVAILABLE FOR WORK' : 'YOU ARE OFFLINE'}
          </div>
          <h1>Good day, {currentPro.name.split(' ')[0] || 'Provider'}.</h1>
          <p>Manage your jobs, follow your earnings and keep your customers updated.</p>
        </div>

        <div className="provider-header-actions">
          <button
            className={`provider-online ${isOnline ? 'is-online' : ''}`}
            onClick={toggleAvailability}
          >
            <Wifi size={16} />
            {isOnline ? 'Online' : 'Go online'}
          </button>

          <button className="provider-profile-button" onClick={() => setShowProfile((value) => !value)}>
            <img src={currentPro.avatar} alt="" />
            <span>My profile</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </section>

      <div className="provider-stats-grid">
        <article className="provider-stat-card earnings">
          <div className="stat-icon"><DollarSign size={18} /></div>
          <span>Completed earnings</span>
          <strong>{money(earnings)}</strong>
          <small><TrendingUp size={12} /> From {completedJobs.length} completed job{completedJobs.length === 1 ? '' : 's'}</small>
        </article>

        <article className="provider-stat-card">
          <div className="stat-icon"><Clock3 size={18} /></div>
          <span>Active jobs</span>
          <strong>{activeJobs.length}</strong>
          <small>{activeValue ? `${money(activeValue)} currently in progress` : 'Nothing waiting on you'}</small>
        </article>

        <article className="provider-stat-card">
          <div className="stat-icon"><CheckCircle2 size={18} /></div>
          <span>Jobs completed</span>
          <strong>{currentPro.completedJobs + completedJobs.length}</strong>
          <small>Lifetime provider activity</small>
        </article>

        <article className="provider-stat-card">
          <div className="stat-icon gold"><Star size={18} /></div>
          <span>Customer rating</span>
          <strong>{currentPro.rating.toFixed(1)}</strong>
          <small>{currentPro.reviewCount} verified review{currentPro.reviewCount === 1 ? '' : 's'}</small>
        </article>
      </div>

      <div className="provider-layout">
        <main>
          <div className="provider-tabs" role="tablist" aria-label="Provider dashboard">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
              New requests <span>{pendingJobs.length}</span>
            </button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>Job history</button>
          </div>

          {activeTab !== 'history' && (
            <>
              {activeJobs.length > 0 && (
                <section className="provider-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">LIVE WORK</span>
                      <h2>Jobs on your route</h2>
                    </div>
                    <span className="panel-count live">{activeJobs.length} active</span>
                  </div>

                  <div className="provider-job-list">
                    {activeJobs.map((job) => {
                      const [nextStatus, nextLabel] = nextAction(job);
                      return (
                        <article className="provider-job-card active-job" key={job.id}>
                          <div className="job-accent" />
                          <div className="job-main">
                            <div className="job-topline">
                              <div>
                                <span className="job-category">{job.category || currentPro.category}</span>
                                <h3>{job.title}</h3>
                              </div>
                              <strong className="job-price">{money(job.total)}</strong>
                            </div>

                            <div className="job-details">
                              <span><MapPin size={14} /> {job.tenantAddress}{job.apartmentUnit ? ` • ${job.apartmentUnit}` : ''}</span>
                              <span><User size={14} /> {job.tenantName}</span>
                            </div>

                            {job.notes && (
                              <div className="job-note">
                                <AlertCircle size={14} />
                                <span>{job.notes}</span>
                              </div>
                            )}

                            <div className="job-progress">
                              {['assigned', 'en_route', 'arrived', 'in_progress', 'completed'].map((status, index) => (
                                <div key={status} className={`progress-step ${['assigned', 'en_route', 'arrived', 'in_progress'].indexOf(job.status) >= index ? 'done' : ''}`}>
                                  <span />
                                  {index < 4 && <i />}
                                </div>
                              ))}
                            </div>

                            <div className="job-footer">
                              <span className="status-text">
                                <span className="status-live-dot" />
                                {statusLabels[job.status] || job.status.replace('_', ' ')}
                              </span>

                              <div className="job-actions">
                                <button className="job-secondary" onClick={() => onSelectOrderToTrack(job)}>
                                  Open live view
                                </button>
                                {nextStatus && (
                                  <button
                                    className="job-primary"
                                    onClick={() => onUpdateOrderStatus(job.id, nextStatus as OrderStatus, currentPro.id)}
                                  >
                                    {nextStatus === 'completed' ? <Check size={15} /> : <ArrowUpRight size={15} />}
                                    {nextLabel}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {activeJobs.length === 0 && (
                <section className="provider-empty">
                  <div className="empty-icon"><Wrench size={24} /></div>
                  <span className="panel-kicker">YOUR WORKSPACE</span>
                  <h2>No active job right now</h2>
                  <p>Stay online and new requests matching your service will appear here.</p>
                  <button className="job-primary" onClick={() => setActiveTab('requests')}>
                    View available requests <ChevronRight size={15} />
                  </button>
                </section>
              )}

              {activeTab === 'overview' && pendingJobs.length > 0 && (
                <section className="provider-panel requests-preview">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">OPPORTUNITIES NEAR YOU</span>
                      <h2>New service requests</h2>
                    </div>
                    <button className="panel-link" onClick={() => setActiveTab('requests')}>View all <ChevronRight size={14} /></button>
                  </div>

                  <div className="request-grid">
                    {pendingJobs.slice(0, 3).map((job) => (
                      <article className="request-card" key={job.id}>
                        <div className="request-card-top">
                          <span>{job.category || currentPro.category}</span>
                          <strong>{money(job.total)}</strong>
                        </div>
                        <h3>{job.title}</h3>
                        <p><MapPin size={13} /> {job.tenantAddress}</p>
                        <button onClick={() => onUpdateOrderStatus(job.id, 'assigned', currentPro.id)}>
                          Accept request <Check size={14} />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'requests' && (
                <section className="provider-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">AVAILABLE NOW</span>
                      <h2>Requests matching your trade</h2>
                    </div>
                    <RefreshCw size={17} className="panel-muted-icon" />
                  </div>

                  {pendingJobs.length === 0 ? (
                    <div className="small-empty">
                      <CheckCircle2 size={22} />
                      <strong>No new requests</strong>
                      <span>Keep your status online. We will show matching work here.</span>
                    </div>
                  ) : (
                    <div className="request-list">
                      {pendingJobs.map((job) => (
                        <div className="request-row" key={job.id}>
                          <div className="request-row-icon"><Wrench size={17} /></div>
                          <div className="request-row-copy">
                            <span>{job.category || currentPro.category}</span>
                            <strong>{job.title}</strong>
                            <p><MapPin size={13} /> {job.tenantAddress} • {job.tenantName}</p>
                          </div>
                          <div className="request-row-price">{money(job.total)}</div>
                          <button onClick={() => onUpdateOrderStatus(job.id, 'assigned', currentPro.id)}>
                            Accept <Check size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <section className="provider-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">YOUR TRACK RECORD</span>
                  <h2>Completed jobs</h2>
                </div>
                <span className="panel-count">{completedJobs.length}</span>
              </div>

              {completedJobs.length === 0 ? (
                <div className="small-empty">
                  <CheckCircle2 size={22} />
                  <strong>Your completed jobs will appear here</strong>
                  <span>Finish your first service request and it will be added to your history.</span>
                </div>
              ) : (
                <div className="history-list">
                  {completedJobs.map((job) => (
                    <div className="history-row" key={job.id}>
                      <div className="history-icon"><Check size={16} /></div>
                      <div>
                        <strong>{job.title}</strong>
                        <span>{job.tenantAddress} • {job.tenantName}</span>
                      </div>
                      <b>{money(job.total)}</b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        <aside className="provider-sidebar">
          <section className="provider-profile-card">
            <div className="profile-cover" />
            <div className="profile-body">
              <img src={currentPro.avatar} alt={currentPro.name} />
              <div className="verified-badge"><ShieldCheck size={14} /> Verified</div>
              <h3>{currentPro.name}</h3>
              <p>{currentPro.title}</p>

              {pros.length > 1 && (
                <select value={selectedProId} onChange={(event) => setSelectedProId(event.target.value)}>
                  {pros.map((pro) => (
                    <option key={pro.id} value={pro.id}>{pro.name} • {pro.category}</option>
                  ))}
                </select>
              )}

              <div className="profile-meta">
                <span><Star size={13} /> {currentPro.rating.toFixed(1)}</span>
                <span><ShieldCheck size={13} /> {currentPro.yearsExperience} yrs</span>
                <span><Wrench size={13} /> {currentPro.completedJobs} jobs</span>
              </div>

              <div className="profile-rate">
                <span>Your base rate</span>
                <strong>{money(currentPro.hourlyRate)}<small>/hr</small></strong>
              </div>

              <button className="profile-edit" onClick={() => setShowProfile((value) => !value)}>
                {showProfile ? 'Hide profile details' : 'View profile details'}
              </button>

              {showProfile && (
                <div className="profile-details">
                  <span><Phone size={13} /> {currentPro.phone || 'Phone not set'}</span>
                  <span><MapPin size={13} /> {currentPro.location.address}</span>
                  <span><Zap size={13} /> Replies in about {currentPro.responseTimeMin} min</span>
                </div>
              )}
            </div>
          </section>

          <section className="provider-health-card">
            <div className="health-heading">
              <span>PROFILE HEALTH</span>
              <strong>{currentPro.isVerified ? 'Strong' : 'Needs attention'}</strong>
            </div>
            <div className="health-bar"><span style={{ width: currentPro.isVerified ? '92%' : '54%' }} /></div>
            <p>
              {currentPro.isVerified
                ? 'Your profile is verified and ready to receive local requests.'
                : 'Complete verification details to build more trust with customers.'}
            </p>
          </section>

          <section className="provider-switch-card">
            <div>
              <span>RESPONSE RATE</span>
              <strong>{responseRate}%</strong>
            </div>
            <div className="response-ring">{responseRate}%</div>
          </section>
        </aside>
      </div>

      <style>{`
        #provider-dashboard-view {
          --pd-green:#08745a; --pd-deep:#0d3029; --pd-soft:#e9f6f0;
          --pd-gold:#d6a63a; --pd-ink:#132824; --pd-muted:#6c7d78; --pd-border:#dfe8e3;
          color:var(--pd-ink);
        }
        .provider-dashboard{display:flex;flex-direction:column;gap:18px;padding-bottom:30px}
        .provider-welcome{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px 26px;border:1px solid var(--pd-border);border-radius:20px;background:linear-gradient(120deg,#fff,#f5faf7);box-shadow:0 12px 35px rgba(18,37,34,.05)}
        .provider-kicker{display:flex;align-items:center;gap:7px;color:var(--pd-green);font-size:9px;font-weight:900;letter-spacing:1.2px}
        .online-dot,.offline-dot{width:7px;height:7px;border-radius:50%}.online-dot{background:#1ca56f;box-shadow:0 0 0 5px rgba(28,165,111,.1)}.offline-dot{background:#9aa7a2}
        .provider-welcome h1{margin:8px 0 5px;font-size:25px;letter-spacing:-.7px}.provider-welcome p{margin:0;color:var(--pd-muted);font-size:11px}
        .provider-header-actions{display:flex;align-items:center;gap:9px}
        .provider-online,.provider-profile-button{display:flex;align-items:center;gap:7px;border:1px solid var(--pd-border);border-radius:11px;padding:10px 12px;background:white;color:var(--pd-ink);font-size:10px;font-weight:900;cursor:pointer}
        .provider-online.is-online{background:var(--pd-green);border-color:var(--pd-green);color:white}.provider-profile-button img{width:24px;height:24px;border-radius:8px;object-fit:cover}
        .provider-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .provider-stat-card{position:relative;min-height:136px;padding:17px;border:1px solid var(--pd-border);border-radius:17px;background:white;overflow:hidden}
        .provider-stat-card.earnings{background:linear-gradient(135deg,#0b5e49,#08745a);color:white;border-color:#08745a}
        .stat-icon{width:34px;height:34px;display:grid;place-items:center;margin-bottom:13px;border-radius:10px;color:var(--pd-green);background:var(--pd-soft)}.earnings .stat-icon{color:white;background:rgba(255,255,255,.12)}.stat-icon.gold{color:#9b741c;background:#fbf3df}
        .provider-stat-card>span{display:block;font-size:9px;font-weight:800;opacity:.72}.provider-stat-card>strong{display:block;margin-top:4px;font-size:22px;letter-spacing:-.5px}.provider-stat-card small{display:flex;align-items:center;gap:4px;margin-top:5px;font-size:8px;opacity:.72}
        .provider-layout{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:16px}
        .provider-tabs{display:flex;gap:4px;margin-bottom:12px;padding:4px;border:1px solid var(--pd-border);border-radius:13px;background:#f5f8f6}
        .provider-tabs button{border:0;border-radius:9px;padding:9px 12px;background:transparent;color:#657671;font-size:10px;font-weight:900;cursor:pointer}.provider-tabs button.active{background:white;color:var(--pd-ink);box-shadow:0 3px 12px rgba(18,37,34,.07)}.provider-tabs button span{margin-left:4px;padding:2px 5px;border-radius:99px;color:var(--pd-green);background:var(--pd-soft)}
        .provider-panel{border:1px solid var(--pd-border);border-radius:18px;background:white;padding:18px}
        .panel-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}.panel-kicker{display:block;color:var(--pd-green);font-size:8px;font-weight:900;letter-spacing:1.2px}.panel-heading h2{margin:5px 0 0;font-size:16px;letter-spacing:-.3px}.panel-count{padding:5px 8px;border-radius:99px;background:#f1f5f3;color:#61726d;font-size:9px;font-weight:900}.panel-count.live{color:var(--pd-green);background:var(--pd-soft)}.panel-link{display:flex;align-items:center;gap:2px;border:0;background:transparent;color:var(--pd-green);font-size:9px;font-weight:900;cursor:pointer}.panel-muted-icon{color:#9baaa5}
        .provider-job-list{display:grid;gap:10px}.provider-job-card{position:relative;overflow:hidden;border:1px solid #cfe5da;border-radius:15px;background:#fbfefc}.job-accent{position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--pd-green)}.job-main{padding:15px 15px 14px 19px}.job-topline{display:flex;justify-content:space-between;gap:15px}.job-category,.request-card-top span{display:inline-block;color:var(--pd-green);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.8px}.job-topline h3{margin:4px 0 0;font-size:13px}.job-price{font-size:15px;color:var(--pd-green);white-space:nowrap}.job-details{display:flex;flex-wrap:wrap;gap:9px;margin-top:10px;color:#647670;font-size:9px}.job-details span{display:flex;align-items:center;gap:4px}.job-note{display:flex;gap:6px;margin-top:10px;padding:8px;border-radius:9px;background:#fff8ea;color:#78632d;font-size:9px}.job-progress{display:flex;align-items:center;margin:14px 0 10px}.progress-step{display:flex;align-items:center;flex:1}.progress-step span{width:8px;height:8px;border:2px solid #ccd8d3;border-radius:50%;background:white}.progress-step i{height:2px;flex:1;background:#dce5e1}.progress-step.done span{border-color:var(--pd-green);background:var(--pd-green)}.progress-step.done i{background:#7fc7ac}.job-footer{display:flex;align-items:center;justify-content:space-between;gap:10px}.status-text{display:flex;align-items:center;gap:5px;color:var(--pd-green);font-size:9px;font-weight:900}.status-live-dot{width:6px;height:6px;border-radius:50%;background:#19a775}.job-actions{display:flex;gap:6px}.job-secondary,.job-primary{display:flex;align-items:center;gap:5px;border-radius:9px;padding:8px 10px;font-size:9px;font-weight:900;cursor:pointer}.job-secondary{border:1px solid var(--pd-border);background:white;color:#586b65}.job-primary{border:1px solid var(--pd-green);background:var(--pd-green);color:white}
        .provider-empty{padding:45px 20px;text-align:center;border:1px dashed #cbdad4;border-radius:18px;background:#fbfdfc}.empty-icon{width:48px;height:48px;display:grid;place-items:center;margin:0 auto 12px;border-radius:14px;color:var(--pd-green);background:var(--pd-soft)}.provider-empty h2{margin:7px 0 5px;font-size:16px}.provider-empty p{max-width:390px;margin:0 auto 16px;color:var(--pd-muted);font-size:10px;line-height:1.6}
        .request-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.request-card{padding:13px;border:1px solid #e1e8e4;border-radius:13px;background:#fbfdfc}.request-card-top{display:flex;justify-content:space-between;gap:8px}.request-card-top strong{color:var(--pd-green);font-size:12px}.request-card h3{margin:8px 0;font-size:11px}.request-card p{display:flex;align-items:center;gap:4px;color:var(--pd-muted);font-size:8px}.request-card button{display:flex;align-items:center;justify-content:center;gap:4px;width:100%;margin-top:10px;padding:8px;border:0;border-radius:8px;background:var(--pd-green);color:white;font-size:8px;font-weight:900;cursor:pointer}
        .small-empty{display:grid;justify-items:center;gap:6px;padding:30px;color:var(--pd-green);text-align:center}.small-empty strong{color:var(--pd-ink);font-size:11px}.small-empty span{max-width:320px;color:var(--pd-muted);font-size:9px;line-height:1.6}
        .request-list{display:grid;gap:7px}.request-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:11px;border:1px solid #e2e9e5;border-radius:12px}.request-row-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;color:var(--pd-green);background:var(--pd-soft)}.request-row-copy span{color:var(--pd-green);font-size:7px;font-weight:900;text-transform:uppercase}.request-row-copy strong{display:block;margin-top:2px;font-size:10px}.request-row-copy p{display:flex;align-items:center;gap:3px;margin:4px 0 0;color:var(--pd-muted);font-size:8px}.request-row-price{font-size:11px;font-weight:900;color:var(--pd-green)}.request-row button{display:flex;align-items:center;gap:4px;border:0;border-radius:8px;padding:8px 10px;background:var(--pd-green);color:white;font-size:8px;font-weight:900;cursor:pointer}
        .provider-sidebar{display:grid;align-content:start;gap:12px}.provider-profile-card,.provider-health-card,.provider-switch-card{border:1px solid var(--pd-border);border-radius:18px;background:white;overflow:hidden}.profile-cover{height:58px;background:linear-gradient(135deg,#0c5b47,#0b8668);position:relative}.profile-cover:after{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.14) 1px,transparent 1px);background-size:13px 13px}.profile-body{position:relative;padding:0 15px 16px;text-align:center}.profile-body>img{width:66px;height:66px;margin-top:-28px;border:4px solid white;border-radius:20px;object-fit:cover;box-shadow:0 8px 22px rgba(18,37,34,.14)}.verified-badge{display:flex;width:max-content;align-items:center;gap:4px;margin:-4px auto 7px;padding:4px 7px;border-radius:99px;background:var(--pd-soft);color:var(--pd-green);font-size:7px;font-weight:900}.profile-body h3{margin:0;font-size:14px}.profile-body>p{margin:4px 0;color:var(--pd-muted);font-size:8px;line-height:1.5}.profile-body select{width:100%;margin-top:9px;padding:8px;border:1px solid var(--pd-border);border-radius:8px;background:#fafcfb;color:var(--pd-ink);font-size:8px}.profile-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:12px}.profile-meta span{display:flex;justify-content:center;align-items:center;gap:3px;color:#62736e;font-size:7px;font-weight:900}.profile-rate{display:flex;align-items:center;justify-content:space-between;margin-top:13px;padding-top:12px;border-top:1px solid var(--pd-border);text-align:left}.profile-rate span{color:var(--pd-muted);font-size:8px}.profile-rate strong{color:var(--pd-green);font-size:13px}.profile-rate small{font-size:7px}.profile-edit{width:100%;margin-top:11px;padding:8px;border:1px solid var(--pd-border);border-radius:8px;background:white;color:var(--pd-ink);font-size:8px;font-weight:900;cursor:pointer}.profile-details{display:grid;gap:7px;margin-top:10px;padding-top:10px;border-top:1px solid var(--pd-border);text-align:left}.profile-details span{display:flex;align-items:center;gap:6px;color:#63746f;font-size:8px}
        .provider-health-card{padding:15px}.health-heading{display:flex;justify-content:space-between;font-size:8px;font-weight:900}.health-heading span{color:var(--pd-muted);letter-spacing:.7px}.health-heading strong{color:var(--pd-green)}.health-bar{height:6px;margin:10px 0 8px;overflow:hidden;border-radius:99px;background:#e7eeea}.health-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--pd-green),#47b88f)}.provider-health-card p{margin:0;color:var(--pd-muted);font-size:8px;line-height:1.55}
        .provider-switch-card{display:flex;align-items:center;justify-content:space-between;padding:15px}.provider-switch-card span{display:block;color:var(--pd-muted);font-size:8px;font-weight:900;letter-spacing:.7px}.provider-switch-card strong{display:block;margin-top:4px;font-size:18px}.response-ring{width:46px;height:46px;display:grid;place-items:center;border:4px solid #b9ddce;border-radius:50%;color:var(--pd-green);font-size:8px;font-weight:900}
        .history-list{display:grid}.history-row{display:grid;grid-template-columns:31px 1fr auto;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #edf1ef}.history-row:last-child{border-bottom:0}.history-icon{width:31px;height:31px;display:grid;place-items:center;border-radius:9px;color:var(--pd-green);background:var(--pd-soft)}.history-row strong,.history-row span{display:block}.history-row strong{font-size:10px}.history-row span{margin-top:3px;color:var(--pd-muted);font-size:8px}.history-row b{color:var(--pd-green);font-size:10px}
        @media(max-width:1050px){.provider-layout{grid-template-columns:1fr}.provider-sidebar{grid-template-columns:repeat(3,1fr)}.provider-profile-card{grid-column:span 2}.provider-stats-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:700px){.provider-welcome{display:block}.provider-header-actions{margin-top:15px}.provider-stats-grid{grid-template-columns:1fr 1fr}.request-grid{grid-template-columns:1fr}.provider-sidebar{grid-template-columns:1fr}.provider-profile-card{grid-column:auto}.job-topline,.job-footer{display:block}.job-price{display:block;margin-top:6px}.job-actions{margin-top:8px}.request-row{grid-template-columns:34px 1fr auto}.request-row button{grid-column:2 / -1}.provider-tabs{overflow:auto}.provider-tabs button{white-space:nowrap}}
        @media(max-width:470px){.provider-stats-grid{grid-template-columns:1fr}.provider-welcome h1{font-size:21px}.provider-header-actions{display:grid;grid-template-columns:1fr 1fr}.job-actions button{flex:1}.job-actions{display:flex}}
      `}</style>
    </div>
  );
}
