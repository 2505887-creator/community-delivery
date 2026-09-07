import { useState } from 'react';
import { ShoppingBag, Plus, Check, Star, Clock, MapPin, Search, ShieldCheck, HeartPulse } from 'lucide-react';
import { LocalStore, StoreItem } from '../types';

interface StoreSectionProps {
  stores: LocalStore[];
  cartItems: { item: StoreItem; store: LocalStore; quantity: number }[];
  onAddToCart: (item: StoreItem, store: LocalStore) => void;
  onRemoveFromCart: (itemId: string) => void;
}

export default function StoreSection({
  stores,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
}: StoreSectionProps) {
  const [filterType, setFilterType] = useState<'all' | 'supermarket' | 'pharmacy'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStores = stores.filter((store) => {
    if (filterType !== 'all' && store.type !== filterType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      store.name.toLowerCase().includes(q) ||
      store.items.some(
        (it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
      )
    );
  });

  const getItemQuantity = (itemId: string) => {
    const found = cartItems.find((c) => c.item.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div id="stores-marketplace-section" className="space-y-6">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Category Toggles */}
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            id="store-filter-all"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Local Stores
          </button>

          <button
            id="store-filter-supermarket"
            onClick={() => setFilterType('supermarket')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'supermarket'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Supermarkets &amp; Groceries</span>
          </button>

          <button
            id="store-filter-pharmacy"
            onClick={() => setFilterType('pharmacy')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'pharmacy'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Pharmacies &amp; Health</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="store-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search milk, pain relief, fruit..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100 border-none text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* Stores List */}
      <div className="space-y-6">
        {filteredStores.map((store) => (
          <div
            key={store.id}
            id={`store-card-${store.id}`}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-500 hover:shadow-xs transition-colors"
          >
            {/* Store Cover & Meta Banner */}
            <div className="relative h-32 sm:h-36 overflow-hidden bg-slate-900">
              <img
                src={store.coverImage}
                alt={store.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex items-end p-4">
                <div className="flex items-center space-x-3 text-white">
                  <img
                    src={store.logo}
                    alt={store.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-lg object-cover border border-white/80 shadow-xs bg-white shrink-0"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">
                        {store.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {store.type}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        OPEN NOW
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-200 mt-0.5">
                      <span className="flex items-center font-bold text-amber-400">
                        ★ {store.rating.toFixed(1)} <span className="text-slate-300 font-normal ml-0.5">({store.reviewCount})</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center text-slate-200">
                        <Clock className="w-3 h-3 mr-1 text-blue-400" />
                        ~{store.deliveryEstimateMin} min delivery
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center text-slate-300">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                        {store.distanceMiles} mi away
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Products Carousel / Grid */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-900">
                  Instant Doorstep Delivery (~{store.deliveryEstimateMin} min)
                </span>
                <span className="text-slate-500">
                  Delivery Fee: <strong className="text-slate-900">${store.deliveryFee.toFixed(2)}</strong> &bull; Min Order: ${store.minOrder}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {store.items.map((item) => {
                  const qty = getItemQuantity(item.id);

                  return (
                    <div
                      key={item.id}
                      id={`item-card-${item.id}`}
                      className="bg-white rounded-lg p-2.5 border border-slate-200 hover:border-blue-500 transition-colors flex flex-col justify-between group"
                    >
                      <div>
                        <div className="relative aspect-square w-full rounded-md overflow-hidden bg-slate-50 mb-2 border border-slate-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                            {item.category}
                          </span>
                        </div>

                        <h5 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.unit}</p>
                      </div>

                      <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-xs sm:text-sm">
                          ${item.price.toFixed(2)}
                        </span>

                        {qty === 0 ? (
                          <button
                            id={`add-to-cart-${item.id}`}
                            onClick={() => onAddToCart(item, store)}
                            className="w-6 h-6 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                            title="Add to cart"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded-md text-xs font-bold border border-blue-200">
                            <button
                              onClick={() => onRemoveFromCart(item.id)}
                              className="text-slate-600 hover:text-rose-600 px-0.5 cursor-pointer"
                            >
                              -
                            </button>
                            <span>{qty}</span>
                            <button
                              onClick={() => onAddToCart(item, store)}
                              className="text-slate-600 hover:text-blue-700 px-0.5 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
