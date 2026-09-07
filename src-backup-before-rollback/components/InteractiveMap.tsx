import { useMemo } from 'react';
import { Navigation, MapPin, Wrench, ShoppingBag, ShieldCheck, Car } from 'lucide-react';

interface InteractiveMapProps {
  tenantLocation: { lat: number; lng: number; label: string };
  originLocation: { lat: number; lng: number; label: string };
  currentLocation: { lat: number; lng: number };
  type: 'service' | 'store_delivery' | 'ride_cargo';
  status: string;
  providerName?: string;
  driverName?: string;
  etaMin: number;
}

export default function InteractiveMap({
  tenantLocation,
  originLocation,
  currentLocation,
  type,
  status,
  providerName,
  driverName,
  etaMin
}: InteractiveMapProps) {
  // Map coordinate projection to 0-100% SVG box
  // NYC lower manhattan bounds roughly:
  // lat: 40.7040 to 40.7260
  // lng: -74.0150 to -73.9900
  const minLat = 40.7040;
  const maxLat = 40.7260;
  const minLng = -74.0150;
  const maxLng = -73.9900;

  const project = (lat: number, lng: number) => {
    const x = Math.max(5, Math.min(95, ((lng - minLng) / (maxLng - minLng)) * 100));
    // Invert Y because SVG coordinate Y goes top to bottom, while latitude goes bottom to top
    const y = Math.max(5, Math.min(95, (1 - (lat - minLat) / (maxLat - minLat)) * 100));
    return { x, y };
  };

  const originPt = useMemo(() => project(originLocation.lat, originLocation.lng), [originLocation]);
  const tenantPt = useMemo(() => project(tenantLocation.lat, tenantLocation.lng), [tenantLocation]);
  const currentPt = useMemo(() => project(currentLocation.lat, currentLocation.lng), [currentLocation]);

  // Route path calculation
  const routeD = useMemo(() => {
    // Generate an urban grid path with intermediate corner for realistic street navigation
    const midX = originPt.x;
    const midY = tenantPt.y;
    return `M ${originPt.x} ${originPt.y} L ${midX} ${midY} L ${tenantPt.x} ${tenantPt.y}`;
  }, [originPt, tenantPt]);

  return (
    <div id="interactive-map-container" className="relative w-full h-72 sm:h-80 bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
      {/* City Map Grid Background Graphic */}
      <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="1" />
            <circle cx="20" cy="20" r="1.5" fill="#334155" />
          </pattern>
          <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Major Avenue / Boulevard strokes */}
        <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#334155" strokeWidth="8" />
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#334155" strokeWidth="6" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#334155" strokeWidth="8" />
        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#334155" strokeWidth="6" />
        <line x1="15%" y1="0" x2="85%" y2="100%" stroke="#1e293b" strokeWidth="10" opacity="0.6" />

        {/* Regular streets grid */}
        <rect width="100%" height="100%" fill="url(#city-grid)" />

        {/* Active Dispatch Navigation Route Line */}
        <path
          d={routeD}
          fill="none"
          stroke="#0284c7"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
        <path
          d={routeD}
          fill="none"
          stroke="url(#route-gradient)"
          strokeWidth="3.5"
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
      </svg>

      {/* Top HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-slate-200 font-medium">
            Live GPS Dispatch &bull; {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs font-semibold text-emerald-400">
          ETA: ~{etaMin} min
        </div>
      </div>

      {/* Origin Pin (Store / Provider Workshop) */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-700"
        style={{ left: `${originPt.x}%`, top: `${originPt.y}%` }}
      >
        <div className="relative group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-600/90 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs">
            {type === 'service' ? <Wrench className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-9 bg-slate-900/95 text-slate-200 border border-slate-700 px-2 py-0.5 rounded text-[11px] whitespace-nowrap shadow-md pointer-events-none">
            {originLocation.label}
          </div>
        </div>
      </div>

      {/* Destination Pin (Tenant Apartment) */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-700"
        style={{ left: `${tenantPt.x}%`, top: `${tenantPt.y}%` }}
      >
        <div className="relative group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <MapPin className="w-5 h-5 fill-white text-emerald-700" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-10 bg-slate-900/95 text-emerald-400 border border-slate-700 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap shadow-md pointer-events-none">
            {tenantLocation.label}
          </div>
        </div>
      </div>

      {/* Moving Live Dispatch Vehicle / Pro Icon */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-in-out"
        style={{ left: `${currentPt.x}%`, top: `${currentPt.y}%` }}
      >
        <div className="relative">
          {/* Radar ripple rings */}
          <div className="absolute -inset-3 rounded-full bg-sky-500/30 animate-ping"></div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 border-2 border-white shadow-2xl flex items-center justify-center text-white ring-4 ring-sky-500/20">
            {type === 'ride_cargo' || type === 'store_delivery' ? (
              <Car className="w-5 h-5" />
            ) : (
              <Navigation className="w-5 h-5 transform rotate-45" />
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-sky-950/95 text-sky-200 border border-sky-600/50 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider whitespace-nowrap shadow-lg flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-sky-400 inline" />
            <span>{driverName || providerName || 'Active Pro'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Origin Hub</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Live Telemetry</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Tenant Unit</span>
          </span>
        </div>
        <span className="text-slate-500 hidden sm:inline">Encrypted Dispatch Channel</span>
      </div>
    </div>
  );
}
