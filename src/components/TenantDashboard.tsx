import { useMemo, useState } from 'react';

import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Bookmark,
  Box,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Clock3,
  Inbox,
  LayoutDashboard,
  MapPin,
  Menu,
  Navigation,
  PackageSearch,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Store as StoreIcon,
  Timer,
  Truck,
  UserCircle,
  UsersRound,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';

import type { VerifiedPro, LocalStore, Order, StoreItem } from '../types';
import TenantOverview from '../pages/tenant/TenantOverview';
import TenantServicePros from '../pages/tenant/TenantServicePros';
import TenantMarketplaces from '../pages/tenant/TenantMarketplaces';
import TenantTransports from '../pages/tenant/TenantTransports';
import TenantOrders from '../pages/tenant/TenantOrders';
import TenantCart from '../pages/tenant/TenantCart';
import TenantSavedProviders from '../pages/tenant/TenantSavedProviders';
import TenantNotifications from '../pages/tenant/TenantNotifications';
import TenantProfile from '../pages/tenant/TenantProfile';
import TenantSettings from '../pages/tenant/TenantSettings';



type TenantTab = 'all' | 'pros' | 'stores' | 'transport';

type TenantSection =
  | 'overview'
  | 'pros'
  | 'marketplace'
  | 'transport'
  | 'orders'
  | 'cart'
  | 'saved'
  | 'notifications'
  | 'profile'
  | 'settings';

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
  onBookPro?: (pro: VerifiedPro) => void;
  onShopStore?: (store: LocalStore) => void;
  onTrackOrder?: (order: Order) => void;
  onRequestTransport?: () => void;
  tenantName?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  assigned: 'bg-violet-50 text-violet-700 border-violet-200',
  en_route: 'bg-blue-50 text-blue-700 border-blue-200',
  arrived: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SECTION_META: Record<
  TenantSection,
  { label: string; description: string; icon: LucideIcon }
> = {
  overview: {
    label: 'Overview',
    description: 'Your OmniServe activity at a glance',
    icon: LayoutDashboard,
  },
  pros: {
    label: 'Service Pros',
    description: 'Find verified professionals near you',
    icon: UsersRound,
  },
  marketplace: {
    label: 'Marketplace',
    description: 'Shop from local stores',
    icon: ShoppingBag,
  },
  transport: {
    label: 'Transport',
    description: 'Request rides and cargo delivery',
    icon: Truck,
  },
  orders: {
    label: 'My Orders',
    description: 'View active and recent orders',
    icon: PackageSearch,
  },
  cart: {
    label: 'Cart',
    description: 'Review your current shopping cart',
    icon: ShoppingCart,
  },
  saved: {
    label: 'Saved Providers',
    description: 'Saved professionals',
    icon: Bookmark,
  },
  notifications: {
    label: 'Notifications',
    description: 'Your OmniServe notifications',
    icon: Bell,
  },
  profile: {
    label: 'My Profile',
    description: 'Your tenant profile',
    icon: UserCircle,
  },
  settings: {
    label: 'Settings',
    description: 'Tenant portal preferences',
    icon: Settings,
  },
};

const NAV_ITEMS: TenantSection[] = [
  'overview',
  'pros',
  'marketplace',
  'transport',
  'orders',
  'cart',
  'saved',
  'notifications',
  'profile',
  'settings',
];

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_STYLES[status] ??
    'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>

      <p className="text-sm font-semibold text-slate-700">{title}</p>

      <p className="mt-1 max-w-md text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function formatCurrency(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return `KES ${numericValue.toLocaleString()}`;
}

function formatDate(value: unknown): string | null {
  if (!value) return null;

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: unknown): string | null {
  if (!value) return null;

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item));
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getOrderAddress(order: Order, tenantAddress: string): string {
  const orderData = order as Order & {
    tenantAddress?: string | null;
    apartmentUnit?: string | null;
  };

  const address = orderData.tenantAddress || tenantAddress;
  const unit = orderData.apartmentUnit;

  return unit ? `${address} · Unit ${unit}` : address;
}

function getOrderType(order: Order): string {
  const data = order as Order & {
    type?: string | null;
  };

  return data.type || 'Order';
}

function getProviderData(pro: VerifiedPro) {
  return pro as VerifiedPro & {
    avatar?: string | null;
    title?: string | null;
    rating?: number | string | null;
    reviewCount?: number | null;
    hourlyRate?: number | string | null;
    isVerified?: boolean | null;
    licenseNumber?: string | null;
    yearsExperience?: number | null;
    distanceMiles?: number | string | null;
    responseTimeMin?: number | null;
    specialties?: string[] | string | null;
    badges?: string[] | string | null;
    completedJobs?: number | null;
    bio?: string | null;
    address?: string | null;
  };
}

