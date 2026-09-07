import {
  Clock,
  Inbox,
  PackageSearch,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import type { Order } from '../../types';

interface TenantOrdersProps {
  activeOrders: Order[];
  recentOrders: Order[];
  orders: Order[];

  renderOrderCard: (
    order: Order,
    compact?: boolean
  ) => React.ReactNode;

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

export default function TenantOrders({
  activeOrders,
  recentOrders,
  orders,
  renderOrderCard,
  EmptyState,
}: TenantOrdersProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <PackageSearch className="h-5 w-5 text-blue-600" />
              Active Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Orders currently being processed or delivered.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {activeOrders.length} active
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {activeOrders.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No active orders"
              subtitle="Orders you place will show up here for tracking."
            />
          ) : (
            activeOrders.map((order) => renderOrderCard(order))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest order activity.
            </p>
          </div>

          <span className="text-xs font-medium text-slate-400">
            {orders.length} total
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No order history yet"
              subtitle="Book a provider or shop a store to get started."
            />
          ) : (
            recentOrders.map((order) => renderOrderCard(order, true))
          )}
        </div>
      </div>
    </section>
  );
}