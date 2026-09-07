import { Shield, ShoppingCart, User, Wrench, Truck, Store, MapPin, Bell, Search, LogIn } from 'lucide-react';
import { UserRole, Order } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  cartCount: number;
  onOpenCart: () => void;
  activeOrders: Order[];
  onSelectOrder: (order: Order) => void;
  tenantAddress: string;
  onChangeAddress: () => void;
  // New props for auth UI
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  user?: { id: string; email: string; role: string; name?: string } | null;
  onLogout?: () => void;
}

export default function Navbar({
  currentRole,
  onRoleChange,
  cartCount,
  onOpenCart,
  activeOrders,
  onSelectOrder,
  tenantAddress,
  onChangeAddress,
  onOpenLogin,
  onOpenRegister,
  user,
  onLogout,
}: NavbarProps) {
  const ongoingOrders = activeOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Brand Identity / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-xs text-base">
          &Omega;
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Omni<span className="text-blue-600">Serve</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
              HIGH DENSITY
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search professionals, pharmacies, or groceries..."
            className="w-full bg-slate-100 border-none rounded-full py-1.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* Right Controls: Service Area, Bell, Cart, Live Order, Role Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Service Area */}
        <button
          id="tenant-address-picker-btn"
          onClick={onChangeAddress}
          className="hidden sm:flex flex-col items-end text-right hover:opacity-80 transition-opacity cursor-pointer"
          title="Click to change service area address"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
            Service Area
          </span>
          <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-500 inline shrink-0" />
            {tenantAddress}
          </span>
        </button>

        {/* Live Active Order Pill */}
        {ongoingOrders.length > 0 && (
          <button
            id="live-order-badge-btn"
            onClick={() => onSelectOrder(ongoingOrders[0])}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="View live order tracking"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span className="hidden lg:inline truncate max-w-[100px]">{ongoingOrders[0].title}</span>
            <span className="text-[9px] bg-white/25 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
              In Transit
            </span>
          </button>
        )}

        {/* Notification Bell */}
        <div
          className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-200 text-slate-600 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
        </div>

        {/* Shopping Cart Button */}
        <button
          id="header-cart-btn"
          onClick={onOpenCart}
          className="relative w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Shopping Cart"
        >
          <ShoppingCart className="w-4 h-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {cartCount}
            </span>
          )}
        </button>

        {/* Auth UI: Sign in / Register / User badge + Sign out */}
        {!user ? (
          <div className="flex items-center gap-2 ml-2">
            <button
              id="header-login-btn"
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
            <button
              id="header-register-btn"
              onClick={onOpenRegister}
              className="px-3 py-1 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
            >
              Register
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 ml-2">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Signed in</span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{user.name || user.email}</span>
            </div>
            <button
              id="header-logout-btn"
              onClick={onLogout}
              className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md border border-transparent hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Multi-Role Switcher */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            id="role-tenant-btn"
            onClick={() => onRoleChange('tenant')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              currentRole === 'tenant'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tenant</span>
          </button>

          <button
            id="role-provider-btn"
            onClick={() => onRoleChange('provider')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              currentRole === 'provider'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Pro</span>
          </button>

          <button
            id="role-driver-btn"
            onClick={() => onRoleChange('driver')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              currentRole === 'driver'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Driver</span>
          </button>

          <button
            id="role-merchant-btn"
            onClick={() => onRoleChange('merchant')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              currentRole === 'merchant'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Store</span>
          </button>
        </div>
      </div>
    </header>
  );
}