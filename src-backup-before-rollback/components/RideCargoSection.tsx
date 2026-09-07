import { useState, FormEvent } from 'react';
import { Car, Truck, Bike, ShieldCheck, Clock, MapPin, ChevronRight, Check } from 'lucide-react';
import { Driver } from '../types';

interface RideCargoSectionProps {
  drivers: Driver[];
  tenantAddress: string;
  onRequestDispatch: (dispatchData: {
    vehicleType: 'Car' | 'Cargo Van' | 'Motorbike / Scooter';
    driver: Driver;
    pickupLocation: string;
    destinationLocation: string;
    cargoDescription: string;
    total: number;
  }) => void;
}

const fallbackDrivers: Record<string, Driver> = {
  'Cargo Van': {
    id: 'driver-1',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    vehicleType: 'Cargo Van',
    vehiclePlate: 'NY-VAN-889',
    rating: 4.96,
    completedDeliveries: 1420,
    phone: '+1 (555) 890-1234',
    currentLat: 40.7145,
    currentLng: -74.0060,
    isOnline: true
  },
  'Motorbike / Scooter': {
    id: 'driver-2',
    name: 'Samira Khan',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=300',
    vehicleType: 'Motorbike / Scooter',
    vehiclePlate: 'NY-BK902',
    rating: 4.99,
    completedDeliveries: 980,
    phone: '+1 (555) 901-2345',
    currentLat: 40.7125,
    currentLng: -74.0020,
    isOnline: true
  },
  'Car': {
    id: 'driver-3',
    name: 'Carlos Gomez',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
    vehicleType: 'Car',
    vehiclePlate: 'NY-7B9382',
    rating: 4.88,
    completedDeliveries: 2310,
    phone: '+1 (555) 012-3456',
    currentLat: 40.7165,
    currentLng: -74.0045,
    isOnline: true
  }
};

export default function RideCargoSection({
  drivers = [],
  tenantAddress,
  onRequestDispatch
}: RideCargoSectionProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<'Cargo Van' | 'Car' | 'Motorbike / Scooter'>('Cargo Van');
  const [pickup, setPickup] = useState(tenantAddress);
  const [destination, setDestination] = useState('Riverside, Nairobi, Kenya');
  const [cargoNotes, setCargoNotes] = useState('Moving 2 flat-pack furniture boxes & tool crate');

  const options = [
    {
      id: 'Cargo Van',
      name: 'Uber Cargo Van',
      desc: 'Ideal for furniture, appliances, building materials & apartment moves',
      price: 3400.50,
      etaMin: 12,
      capacity: 'Up to 1,500 lbs / 250 cu ft',
      icon: Truck,
      driverMatch: drivers.find(d => d.vehicleType === 'Cargo Van') || drivers[0] || fallbackDrivers['Cargo Van']
    },
    {
      id: 'Motorbike / Scooter',
      name: 'Express Scooter Courier',
      desc: 'Ultra-fast delivery for small parcels, keys, documents & medicines',
      price: 80.50,
      etaMin: 6,
      capacity: 'Up to 20 lbs / backpack',
      icon: Bike,
      driverMatch: drivers.find(d => d.vehicleType?.includes('Scooter')) || drivers[1] || fallbackDrivers['Motorbike / Scooter']
    },
    {
      id: 'Car',
      name: 'City Sedan / Comfort',
      desc: 'Comfortable point-to-point ride for tenants & light cargo',
      price: 160.00,
      etaMin: 8,
      capacity: '4 passengers + trunk space',
      icon: Car,
      driverMatch: drivers.find(d => d.vehicleType === 'Car') || drivers[2] || fallbackDrivers['Car']
    }
  ];

  const currentOption = options.find(o => o.id === selectedVehicle) || options[0];
  const activeDriver = currentOption.driverMatch || fallbackDrivers[currentOption.id] || fallbackDrivers['Cargo Van'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onRequestDispatch({
      vehicleType: currentOption.id as any,
      driver: activeDriver,
      pickupLocation: pickup,
      destinationLocation: destination,
      cargoDescription: cargoNotes,
      total: currentOption.price
    });
  };

  return (
    <div id="ride-cargo-section" className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
              Uber On-Demand Transit &amp; Cargo Moving
            </h3>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              INSTANT FLEET
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Book certified drivers for tenant transportation, furniture transit, and urgent express courier pickup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Vehicle Selection Options */}
        <div className="space-y-3 lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Choose Fleet Vehicle
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedVehicle === opt.id;
              return (
                <div
                  key={opt.id}
                  id={`select-vehicle-${opt.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedVehicle(opt.id as any)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-blue-600">Ksh{opt.price.toFixed(2)}</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                      {opt.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center font-semibold text-emerald-600">
                      <Clock className="w-3 h-3 mr-1" />
                      ~{opt.etaMin}m away
                    </span>
                    <span className="font-medium text-slate-400">{opt.capacity}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assigned Driver Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={activeDriver?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'}
                alt={activeDriver?.name || 'Driver'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-slate-900">{activeDriver?.name || 'Assigned Driver'}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full">
                    ★ {activeDriver?.rating ?? 4.9}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {activeDriver?.vehicleType || currentOption.id} &bull; Plate {activeDriver?.vehiclePlate || 'NYC-FLEET'}
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-emerald-700 font-semibold flex items-center justify-end text-[11px]">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified Uber Partner
              </span>
              <span className="text-slate-400 text-[10px]">{activeDriver?.completedDeliveries ?? 100} completed dispatches</span>
            </div>
          </div>
        </div>

        {/* Dispatch Form Inputs */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
              Trip Details
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Pickup Location</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-rose-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Destination</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Cargo or Passenger Instructions</label>
              <textarea
                rows={2}
                value={cargoNotes}
                onChange={(e) => setCargoNotes(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Estimated Rate</span>
              <span className="font-bold text-blue-600 text-sm">Ksh{currentOption.price.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              id="dispatch-vehicle-btn"
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>Dispatch {currentOption.name}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
