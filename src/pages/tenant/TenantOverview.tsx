import {
  ArrowRight,
  ChevronRight,
  Clock,
  Inbox,
  MapPin,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store as StoreIcon,
  Wrench,
  Zap,
  Hammer,
  Settings,
} from 'lucide-react';

import type {
  LocalStore,
  Order,
  StoreItem,
  VerifiedPro,
} from '../../types';

interface TenantOverviewProps {
  tenantName?: string;
  tenantAddress: string;

  pros: VerifiedPro[];
  stores: LocalStore[];
  orders: Order[];
  activeOrders: Order[];
  recentOrders: Order[];
  latestActiveOrder: Order | null;

  cartCount: number;
  cartItems: {
    item: StoreItem;
    store: LocalStore;
    quantity: number;
  }[];

  tenantTab: 'all' | 'pros' | 'stores' | 'transport';
  setTenantTab: (
    tab: 'all' | 'pros' | 'stores' | 'transport',
  ) => void;

  navigate: (section: string) => void;

  onTrackOrder?: (order: Order) => void;

  renderOrderCard: (
    order: Order,
    compact?: boolean,
  ) => React.ReactNode;

  renderProviderCard: (
    pro: VerifiedPro,
  ) => React.ReactNode;

  renderStoreCard: (
    store: LocalStore,
  ) => React.ReactNode;

  EmptyState: React.ComponentType<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
  }>;
}

const serviceCategories = [
  {
    name: 'plumbing',
    label: 'Plumbing',
    icon: Wrench,
  },
  {
    name: 'electrical',
    label: 'Electrical',
    icon: Zap,
  },
  {
    name: 'cleaning',
    label: 'Cleaning',
    icon: Sparkles,
  },
  {
    name: 'carpentry',
    label: 'Carpentry',
    icon: Hammer,
  },
  {
    name: 'appliances',
    label: 'Appliances',
    icon: Settings,
  },
];

export default function TenantOverview({
  tenantName,
  tenantAddress,
  pros,
  stores,
  orders,
  activeOrders,
  recentOrders,
  latestActiveOrder,
  cartCount,
  tenantTab,
  setTenantTab,
  navigate,
  onTrackOrder,
  renderOrderCard,
  renderProviderCard,
  renderStoreCard,
  EmptyState,
}: TenantOverviewProps) {
  const handleCategoryClick = (category: string) => {
    setTenantTab('pros');
    navigate('pros');

    /*
     * TenantServicePros owns the actual category filter.
     * Navigation is handled here; the provider page handles filtering.
     */
  };

  return (
    <div className="space-y-5">

      {/* Hero / Discovery */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                OmniServe
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {tenantName
                  ? `Welcome back, ${tenantName}`
                  : 'What can we help you with?'}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Find trusted service professionals, shop local stores,
                arrange transport, and manage everything from one place.
              </p>

              <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="truncate">
                  {tenantAddress || 'Location not set'}
                </span>
              </div>
            </div>

            {latestActiveOrder && (
              <button
                type="button"
                onClick={() =>
                  onTrackOrder
                    ? onTrackOrder(latestActiveOrder)
                    : navigate('orders')
                }
                className="flex shrink-0 items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                  <PackageSearch className="h-5 w-5 text-blue-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-blue-600">
                    Active order
                  </p>

                  <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900">
                    {latestActiveOrder.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Status: {latestActiveOrder.status}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
              </button>
            )}
          </div>

          {/* Discovery Search */}
          <button
            type="button"
            onClick={() => navigate('pros')}
            className="mt-6 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-white hover:shadow-sm"
          >
            <Search className="h-5 w-5 shrink-0 text-slate-400" />

            <span className="flex-1 text-sm text-slate-400">
              Search for plumbers, electricians, cleaners, appliance repair...
            </span>

            <span className="hidden rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex">
              Browse
            </span>
          </button>
        </div>
      </section>

      {/* Service Categories */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Browse Services
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Find the right professional for the job
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('pros')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {serviceCategories.map(({ name, label, icon: Icon }) => {
            const count = pros.filter(
              (pro) => String(pro.category).toLowerCase() === name,
            ).length;

            return (
              <button
                key={name}
                type="button"
                onClick={() => handleCategoryClick(name)}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 transition group-hover:bg-blue-50 group-hover:ring-blue-100">
                  <Icon className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {label}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {count} professional{count !== 1 ? 's' : ''}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: 'Service Professionals',
            value: pros.length,
            icon: ShieldCheck,
            action: 'pros',
          },
          {
            label: 'Local Stores',
            value: stores.length,
            icon: StoreIcon,
            action: 'marketplace',
          },
          {
            label: 'Active Orders',
            value: activeOrders.length,
            icon: PackageSearch,
            action: 'orders',
          },
          {
            label: 'Cart Items',
            value: cartCount,
            icon: ShoppingCart,
            action: 'cart',
          },
        ].map(({ label, value, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(action)}
            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition group-hover:bg-blue-50">
                <Icon className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {value}
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {label}
            </p>
          </button>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'pros', 'stores', 'transport'] as const).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setTenantTab(tab);

                if (tab === 'all') navigate('overview');
                if (tab === 'pros') navigate('pros');
                if (tab === 'stores') navigate('marketplace');
                if (tab === 'transport') navigate('transport');
              }}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tenantTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'pros'
                ? 'Services'
                : tab === 'stores'
                  ? 'Stores'
                  : tab === 'transport'
                    ? 'Transport'
                    : 'All'}
            </button>
          ),
        )}
      </div>

      {/* Recommended Providers */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Service Professionals
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Browse professionals available through OmniServe.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('pros')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            See all
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4">
          {pros.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No service professionals available"
              subtitle="Professionals will appear here when they publish their services."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pros.slice(0, 3).map(renderProviderCard)}
            </div>
          )}
        </div>
      </section>

      {/* Stores */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Local Stores
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Shop products from local stores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('marketplace')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Browse stores
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4">
          {stores.length === 0 ? (
            <EmptyState
              icon={StoreIcon}
              title="No stores available"
              subtitle="Local stores will appear here when available."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stores.slice(0, 3).map(renderStoreCard)}
            </div>
          )}
        </div>
      </section>

      {/* Active Orders */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Active Orders
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Orders currently in progress.
            </p>
          </div>

          <span className="text-xs font-medium text-slate-400">
            {activeOrders.length} active
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {activeOrders.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No active orders"
              subtitle="Orders you place will appear here."
            />
          ) : (
            activeOrders
              .slice(0, 3)
              .map((order) => renderOrderCard(order, true))
          )}
        </div>
      </section>

      {/* Recent Orders */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Orders
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest activity from your order history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('orders')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View orders
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No recent orders"
              subtitle="Your recent order history will appear here."
            />
          ) : (
            recentOrders
              .slice(0, 3)
              .map((order) => renderOrderCard(order, true))
          )}
        </div>
      </section>

      {/* Footer Summary */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        {orders.length} total orders
      </div>
    </div>
  );
}