import { useState } from 'react';
import { Store, ShoppingBag, HeartPulse, CheckCircle2, Truck, Package, Clock, Plus, Tag } from 'lucide-react';
import { LocalStore, Order } from '../types';

interface MerchantDashboardProps {
  stores: LocalStore[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: any) => void;
}

export default function MerchantDashboard({
  stores = [],
  orders = [],
  onUpdateOrderStatus,
}: MerchantDashboardProps) {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || 'store-1');

  const fallbackStore: LocalStore = {
    id: 'store-1',
    name: 'GreenMarket Organics & Groceries',
    type: 'supermarket',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
    coverImage: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=800',
    rating: 4.92,
    reviewCount: 512,
    distanceMiles: 0.3,
    deliveryEstimateMin: 20,
    deliveryFee: 2.49,
    minOrder: 15,
    address: '108 Fulton St, New York, NY',
    isOpen: true,
    items: []
  };

  const currentStore = stores.find((s) => s.id === selectedStoreId) || stores[0] || fallbackStore;

  const storeOrders = orders.filter(
    (o) => o.storeId === currentStore.id || o.type === 'store_delivery'
  );

  return (
    <div id="merchant-dashboard-view" className="space-y-5">
      {/* Store Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src={currentStore.logo}
            alt={currentStore.name}
            referrerPolicy="no-referrer"
            className="w-13 h-13 rounded-xl object-cover border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">{currentStore.name}</h2>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {currentStore.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{currentStore.address}</p>
            <p className="text-[11px] text-slate-400">
              ★ {currentStore.rating} ({currentStore.reviewCount} tenant reviews) &bull; Verified Partner
            </p>
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            Switch Store Outlet
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-hidden"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders to Pack */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
          <span>Tenant Orders for Preparation</span>
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {storeOrders.length} orders
          </span>
        </h3>

        {storeOrders.length === 0 ? (
          <div className="p-7 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
            <p className="text-xs font-bold text-slate-700">No active tenant orders pending</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When tenants buy groceries or pharmacy items, their tickets appear here for rapid bag packing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {storeOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{order.title}</span>
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tenant: {order.tenantName} &bull; Delivery to: {order.tenantAddress} ({order.apartmentUnit})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-blue-600 text-base">${order.total.toFixed(2)}</span>
                    <div className="text-[10px] text-slate-500">{order.paymentMethod.toUpperCase()} Paid</div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px]">Bag Checklist:</span>
                    <div className="space-y-0.5">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                          <span>
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-medium">${(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Courier: {order.driverName ? `Assigned (${order.driverName})` : 'Awaiting driver'}
                  </span>

                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'assigned')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      Bag Packed &bull; Request Driver Pickup
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Items Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            Current Store Inventory ({currentStore.items.length} items)
          </h3>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Store Open &bull; In-Stock
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {currentStore.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              <img
                src={item.image}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-semibold text-slate-900 truncate">{item.name}</h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  ${item.price.toFixed(2)} &bull; {item.unit}
                </p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/70 px-1 py-0.2 rounded">
                  In Stock
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
