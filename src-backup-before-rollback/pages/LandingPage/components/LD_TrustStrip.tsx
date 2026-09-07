
import { ShieldCheck, Star, Truck, Users } from 'lucide-react';

const trustStats = [
  {
    value: '4.9/5',
    label: 'Average rating',
    icon: Star,
  },
  {
    value: '10K+',
    label: 'Deliveries',
    icon: Truck,
  },
  {
    value: '2K+',
    label: 'Providers',
    icon: Users,
  },
  {
    value: 'Trusted',
    label: 'By customers & providers',
    icon: ShieldCheck,
  },
];

export default function LD_TrustStrip() {
  return (
    <div className="trust-strip">
      {trustStats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div className="trust-stat" key={stat.label}>
            <div className="trust-stat-icon" aria-hidden="true">
              <Icon size={19} />
            </div>

            <div className="trust-stat-content">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
