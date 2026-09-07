
import { ShieldCheck, Star, Truck, Users } from 'lucide-react';

const trustStats = [
  {
    value: 'Demo',
    label: 'Product experience',
    icon: Star,
  },
  {
    value: 'Live',
    label: 'Delivery tracking',
    icon: Truck,
  },
  {
    value: 'Local',
    label: 'Provider network',
    icon: Users,
  },
  {
    value: 'Secure',
    label: 'Authentication',
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
