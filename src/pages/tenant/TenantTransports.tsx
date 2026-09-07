import {
  Box,
  Navigation,
  Truck,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import type { Order } from '../../types';

interface TenantTransportsProps {
  latestActiveOrder: Order | null;
  onRequestTransport?: () => void;

  renderOrderCard: (order: Order) => React.ReactNode;

  StatusBadge: ({ status }: { status: string }) => React.ReactNode;

  EmptyState: ({
    icon,
    title,
    subtitle,
  }: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
  }) => React.ReactNode;
}

export default function TenantTransports({
  latestActiveOrder,
  onRequestTransport,
  renderOrderCard,
  StatusBadge,
  EmptyState,
}: TenantTransportsProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Truck className="h-5 w-5 text-blue-600" />
            Transport & Delivery
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Request transport or track an existing delivery using the
            connected OmniServe handlers.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => onRequestTransport?.()}
            disabled={!onRequestTransport}
            className="flex items-center gap-3 rounded-xl bg-slate-900 p-4 text-left text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Truck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold">Request a Ride</p>
              <p className="mt-0.5 text-xs text-white/60">
                Start a transport request
              </p>
            </div>
          </button>

          <button
            onClick={() => onRequestTransport?.()}
            disabled={!onRequestTransport}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Box className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Request Cargo Delivery
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Start a cargo request
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">
              Active Delivery
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your latest active transport/order information.
            </p>
          </div>

          {latestActiveOrder && (
            <StatusBadge status={latestActiveOrder.status} />
          )}
        </div>

        <div className="mt-4">
          {latestActiveOrder ? (
            renderOrderCard(latestActiveOrder)
          ) : (
            <EmptyState
              icon={Navigation}
              title="No active delivery"
              subtitle="Active transport and delivery orders will appear here."
            />
          )}
        </div>
      </div>
    </section>
  );
}