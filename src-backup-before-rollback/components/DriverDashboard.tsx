import { useState } from 'react';
import { 
  Truck, Navigation, CheckCircle2, MapPin, DollarSign, Clock, 
  ShieldCheck, Phone, Check, ChevronRight, Package 
} from 'lucide-react';
import { Driver, Order, OrderStatus } from '../types';

interface DriverDashboardProps {
  drivers: Driver[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, driverId?: string) => void;
  onSelectOrderToTrack: (order: Order) => void;
}

export default function DriverDashboard({
  drivers = [],
  orders = [],
  onUpdateOrderStatus,
  onSelectOrderToTrack
}: DriverDashboardProps) {
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || 'driver-1');
  const [isOnline, setIsOnline] = useState(true);

  const fallbackDriver: Driver = {
    id: 'driver-1',
    name: 'Martin Njeru',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    vehicleType: 'Cargo Van',
    vehiclePlate: 'KCW-889Y',
    rating: 4.96,
    completedDeliveries: 1420,
    phone: '+254 098 765 432',
    currentLat: 40.7145,
    currentLng: -74.0060,
    isOnline: true
  };

  const currentDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0] || fallbackDriver;

  // Delivery & transport orders
  const driverOrders = orders.filter(o => 
    o.type !== 'service' && 
    (o.driverId === currentDriver.id || o.status === 'pending' || (o.status === 'assigned' && !o.driverId))
  );

  const activeDeliveries = driverOrders.filter(o => 
    o.driverId === currentDriver.id && o.status !== 'completed' && o.status !== 'cancelled'
  );

  const availableDispatches = driverOrders.filter(o => 
    !o.driverId || o.status === 'pending'
  );

  const completedDeliveries = driverOrders.filter(o => 
    o.driverId === currentDriver.id && o.status === 'completed'
  );

  const todayEarnings = 480.50 + completedDeliveries.length * 8.50;

  return (
    <div id="driver-dashboard-view" className="space-y-5">
      
      {/* Driver Header Profile & Vehicle Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src={currentDriver.avatar}
            alt={currentDriver.name}
            referrerPolicy="no-referrer"
            className="w-13 h-13 rounded-xl object-cover border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">{currentDriver.name}</h2>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Truck className="w-3 h-3" />
                <span>{currentDriver.vehicleType}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Plate: <strong className="font-mono text-slate-800">{currentDriver.vehiclePlate}</strong> &bull; Uber Certified Fleet
            </p>
            <p className="text-[11px] text-slate-400">★ {currentDriver.rating} ({currentDriver.completedDeliveries} completed dispatches)</p>
          </div>
        </div>

        {/* Driver Account Picker & Availability */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Switch Fleet Driver</label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.vehicleType})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-200 animate-ping' : 'bg-slate-400'}`}></span>
            <span>{isOnline ? 'Online for Trips' : 'Offline'}</span>
          </button>
        </div>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Shift Earnings</div>
          <div className="text-xl font-bold text-slate-900 mt-1">Ksh{todayEarnings.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Includes 100% tenant tips</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Assigned Vehicle</div>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">{currentDriver.vehicleType}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{currentDriver.vehiclePlate}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Today's Trips</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{completedDeliveries.length + activeDeliveries.length}</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Avg: 14 mins</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Acceptance Rate</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">98.5%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Top-tier driver rating</div>
        </div>
      </div>

      {/* Active Trip Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
          <span>Active Turn-By-Turn Deliveries</span>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {activeDeliveries.length}
          </span>
        </h3>

        {activeDeliveries.length === 0 ? (
          <div className="p-7 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Package className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
            <p className="text-xs font-bold text-slate-700">No active deliveries at the moment</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select an available order below to accept and start route navigation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeliveries.map((trip) => (
              <div
                key={trip.id}
                className="p-4 rounded-xl border border-emerald-500 bg-emerald-50/15 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{trip.title}</span>
                      <span className="bg-emerald-600 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-full">
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1.5 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="font-medium">Pickup: {trip.originLocation.label}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="font-medium">Dropoff: {trip.tenantAddress} ({trip.apartmentUnit})</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-blue-600">Ksh{(trip.deliveryFee + 7.50).toFixed(2)}</span>
                    <div className="text-[10px] text-emerald-700 font-semibold">Driver Fee + Tip</div>
                  </div>
                </div>

                {trip.items && trip.items.length > 0 && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-1">Package Items ({trip.items.length}):</span>
                    <div className="flex flex-wrap gap-1.5 text-slate-600">
                      {trip.items.map((it, idx) => (
                        <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          {it.quantity}x {it.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Driver Navigation Milestones */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => onSelectOrderToTrack(trip)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Open Full GPS Map
                  </button>

                  {trip.status === 'assigned' && (
                    <button
                      onClick={() => onUpdateOrderStatus(trip.id, 'en_route')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Picked Up / En Route
                    </button>
                  )}

                  {trip.status === 'en_route' && (
                    <button
                      onClick={() => onUpdateOrderStatus(trip.id, 'arrived')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Arrived at Destination
                    </button>
                  )}

                  {trip.status === 'arrived' && (
                    <button
                      onClick={() => onUpdateOrderStatus(trip.id, 'completed')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Delivery</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Dispatches Ready to Pick Up */}
      {availableDispatches.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-base text-slate-900">
            Available Store Pickups &amp; Resident Rides
          </h3>

          <div className="space-y-2.5">
            {availableDispatches.map((trip) => (
              <div
                key={trip.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{trip.title}</span>
                    <span className="text-[9px] uppercase font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                      Ready for pickup
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Pickup: <strong>{trip.originLocation.label}</strong> &bull; Drop: {trip.tenantAddress}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-600">${(trip.deliveryFee + 7.50).toFixed(2)}</span>
                    <div className="text-[10px] text-emerald-600 font-semibold">Instant payout</div>
                  </div>

                  <button
                    onClick={() => onUpdateOrderStatus(trip.id, 'assigned', undefined)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Accept Trip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
