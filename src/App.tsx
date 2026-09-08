import { useState, useEffect } from 'react';
import { 
  Wrench, Zap, Sparkles, ShoppingBag, HeartPulse, Truck, Search, 
  MapPin, ShieldCheck, Star, Clock, AlertTriangle, ArrowRight, Check,
  Filter, Phone, Compass, User, RefreshCw
} from 'lucide-react';

import { UserRole, ServiceCategory, VerifiedPro, LocalStore, StoreItem, Driver, Order, OrderStatus } from './types';
import Navbar from './components/Navbar';
import ServiceProCard from './components/ServiceProCard';
import BookingModal from './components/BookingModal';
import CredentialsModal from './components/CredentialsModal';
import StoreSection from './components/StoreSection';
import CartDrawer from './components/CartDrawer';
import LiveOrderTracker from './components/LiveOrderTracker';
import AiDiagnosisModal from './components/AiDiagnosisModal';
import RideCargoSection from './components/RideCargoSection';
import ProviderDashboard from './components/ProviderDashboard';
import DriverDashboard from './components/DriverDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import TenantDashboard from './components/TenantDashboard';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/Registermodal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('tenant');
  const [tenantAddress, setTenantAddress] = useState('Kilimani, Nairobi, Kenya');

  // Auth state -- identity and session come from Supabase via AuthContext.
  const { user, session, signOut, loading: authLoading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Backend loaded data
  const [pros, setPros] = useState<VerifiedPro[]>([]);
  const [stores, setStores] = useState<LocalStore[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tenant UI filters & tabs
  const [tenantTab, setTenantTab] = useState<'all' | 'pros' | 'stores' | 'transport'>('all');
  const [proCategoryFilter, setProCategoryFilter] = useState<string>('all');
  const [proSearchQuery, setProSearchQuery] = useState('');

  // Modals & Drawers state
  const [selectedProForBooking, setSelectedProForBooking] = useState<VerifiedPro | null>(null);
  const [selectedProForCredentials, setSelectedProForCredentials] = useState<VerifiedPro | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Shopping Cart state
  const [cartItems, setCartItems] = useState<{ item: StoreItem; store: LocalStore; quantity: number }[]>([]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth handlers -- AuthContext already updates `user`/`session` via
  // Supabase's onAuthStateChange listener, so these just close the modal
  // and surface feedback.
  const handleLoggedIn = () => {
    setIsLoginOpen(false);
    showToast('Signed in');
  };

  const handleRegistered = () => {
    setIsRegisterOpen(false);
    showToast('Account created');
  };

  const handleLogout = async () => {
    await signOut();
    showToast('Signed out');
  };


  if (authLoading) {
  return <div className="landing-loading"><div className="landing-loading-mark">OS</div><span>Loading your OmniServe portal…</span></div>;
}

// This component should ONLY render when user is authenticated
// (main.tsx handles redirecting unauthenticated users to landing page)
if (!user) {
  return null;
}
  const authHeaders = (): HeadersInit =>
    session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

  // Initial Fetch from Node.js Express API
  const fetchData = async () => {
    try {
      const [prosRes, storesRes, driversRes, ordersRes] = await Promise.all([
        fetch('/api/services', { headers: authHeaders() }),
        fetch('/api/stores', { headers: authHeaders() }),
        fetch('/api/drivers', { headers: authHeaders() }),
        fetch('/api/orders?mine=1', { headers: authHeaders() })
      ]);

      const [prosData, storesData, driversData, ordersData] = await Promise.all([
        prosRes.json(),
        storesRes.json(),
        driversRes.json(),
        ordersRes.json()
      ]);

      if (prosData.success) setPros(prosData.data);
      if (storesData.success) setStores(storesData.data);
      if (driversData.success) setDrivers(driversData.data);
      if (ordersData.success) {
        setOrders(ordersData.data);
        // If there's an ongoing active order and none selected, highlight first
        const ongoing = ordersData.data.find((o: Order) => o.status !== 'completed' && o.status !== 'cancelled');
        if (ongoing && !activeTrackingOrder) {
          // Keep reference available
        }
      }
    } catch (err) {
      console.error('Failed to load initial marketplace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Keep the portal aligned with the authenticated account. A provider
    // should land in the provider workspace instead of the tenant marketplace.
    if (user?.role && user.role !== 'admin') {
      setCurrentRole(user.role);
    }
  }, [user?.role]);

  useEffect(() => {
    // Re-fetch whenever auth state changes so the API can apply the caller's
    // tenant/provider/driver visibility rules.
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  // Cart operations
  const handleAddToCart = (item: StoreItem, store: LocalStore) => {
    setCartItems(prev => {
      // If adding from a different store, reset cart to single store
      if (prev.length > 0 && prev[0].store.id !== store.id) {
        return [{ item, store, quantity: 1 }];
      }
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { item, store, quantity: 1 }];
    });
    showToast(`Added "${item.name}" to cart.`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => {
      const existing = prev.find(p => p.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(p => p.item.id === itemId ? { ...p, quantity: p.quantity - 1 } : p);
      }
      return prev.filter(p => p.item.id !== itemId);
    });
  };

  // Create Service Booking
  const handleConfirmServiceBooking = async (bookingData: {
    issueDescription: string;
    urgency: 'normal' | 'emergency';
    scheduledFor?: string;
    notes: string;
    subtotal: number;
    total: number;
    paymentMethod: 'card' | 'apple_pay' | 'cash';
  }) => {
    if (!selectedProForBooking) return;

    try {
      const payload = {
        type: 'service',
        title: `${selectedProForBooking.name} - ${bookingData.issueDescription.slice(0, 35)}...`,
        category: selectedProForBooking.category,
        providerId: selectedProForBooking.id,
        tenantName: user?.name || 'Customer',
        tenantPhone: '',
        tenantAddress: tenantAddress,
        apartmentUnit: undefined,
        subtotal: bookingData.subtotal,
        total: bookingData.total,
        deliveryFee: 0,
        serviceFee: 4.50,
        tax: Number((bookingData.subtotal * 0.08875).toFixed(2)),
        paymentMethod: bookingData.paymentMethod,
        estimatedArrivalMin: selectedProForBooking.responseTimeMin,
        urgency: bookingData.urgency,
        scheduledFor: bookingData.scheduledFor,
        notes: bookingData.notes
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        setOrders(prev => [data.data, ...prev]);
        setSelectedProForBooking(null);
        setActiveTrackingOrder(data.data);
        showToast(`Dispatched ${selectedProForBooking.name}! Live GPS tracking is active.`);
      }
    } catch (err) {
      console.error('Error creating booking:', err);
    }
  };

  // Checkout Store Cart
  const handleCheckoutStoreCart = async (checkoutData: {
    items: { itemId: string; name: string; price: number; quantity: number }[];
    store: LocalStore;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    tax: number;
    total: number;
    notes: string;
    paymentMethod: 'card' | 'apple_pay' | 'cash';
  }) => {
    try {
      const payload = {
        type: 'store_delivery',
        title: `${checkoutData.store.name} Delivery (${checkoutData.items.length} items)`,
        category: checkoutData.store.type,
        storeId: checkoutData.store.id,
        storeName: checkoutData.store.name,
        storeType: checkoutData.store.type,
        items: checkoutData.items,
        tenantName: user?.name || 'Customer',
        tenantPhone: '',
        tenantAddress: tenantAddress,
        apartmentUnit: undefined,
        subtotal: checkoutData.subtotal,
        deliveryFee: checkoutData.deliveryFee,
        serviceFee: checkoutData.serviceFee,
        tax: checkoutData.tax,
        total: checkoutData.total,
        paymentMethod: checkoutData.paymentMethod,
        estimatedArrivalMin: checkoutData.store.deliveryEstimateMin,
        urgency: 'normal',
        notes: checkoutData.notes
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        setOrders(prev => [data.data, ...prev]);
        setCartItems([]);
        setIsCartOpen(false);
        setActiveTrackingOrder(data.data);
        showToast(`Uber courier dispatched for ${checkoutData.store.name}!`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  // Dispatch Uber Vehicle / Cargo
  const handleDispatchRideCargo = async (dispatchData: {
    vehicleType: 'Car' | 'Cargo Van' | 'Motorbike / Scooter';
    driver: Driver;
    pickupLocation: string;
    destinationLocation: string;
    cargoDescription: string;
    total: number;
  }) => {
    try {
      const payload = {
        type: 'ride_cargo',
        title: `Uber ${dispatchData.vehicleType} Dispatch`,
        category: 'transport',
        driverId: dispatchData.driver.id,
        tenantName: 'Jasmine Wangeci',
        tenantPhone: '+254 034 567 890',
        tenantAddress: dispatchData.destinationLocation,
        apartmentUnit: undefined,
        subtotal: dispatchData.total,
        deliveryFee: 0,
        serviceFee: 2.50,
        tax: Number((dispatchData.total * 0.08875).toFixed(2)),
        total: Number((dispatchData.total + 2.50 + dispatchData.total * 0.08875).toFixed(2)),
        paymentMethod: 'card',
        estimatedArrivalMin: 10,
        urgency: 'normal',
        notes: `${dispatchData.cargoDescription} (Pickup: ${dispatchData.pickupLocation})`
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        setOrders(prev => [data.data, ...prev]);
        setActiveTrackingOrder(data.data);
        showToast(`${dispatchData.driver.name} is on the way with ${dispatchData.vehicleType}!`);
      }
    } catch (err) {
      console.error('Ride dispatch error:', err);
    }
  };

  // Update order status via REST API
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, proId?: string, driverId?: string) => {
    try {
      const endpoint = status === 'assigned' && proId
        ? `/api/orders/${orderId}/assign`
        : `/api/orders/${orderId}/status`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: status === 'assigned' && proId
          ? JSON.stringify({ proId, driverId })
          : JSON.stringify({ status, proId, driverId })
      });
      const data = await res.json();

      if (data.success && data.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.data : o));
        if (activeTrackingOrder && activeTrackingOrder.id === orderId) {
          setActiveTrackingOrder(data.data);
        }
        showToast(`Order status updated to ${status.replace('_', ' ').toUpperCase()}`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Send in-app message
  const handleSendMessage = async (orderId: string, text: string) => {
    try {
      const sender = currentRole === 'provider' ? 'provider' : currentRole === 'driver' ? 'driver' : 'tenant';
      const senderName = user?.name || (currentRole === 'provider' ? 'Provider' : currentRole === 'driver' ? 'Driver' : 'Customer');

      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ sender, senderName, text })
      });
      const data = await res.json();

      if (data.success && data.data) {
        setOrders(prev => prev.map(o => {
          if (o.id === orderId) {
            return { ...o, messages: [...o.messages, data.data] };
          }
          return o;
        }));

        if (activeTrackingOrder && activeTrackingOrder.id === orderId) {
          setActiveTrackingOrder(prev => prev ? { ...prev, messages: [...prev.messages, data.data] } : null);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Filter service pros for tenant view
  const filteredPros = pros.filter(pro => {
    if (proCategoryFilter !== 'all' && pro.category !== proCategoryFilter) return false;
    if (!proSearchQuery.trim()) return true;
    const q = proSearchQuery.toLowerCase();
    return (
      pro.name.toLowerCase().includes(q) ||
      pro.title.toLowerCase().includes(q) ||
      pro.specialties.some(s => s.toLowerCase().includes(q))
    );
  });

  const cartTotalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const ongoingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const latestActiveOrder = ongoingOrders[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center space-x-2 text-xs font-semibold animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Main App Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Header Navbar */}
        <Navbar
          currentRole={currentRole}
          onRoleChange={(role) => { if (user?.role === 'admin') setCurrentRole(role); else setCurrentRole(user?.role || 'tenant'); }}
          cartCount={cartTotalCount}
          onOpenCart={() => setIsCartOpen(true)}
          activeOrders={orders}
          onSelectOrder={(order) => setActiveTrackingOrder(order)}
          tenantAddress={tenantAddress}
          onChangeAddress={() => setIsAddressModalOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
          user={user as unknown as typeof User}
          onLogout={handleLogout}
        />

        {/* Dynamic Role Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Role Banner Notification (When not in tenant mode) */}
          {currentRole !== 'tenant' && user?.role === 'admin' && (
            <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between text-xs border border-slate-800 shadow-md">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                <span>
                  <strong>{currentRole.toUpperCase()} PORTAL ACTIVE</strong> &bull; You are currently managing incoming jobs, live dispatches, and orders as a {currentRole}.
                </span>
              </div>
              <button
                onClick={() => setCurrentRole('tenant')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Back to Tenant Dashboard
              </button>
            </div>
          )}

          {/* ---------------- TENANT MODE ---------------- */}
          {currentRole === 'tenant' && <TenantDashboard tenantAddress={tenantAddress} pros={pros} stores={stores} orders={orders} tenantTab={tenantTab} setTenantTab={setTenantTab} proCategoryFilter={proCategoryFilter} setProCategoryFilter={setProCategoryFilter} proSearchQuery={proSearchQuery} setProSearchQuery={setProSearchQuery} cartItems={cartItems} latestActiveOrder={latestActiveOrder} />}
          {currentRole !== 'tenant' && false && (
            <div className="space-y-6">
              
              {/* Category Quick Selector Grid (5 items from High Density theme) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 shrink-0">
                <div
                  id="quick-cat-plumbing"
                  onClick={() => {
                    setTenantTab('pros');
                    setProCategoryFilter('plumbing');
                  }}
                  className={`bg-white border p-3.5 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 hover:border-blue-500 transition-colors cursor-pointer group shadow-xs ${
                    proCategoryFilter === 'plumbing' && tenantTab === 'pros' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🪠</div>
                  <span className="text-xs font-bold text-slate-700">Plumbing</span>
                </div>

                <div
                  id="quick-cat-electrical"
                  onClick={() => {
                    setTenantTab('pros');
                    setProCategoryFilter('electrical');
                  }}
                  className={`bg-white border p-3.5 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 hover:border-blue-500 transition-colors cursor-pointer group shadow-xs ${
                    proCategoryFilter === 'electrical' && tenantTab === 'pros' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">⚡</div>
                  <span className="text-xs font-bold text-slate-700">Electrical</span>
                </div>

                <div
                  id="quick-cat-cleaning"
                  onClick={() => {
                    setTenantTab('pros');
                    setProCategoryFilter('cleaning');
                  }}
                  className={`bg-white border p-3.5 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 hover:border-blue-500 transition-colors cursor-pointer group shadow-xs ${
                    proCategoryFilter === 'cleaning' && tenantTab === 'pros' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🧹</div>
                  <span className="text-xs font-bold text-slate-700">Cleaning</span>
                </div>

                <div
                  id="quick-cat-pharmacy"
                  onClick={() => setTenantTab('stores')}
                  className={`bg-white border p-3.5 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 hover:border-blue-500 transition-colors cursor-pointer group shadow-xs ${
                    tenantTab === 'stores' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">💊</div>
                  <span className="text-xs font-bold text-slate-700">Pharmacy</span>
                </div>

                <div
                  id="quick-cat-supermarket"
                  onClick={() => setTenantTab('stores')}
                  className={`bg-white border p-3.5 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 hover:border-blue-500 transition-colors cursor-pointer group shadow-xs ${
                    tenantTab === 'stores' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🛒</div>
                  <span className="text-xs font-bold text-slate-700">Supermarket</span>
                </div>
              </div>

              {/* High Density 2-Column Grid Layout: Left (Col-8) Marketplace / Right (Col-4) Active Request & History */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* Left Column: Pro listings, Store inventory, Cargo dispatch */}
                <div className="lg:col-span-8 space-y-6 min-h-0">
                  
                  {/* Category Filter Tabs */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-bold">
                    <button
                      id="tab-all"
                      onClick={() => setTenantTab('all')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        tenantTab === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      All Services &amp; Stores
                    </button>

                    <button
                      id="tab-pros"
                      onClick={() => setTenantTab('pros')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        tenantTab === 'pros'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Verified Pros ({pros.length})</span>
                    </button>

                    <button
                      id="tab-stores"
                      onClick={() => setTenantTab('stores')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        tenantTab === 'stores'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Supermarkets &amp; Meds ({stores.length})</span>
                    </button>

                    <button
                      id="tab-transport"
                      onClick={() => setTenantTab('transport')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        tenantTab === 'transport'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Uber Cargo Fleet</span>
                    </button>
                  </div>

                  {/* SECTION: Verified Service Pros */}
                  {(tenantTab === 'all' || tenantTab === 'pros') && (
                    <section id="verified-pros-section" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h2 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                              Verified Providers Near You
                            </h2>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              Guaranteed
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Direct dispatch for certified plumbing, electrical troubleshooting, and sanitization.
                          </p>
                        </div>

                        {/* Trade filter pill tabs */}
                        <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                          {[
                            { id: 'all', label: 'All Trades' },
                            { id: 'plumbing', label: 'Plumbing' },
                            { id: 'electrical', label: 'Electrical' },
                            { id: 'cleaning', label: 'Cleaning' },
                            { id: 'carpentry', label: 'Carpentry' },
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              id={`filter-pro-${cat.id}`}
                              onClick={() => setProCategoryFilter(cat.id)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                proCategoryFilter === cat.id
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Search Bar for Pros */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          id="pro-search-bar"
                          value={proSearchQuery}
                          onChange={(e) => setProSearchQuery(e.target.value)}
                          placeholder="Search by name, trade (plumber, electrician, cleaner), or issue..."
                          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 border-none text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-hidden"
                        />
                      </div>

                      {/* Pro Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPros.map((pro) => (
                          <ServiceProCard
                            key={pro.id}
                            pro={pro}
                            onBook={(p) => setSelectedProForBooking(p)}
                            onViewCredentials={(p) => setSelectedProForCredentials(p)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* SECTION: Local Stores */}
                  {(tenantTab === 'all' || tenantTab === 'stores') && (
                    <section id="supermarket-pharmacy-section" className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                            Supermarkets &amp; Pharmacies Near Area
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Order groceries, fresh produce, and prescription drugs for instant courier doorstep delivery.
                          </p>
                        </div>
                      </div>

                      <StoreSection
                        stores={stores}
                        cartItems={cartItems}
                        onAddToCart={handleAddToCart}
                        onRemoveFromCart={handleRemoveFromCart}
                      />
                    </section>
                  )}

                  {/* SECTION: Uber Cargo */}
                  {(tenantTab === 'all' || tenantTab === 'transport') && (
                    <section id="uber-cargo-section" className="space-y-4 pt-2">
                      <RideCargoSection
                        drivers={drivers}
                        tenantAddress={tenantAddress}
                        onRequestDispatch={handleDispatchRideCargo}
                      />
                    </section>
                  )}

                </div>

                {/* Right Column: High Density Active Request Card & Service History Card */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                  
                  {/* Active Request Card (Matching Design HTML exactly) */}
                  <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden shrink-0 border border-slate-800">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Active Request</h4>
                          <p className="text-lg font-bold mt-1 tracking-tight">
                            {latestActiveOrder ? latestActiveOrder.title : 'Pharmacy Delivery'}
                          </p>
                        </div>
                        <div className="px-2 py-0.5 bg-blue-500 rounded text-[10px] font-bold uppercase tracking-wider text-white">
                          {latestActiveOrder ? latestActiveOrder.status.replace('_', ' ') : 'IN TRANSIT'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5 shrink-0">
                          <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-xl">
                            {latestActiveOrder?.type === 'ride_cargo'
  ? '🚛'
  : latestActiveOrder?.type === 'store_delivery'
    ? '🛵'
    : '👨‍🔧'}
                        </div>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">
                            {latestActiveOrder?.driverName || latestActiveOrder?.providerName || 'Ahmed K.'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            ETA: {latestActiveOrder?.estimatedArrivalMin || 4} minutes &bull; Silver Honda
                          </p>
                        </div>
                      </div>

                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{
                            width: latestActiveOrder?.status === 'in_progress' ? '75%' : latestActiveOrder?.status === 'en_route' ? '45%' : '80%'
                          }}
                        ></div>
                      </div>

                      {latestActiveOrder ? (
                        <button
                          id="open-active-order-btn"
                          onClick={() => setActiveTrackingOrder(latestActiveOrder)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <span>Open Live GPS &amp; Chat</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (orders.length > 0) setActiveTrackingOrder(orders[0]);
                            else showToast('No active orders. Book a pro or order groceries to track.');
                          }}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          View In-Flight Simulation
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Service History & Fleet Activity (Matching Design HTML exactly) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col shadow-xs">
                    <h4 className="font-bold text-sm text-slate-900 mb-4 tracking-tight">
                      Service History &amp; Fleet Activity
                    </h4>

                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🧽</span>
                          <div>
                            <p className="font-bold text-slate-900">General Cleaning</p>
                            <p className="text-[10px] text-slate-400">Oct 12, 2:30 PM &bull; Completed</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800">Ksh850.00</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🍏</span>
                          <div>
                            <p className="font-bold text-slate-900">Organic Grocery Pack</p>
                            <p className="text-[10px] text-slate-400">Oct 10, 11:15 AM &bull; Completed</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800">Ksh1420.10</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🔌</span>
                          <div>
                            <p className="font-bold text-slate-900">Outlet &amp; Breaker Repair</p>
                            <p className="text-[10px] text-slate-400">Sep 28, 4:00 PM &bull; Completed</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800">Ksh550.00</span>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Monthly summary invoice generated for 72 Wall St, Apt 14C.')}
                      className="mt-5 w-full py-2.5 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Download Monthly Invoice
                    </button>
                  </div>

                  {/* AI Emergency Diagnostic Quick Action Card */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Diagnostic</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Urgent Home Issue or Repair?
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Get automated repair steps, estimated repair pricing, and instant pro matching.
                      </p>
                    </div>

                    <button
                      id="open-ai-diagnosis-banner-btn"
                      onClick={() => setIsAiModalOpen(true)}
                      className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <span>Diagnose Issue &amp; Price</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ---------------- PROVIDER (PRO) MODE ---------------- */}
          {currentRole === 'provider' && (
            <ProviderDashboard
              pros={pros}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSelectOrderToTrack={(order) => setActiveTrackingOrder(order)}
            />
          )}

          {/* ---------------- DRIVER MODE ---------------- */}
          {currentRole === 'driver' && (
            <DriverDashboard
              drivers={drivers}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSelectOrderToTrack={(order) => setActiveTrackingOrder(order)}
            />
          )}

          {/* ---------------- MERCHANT (STORE) MODE ---------------- */}
          {currentRole === 'merchant' && (
            <MerchantDashboard
              stores={stores}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

        </main>
      </div>

      {/* ---------------- MODALS & DRAWERS ---------------- */}

      {/* Booking Modal */}
      {selectedProForBooking && (
        <BookingModal
          pro={selectedProForBooking}
          tenantAddress={tenantAddress}
          onClose={() => setSelectedProForBooking(null)}
          onConfirmBooking={handleConfirmServiceBooking}
        />
      )}

      {/* Pro Verified Credentials Modal */}
      {selectedProForCredentials && (
        <CredentialsModal
          pro={selectedProForCredentials}
          onClose={() => setSelectedProForCredentials(null)}
          onBookNow={() => {
            setSelectedProForBooking(selectedProForCredentials);
            setSelectedProForCredentials(null);
          }}
        />
      )}

      {/* AI Emergency Diagnosis & Fair Pricing Modal */}
      {isAiModalOpen && (
        <AiDiagnosisModal
          pros={pros}
          onClose={() => setIsAiModalOpen(false)}
          onSelectProToBook={(pro, desc, urgency) => {
            setSelectedProForBooking(pro);
            setIsAiModalOpen(false);
          }}
        />
      )}

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={() => setCartItems([])}
        tenantAddress={tenantAddress}
        onCheckout={handleCheckoutStoreCart}
      />

      {/* Live Active Order Tracker Sheet / Modal */}
      {activeTrackingOrder && (
        <LiveOrderTracker
          order={activeTrackingOrder}
          onClose={() => setActiveTrackingOrder(null)}
          onSendMessage={handleSendMessage}
          onUpdateStatus={(orderId, status) => handleUpdateOrderStatus(orderId, status)}
        />
      )}

      {/* Tenant Change Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-base">Select Tenant Residence</h3>
            <div className="space-y-2">
              {[
                '72 Wall St, Apt 14C',
                '142 Grand St, Apt 3B',
                '50 Broadway, Penthouse 8',
                '210 Canal St, Suite 402'
              ].map((addr) => (
                <button
                  key={addr}
                  onClick={() => {
                    setTenantAddress(addr);
                    setIsAddressModalOpen(false);
                    showToast(`Updated location to ${addr}`);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    tenantAddress === addr
                      ? 'border-sky-600 bg-sky-50 text-sky-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{addr}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddressModalOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLoggedIn={handleLoggedIn}
          onForgotPassword={() => {
            setIsLoginOpen(false);
            setIsForgotOpen(true);
          }}
        />
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <RegisterModal onClose={() => setIsRegisterOpen(false)} onRegistered={handleRegistered} />
      )}

      {isForgotOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotOpen(false)} />
      )}

    </div>
  );
}
