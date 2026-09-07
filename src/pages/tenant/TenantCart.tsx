import {
  Box,
  MapPin,
  ShoppingCart,
  Store as StoreIcon,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import type { LocalStore, StoreItem } from '../../types';

interface CartItem {
  item: StoreItem;
  store: LocalStore;
  quantity: number;
}

interface TenantCartProps {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number | null;

  getItemData: (item: StoreItem) => {
    image?: string;
    name?: string;
    category?: string;
    price?: number | string;
    unit?: string;
  };

  getStoreData: (store: LocalStore) => {
    address?: string;
  };

  formatCurrency: (value: unknown) => string | null;

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

export default function TenantCart({
  cartItems,
  cartCount,
  cartTotal,
  getItemData,
  getStoreData,
  formatCurrency,
  EmptyState,
}: TenantCartProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Your Cart
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Items currently held in your existing cart data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {cartCount} item{cartCount === 1 ? '' : 's'}
          </span>

          {cartTotal != null && (
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(cartTotal)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5">
        {cartItems.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            subtitle="Products you add from connected marketplace functionality will appear here."
          />
        ) : (
          <div className="space-y-3">
            {cartItems.map(({ item, store, quantity }) => {
              const itemData = getItemData(item);
              const storeData = getStoreData(store);

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                >
                  {itemData.image ? (
                    <img
                      src={itemData.image}
                      alt={itemData.name ?? 'Product'}
                      className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Box className="h-6 w-6 text-slate-300" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {itemData.name ?? 'Product'}
                    </p>

                    {itemData.category && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {itemData.category}
                      </p>
                    )}

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      <StoreIcon className="h-3.5 w-3.5" />
                      {store.name}
                    </p>

                    {storeData.address && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {storeData.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {itemData.price != null
                          ? formatCurrency(itemData.price)
                          : 'Price unavailable'}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Qty: {quantity}
                        {itemData.unit ? ` · ${itemData.unit}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cartTotal != null && cartItems.length > 0 && (
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-medium text-slate-500">
            Cart total
          </span>

          <span className="text-lg font-bold text-slate-900">
            {formatCurrency(cartTotal)}
          </span>
        </div>
      )}
    </section>
  );
}
