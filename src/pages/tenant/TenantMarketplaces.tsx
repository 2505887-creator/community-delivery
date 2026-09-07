import {
  ShoppingCart,
  Store as StoreIcon,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import type { LocalStore } from '../../types';

interface TenantMarketplacesProps {
  stores: LocalStore[];
  cartCount: number;

  navigate: (section: string) => void;

  renderStoreCard: (store: LocalStore) => React.ReactNode;

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

export default function TenantMarketplaces({
  stores,
  cartCount,
  navigate,
  renderStoreCard,
  EmptyState,
}: TenantMarketplacesProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <StoreIcon className="h-5 w-5 text-blue-600" />
            Local Marketplace
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Shop products from local stores available to your tenant account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cartCount > 0 && (
            <button
              onClick={() => navigate('cart')}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {cartCount} cart item{cartCount === 1 ? '' : 's'}
            </button>
          )}

          <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500">
            {stores.length} store{stores.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="mt-5">
        {stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title="No stores nearby yet"
            subtitle="Check back soon as more local stores join OmniServe."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stores.map(renderStoreCard)}
          </div>
        )}
      </div>
    </section>
  );
}