function getStoreData(store: LocalStore) {
  return store as LocalStore & {
    type?: string | null;
    logo?: string | null;
    coverImage?: string | null;
    rating?: number | string | null;
    reviewCount?: number | null;
    distanceMiles?: number | string | null;
    deliveryEstimateMin?: number | null;
    deliveryFee?: number | string | null;
    minOrder?: number | string | null;
    address?: string | null;
    isOpen?: boolean | null;
    items?: StoreItem[];
    products?: StoreItem[];
  };
}

function getItemData(item: StoreItem) {
  return item as StoreItem & {
    image?: string | null;
    name?: string | null;
    category?: string | null;
    price?: number | string | null;
    unit?: string | null;
    stock?: number | null;
    inStock?: boolean | null;
    description?: string | null;
  };
}

function getOrderData(order: Order) {
  return order as Order & {
    type?: string | null;
    category?: string | null;
    createdAt?: string | Date | null;
    tenantName?: string | null;
    tenantPhone?: string | null;
    tenantAddress?: string | null;
    apartmentUnit?: string | null;
    providerId?: string | null;
    driverId?: string | null;
    storeId?: string | null;
    subtotal?: number | string | null;
    deliveryFee?: number | string | null;
    serviceFee?: number | string | null;
    tax?: number | string | null;
    total?: number | string | null;
    paymentMethod?: string | null;
    estimatedArrivalMin?: number | null;
    urgency?: string | null;
    scheduledFor?: string | Date | null;
    notes?: string | null;
    currentLat?: number | null;
    currentLng?: number | null;
  };
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
  onBookPro,
  onShopStore,
  onTrackOrder,
  onRequestTransport,
  tenantName,
}: TenantDashboardProps) {
  const [portalSection, setPortalSection] =
    useState<TenantSection>('overview');

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const categories = useMemo(() => {
    const values = new Set<string>();

    pros.forEach((pro) => {
      if (pro.category) {
        values.add(pro.category);
      }
    });

    return Array.from(values).sort();
  }, [pros]);

  const filteredPros = useMemo(() => {
    const search = proSearchQuery.trim().toLowerCase();

    return pros.filter((pro) => {
      const data = getProviderData(pro);

      const matchesCategory =
        proCategoryFilter === 'all' ||
        pro.category?.toLowerCase() === proCategoryFilter.toLowerCase();

      const searchableText = [
        pro.name,
        pro.category,
        data.title,
        data.bio,
        ...formatArray(data.specialties),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [pros, proCategoryFilter, proSearchQuery]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !['completed', 'delivered', 'cancelled'].includes(order.status),
      ),
    [orders],
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0),
    [cartItems],
  );

  const cartTotal = useMemo(() => {
    let total = 0;
    let hasPrice = false;

    cartItems.forEach(({ item, quantity }) => {
      const data = getItemData(item);
      const price = Number(data.price);

      if (Number.isFinite(price)) {
        total += price * quantity;
        hasPrice = true;
      }
    });

    return hasPrice ? total : null;
  }, [cartItems]);

  const navigate = (section: TenantSection) => {
    setPortalSection(section);
    setMobileNavOpen(false);

    if (section === 'overview') {
      setTenantTab('all');
    }

    if (section === 'pros') {
      setTenantTab('pros');
    }

    if (section === 'marketplace') {
      setTenantTab('stores');
    }

    if (section === 'transport') {
      setTenantTab('transport');
    }

    if (section === 'orders') {
      setTenantTab('all');
    }

    if (section === 'cart') {
      setTenantTab('stores');
    }
  };

  const quickActions: {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
  }[] = [
    {
      key: 'find-service',
      label: 'Find Service',
      description: `${pros.length} verified pro${pros.length === 1 ? '' : 's'} available`,
      icon: Wrench,
      onClick: () => navigate('pros'),
    },
    {
      key: 'shop',
      label: 'Shop Marketplace',
      description:
        cartCount > 0
          ? `${cartCount} item${cartCount === 1 ? '' : 's'} in cart`
          : `${stores.length} local store${stores.length === 1 ? '' : 's'}`,
      icon: ShoppingBag,
      onClick: () => navigate('marketplace'),
    },
    {
      key: 'transport',
      label: 'Request Transport',
      description: 'Rides & cargo delivery',
      icon: Truck,
      onClick: () => {
        if (onRequestTransport) {
          onRequestTransport();
        } else {
          navigate('transport');
        }
      },
    },
    {
      key: 'track',
      label: 'Track Order',
      description: latestActiveOrder
        ? latestActiveOrder.title
        : `${orders.length} total order${orders.length === 1 ? '' : 's'}`,
      icon: PackageSearch,
      onClick: () => {
        if (latestActiveOrder && onTrackOrder) {
          onTrackOrder(latestActiveOrder);
        } else {
          navigate('orders');
        }
      },
    },
  ];


  const renderProviderCard = (pro: VerifiedPro) => {
    const data = getProviderData(pro);
    const specialties = formatArray(data.specialties);
    const badges = formatArray(data.badges);

    return (
      <article
        key={pro.id}
        className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <div className="flex items-start gap-3">
          {data.avatar ? (
            <img
              src={data.avatar}
              alt={pro.name}
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
              {getInitials(pro.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-900">
                  {pro.name}
                </h3>

                {data.title && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {data.title}
                  </p>
                )}
              </div>

              {data.isVerified !== false && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            {pro.category && (
              <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                {pro.category}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.rating != null && (
            <div className="rounded-lg bg-amber-50 px-2.5 py-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {data.rating}
              </div>
              {data.reviewCount != null && (
                <p className="mt-0.5 text-[11px] text-amber-700/70">
                  {data.reviewCount} review
                  {data.reviewCount === 1 ? '' : 's'}
                </p>
              )}
            </div>
          )}

          {data.distanceMiles != null && (
            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <MapPin className="h-3 w-3 text-slate-400" />
                {data.distanceMiles} mi
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Distance
              </p>
            </div>
          )}

          {data.responseTimeMin != null && (
            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Timer className="h-3 w-3 text-slate-400" />
                {data.responseTimeMin} min
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Response
              </p>
            </div>
          )}

          {data.yearsExperience != null && (
            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <ShieldCheck className="h-3 w-3 text-slate-400" />
                {data.yearsExperience} yrs
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Experience
              </p>
            </div>
          )}
        </div>

        {specialties.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Specialties
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {specialties.slice(0, 4).map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {badges.slice(0, 3).map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700"
              >
                <CheckCircle2 className="h-3 w-3" />
                {badge}
              </span>
            ))}
          </div>
        )}

        {(data.address || data.licenseNumber || data.completedJobs != null) && (
          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
            {data.address && (
              <p className="flex items-start gap-1.5 text-xs text-slate-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                {data.address}
              </p>
            )}

            {data.licenseNumber && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  License:
                </span>{' '}
                {data.licenseNumber}
              </p>
            )}

            {data.completedJobs != null && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  Completed jobs:
                </span>{' '}
                {data.completedJobs.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {data.bio && (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
            {data.bio}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {data.hourlyRate != null ? (
            <div>
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(data.hourlyRate)}
              </p>
              <p className="text-[11px] text-slate-400">per hour</p>
            </div>
          ) : (
            <span />
          )}

          <button
            onClick={() => onBookPro?.(pro)}
            disabled={!onBookPro}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Book
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>
    );
  };

  const renderStoreCard = (store: LocalStore) => {
    const data = getStoreData(store);
    const products = data.items ?? data.products ?? [];

    return (
      <article
        key={store.id}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <div className="relative h-32 overflow-hidden bg-slate-100">
          {data.coverImage ? (
            <img
              src={data.coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <StoreIcon className="h-10 w-10 text-slate-300" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/50 to-transparent p-3 pt-8">
            {data.logo ? (
              <img
                src={data.logo}
                alt={store.name}
                className="h-10 w-10 rounded-lg border-2 border-white bg-white object-cover shadow"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-white text-xs font-bold text-slate-600 shadow">
                {getInitials(store.name)}
              </div>
            )}
          </div>

          {data.isOpen != null && (
            <span
              className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                data.isOpen
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-white/90 text-slate-600'
              }`}
            >
              {data.isOpen ? 'Open' : 'Closed'}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                {store.name}
              </h3>

              {data.type && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {data.type}
                </p>
              )}
            </div>

            {data.rating != null && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {data.rating}
              </span>
            )}
          </div>

          {data.reviewCount != null && (
            <p className="mt-1 text-[11px] text-slate-400">
              {data.reviewCount} review
              {data.reviewCount === 1 ? '' : 's'}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.distanceMiles != null && (
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-xs font-semibold text-slate-700">
                  {data.distanceMiles} mi
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Distance
                </p>
              </div>
            )}

            {data.deliveryEstimateMin != null && (
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <Clock3 className="h-3 w-3 text-slate-400" />
                  {data.deliveryEstimateMin} min
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Delivery
                </p>
              </div>
            )}

            {data.deliveryFee != null && (
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-xs font-semibold text-slate-700">
                  {formatCurrency(data.deliveryFee)}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Delivery fee
                </p>
              </div>
            )}

            {data.minOrder != null && (
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-xs font-semibold text-slate-700">
                  {formatCurrency(data.minOrder)}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Minimum order
                </p>
              </div>
            )}
          </div>

          {data.address && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              {data.address}
            </p>
          )}

          {products.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Products
                </p>
                <span className="text-[10px] text-slate-400">
                  {products.length} available
                </span>
              </div>

              <div className="space-y-2">
                {products.slice(0, 3).map((item) => {
                  const itemData = getItemData(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                    >
                      {itemData.image ? (
                        <img
                          src={itemData.image}
                          alt={itemData.name ?? 'Product'}
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white">
                          <Box className="h-4 w-4 text-slate-300" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-700">
                          {itemData.name ?? 'Product'}
                        </p>

                        {itemData.category && (
                          <p className="truncate text-[10px] text-slate-400">
                            {itemData.category}
                          </p>
                        )}
                      </div>

                      {itemData.price != null && (
                        <span className="text-xs font-semibold text-slate-800">
                          {formatCurrency(itemData.price)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => onShopStore?.(store)}
            disabled={!onShopStore}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Shop Store
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>
    );
  };

  const renderOrderCard = (order: Order, compact = false) => {
    const data = getOrderData(order);

    return (
      <article
        key={order.id}
        className={`rounded-xl border border-slate-200 bg-white ${
          compact ? 'p-4' : 'p-5'
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                {order.title}
              </h3>
              <StatusBadge status={order.status} />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium capitalize text-slate-600">
                {getOrderType(order).replace(/_/g, ' ')}
              </span>

              {data.category && (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                  {data.category}
                </span>
              )}

              {data.urgency && (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium capitalize text-amber-700">
                  {data.urgency.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>

          {data.total != null && (
            <div className="shrink-0 lg:text-right">
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(data.total)}
              </p>
              {data.paymentMethod && (
                <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                  {data.paymentMethod.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.createdAt && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Date
              </p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {formatDate(data.createdAt)}
              </p>
            </div>
          )}

          {data.estimatedArrivalMin != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                ETA
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-700">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                {data.estimatedArrivalMin} min
              </p>
            </div>
          )}

          {data.scheduledFor && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Scheduled
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-700">
                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                {formatDateTime(data.scheduledFor)}
              </p>
            </div>
          )}

          {(data.tenantAddress || tenantAddress) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Address
              </p>
              <p className="mt-1 flex items-start gap-1 text-xs font-medium text-slate-700">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                {getOrderAddress(order, tenantAddress)}
              </p>
            </div>
          )}
        </div>

        {!compact && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.providerId && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
                  Provider assigned
                </span>
              )}

              {data.driverId && (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700">
                  Driver assigned
                </span>
              )}

              {data.storeId && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
                  Store order
                </span>
              )}
            </div>

            {data.tenantPhone && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {data.tenantPhone}
              </p>
            )}

            {data.notes && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Notes
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {data.notes}
                </p>
              </div>
            )}

            {(data.subtotal != null ||
              data.deliveryFee != null ||
              data.serviceFee != null ||
              data.tax != null) && (
              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
                {data.subtotal != null && (
                  <div>
                    <p className="text-[10px] text-slate-400">
                      Subtotal
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {formatCurrency(data.subtotal)}
                    </p>
                  </div>
                )}

                {data.deliveryFee != null && (
                  <div>
                    <p className="text-[10px] text-slate-400">
                      Delivery
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {formatCurrency(data.deliveryFee)}
                    </p>
                  </div>
                )}

                {data.serviceFee != null && (
                  <div>
                    <p className="text-[10px] text-slate-400">
                      Service
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {formatCurrency(data.serviceFee)}
                    </p>
                  </div>
                )}

                {data.tax != null && (
                  <div>
                    <p className="text-[10px] text-slate-400">
                      Tax
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {formatCurrency(data.tax)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(data.currentLat != null || data.currentLng != null) && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <Navigation className="h-3.5 w-3.5" />
                Live location available
                {data.currentLat != null &&
                  data.currentLng != null && (
                    <span className="font-medium">
                      ({data.currentLat}, {data.currentLng})
                    </span>
                  )}
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onTrackOrder?.(order)}
            disabled={!onTrackOrder}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Track Order
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>
    );
  };

  const renderSection = () => {
    switch (portalSection) {
      case 'overview':
        return (
    <TenantOverview
      tenantName={tenantName}
      tenantAddress={tenantAddress}
      pros={pros}
      stores={stores}
      orders={orders}
      activeOrders={activeOrders}
      recentOrders={recentOrders}
      latestActiveOrder={latestActiveOrder}
      cartCount={cartCount}
      cartItems={cartItems}
      tenantTab={tenantTab}
      setTenantTab={setTenantTab}
      navigate={navigate}
      onTrackOrder={onTrackOrder}
      renderOrderCard={renderOrderCard}
      renderProviderCard={renderProviderCard}
      renderStoreCard={renderStoreCard}
      EmptyState={EmptyState}
    />
  );

      case 'pros':
  return (
    <TenantServicePros
      pros={pros}
      filteredPros={filteredPros}
      categories={categories}
      proSearchQuery={proSearchQuery}
      setProSearchQuery={setProSearchQuery}
      proCategoryFilter={proCategoryFilter}
      setProCategoryFilter={setProCategoryFilter}
      renderProviderCard={renderProviderCard}
      EmptyState={EmptyState}
    />
  );

      case 'marketplace':
  return (
    <TenantMarketplaces
      stores={stores}
      cartCount={cartCount}
      navigate={navigate}
      renderStoreCard={renderStoreCard}
      EmptyState={EmptyState}
    />
  );

      case 'transport':
  return (
    <TenantTransports
      latestActiveOrder={latestActiveOrder}
      onRequestTransport={onRequestTransport}
      renderOrderCard={renderOrderCard}
      StatusBadge={StatusBadge}
      EmptyState={EmptyState}
    />
  );

      case 'orders':
  return (
    <TenantOrders
      activeOrders={activeOrders}
      recentOrders={recentOrders}
      orders={orders}
      renderOrderCard={renderOrderCard}
      EmptyState={EmptyState}
    />
  );

      case 'cart':
        return (
          <TenantCart
            cartItems={cartItems}
            cartCount={cartCount}
            cartTotal={cartTotal}
            getItemData={getItemData}
            getStoreData={getStoreData}
            formatCurrency={formatCurrency}
            EmptyState={EmptyState}
          />
        );
      case 'saved':
        return <TenantSavedProviders />;

      case 'notifications':
        return <TenantNotifications />;

      case 'profile':
        return <TenantProfile />;

      case 'settings':
        return <TenantSettings />;

      default:
         return null;
    }
  };

  const CurrentSectionIcon = SECTION_META[portalSection].icon;

  return (
    <div className="min-h-[600px]">
      {/* Mobile tenant portal header */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <CurrentSectionIcon className="h-4.5 w-4.5" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900">
              Tenant Portal
            </p>
            <p className="text-[11px] text-slate-500">
              {SECTION_META[portalSection].label}
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-label={
            mobileNavOpen ? 'Close tenant navigation' : 'Open tenant navigation'
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          {mobileNavOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {mobileNavOpen && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
          <nav className="grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((section) => {
              const item = SECTION_META[section];
              const Icon = item.icon;
              const active = portalSection === section;

              return (
                <button
                  key={section}
                  onClick={() => navigate(section)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>

                  {section === 'cart' && cartCount > 0 && (
                    <span
                      className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Tenant Portal shell */}
      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="border-b border-slate-100 px-3 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <LayoutDashboard className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    Tenant Portal
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    OmniServe
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-3 space-y-1">
              {NAV_ITEMS.map((section) => {
                const item = SECTION_META[section];
                const Icon = item.icon;
                const active = portalSection === section;

                return (
                  <button
                    key={section}
                    onClick={() => navigate(section)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {section === 'cart' && cartCount > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {cartCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-slate-100 px-3 pt-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Current location
                </p>

                <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  {tenantAddress}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main tenant content */}
        <main className="min-w-0">
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <div>
              <div className="flex items-center gap-2">
                <CurrentSectionIcon className="h-5 w-5 text-blue-600" />

                <h2 className="text-lg font-bold text-slate-900">
                  {SECTION_META[portalSection].label}
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {SECTION_META[portalSection].description}
              </p>
            </div>

            {portalSection === 'cart' && cartCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700">
                  {cartCount} item{cartCount === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>

          {renderSection()}
        </main>
      </div>
    </div>
  );
}