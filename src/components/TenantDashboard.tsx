import type { VerifiedPro, LocalStore, Order, StoreItem } from '../types';

type TenantTab = 'all' | 'pros' | 'stores' | 'transport';

interface TenantDashboardProps {
  tenantAddress: string;

  pros: VerifiedPro[];
  stores: LocalStore[];
  orders: Order[];

  tenantTab: TenantTab;
  setTenantTab: (tab: TenantTab) => void;

  proCategoryFilter: string;
  setProCategoryFilter: (category: string) => void;

  proSearchQuery: string;
  setProSearchQuery: (query: string) => void;

  cartItems: {
    item: StoreItem;
    store: LocalStore;
    quantity: number;
  }[];

  latestActiveOrder: Order | null;
}

export default function TenantDashboard({
  tenantAddress,
  pros,
  stores,
  orders,
  tenantTab,
  setTenantTab,
  proCategoryFilter,
  setProCategoryFilter,
  proSearchQuery,
  setProSearchQuery,
  cartItems,
  latestActiveOrder,
}: TenantDashboardProps) {
  const filteredPros = pros.filter((pro) => {
    const matchesCategory =
      proCategoryFilter === 'all' ||
      pro.category?.toLowerCase() === proCategoryFilter.toLowerCase();

    const matchesSearch =
      !proSearchQuery ||
      pro.name?.toLowerCase().includes(proSearchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Tenant Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Welcome to your tenant dashboard.
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Location: {tenantAddress}
        </p>
      </div>

      <div className="flex gap-2">
        {(['all', 'pros', 'stores', 'transport'] as TenantTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTenantTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tenantTab === tab
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tab === 'pros'
              ? 'Providers'
              : tab === 'stores'
                ? 'Stores'
                : tab === 'transport'
                  ? 'Transport'
                  : 'All'}
          </button>
        ))}
      </div>

      {(tenantTab === 'all' || tenantTab === 'pros') && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Verified Providers
          </h2>

          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={proSearchQuery}
              onChange={(e) => setProSearchQuery(e.target.value)}
              placeholder="Search providers..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />

            <select
              value={proCategoryFilter}
              onChange={(e) => setProCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>

          <div className="mt-4">
            {filteredPros.length === 0 ? (
              <p className="text-sm text-slate-500">
                No providers found.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPros.map((pro) => (
                  <div
                    key={pro.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {pro.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {pro.category}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {(tenantTab === 'all' || tenantTab === 'stores') && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Local Stores
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {stores.length} store{stores.length === 1 ? '' : 's'} available.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {cartItems.length} item{cartItems.length === 1 ? '' : 's'} in cart.
          </p>
        </section>
      )}

      {(tenantTab === 'all' || tenantTab === 'transport') && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Transport & Cargo
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Request a ride or cargo delivery from your tenant dashboard.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Orders
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {orders.length} total order{orders.length === 1 ? '' : 's'}.
        </p>

        {latestActiveOrder && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">
              {latestActiveOrder.title}
            </p>

            <p className="text-sm text-slate-500">
              Status: {latestActiveOrder.status.replace('_', ' ')}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}