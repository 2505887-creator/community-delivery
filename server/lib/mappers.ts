import type {
  Driver,
  LocalStore,
  Order,
  Profile,
  StoreItem,
  VerifiedPro,
} from '@prisma/client';
import { decodeOrderNotes } from './orderRules';

type StoreWithItems = LocalStore & { items?: StoreItem[] };
type OrderWithRels = Order & {
  driver?: Driver | null;
  store?: LocalStore | null;
  provider?: VerifiedPro | null;
};

export function mapStore(store: StoreWithItems) {
  return {
    id: store.id,
    name: store.name,
    type: store.type,
    logo: store.logo ?? '',
    coverImage: store.coverImage ?? '',
    rating: store.rating,
    reviewCount: store.reviewCount,
    distanceMiles: store.distanceMiles,
    deliveryEstimateMin: store.deliveryEstimateMin,
    deliveryFee: store.deliveryFee,
    minOrder: store.minOrder,
    address: store.address,
    isOpen: store.isOpen,
    createdAt: store.createdAt,
    isVerified: store.rating >= 4.5,
    items: (store.items ?? []).map(mapStoreItem),
  };
}

export function mapStoreItem(item: StoreItem) {
  return {
    id: item.id,
    storeId: item.storeId,
    name: item.name,
    category: item.category,
    price: item.price,
    unit: item.unit,
    image: item.image ?? '',
    inStock: item.inStock,
    description: item.description ?? '',
  };
}

export function mapOrder(order: OrderWithRels) {
  const decoded = decodeOrderNotes(order.notes);
  return {
    id: order.id,
    type: order.type,
    title: order.title,
    category: order.category,
    status: order.status,
    createdAt: order.createdAt,
    tenantName: order.tenantName,
    tenantPhone: order.tenantPhone,
    tenantAddress: order.tenantAddress,
    apartmentUnit: order.apartmentUnit,
    providerId: order.providerId,
    driverId: order.driverId,
    storeId: order.storeId,
    providerName: order.provider?.name,
    providerAvatar: order.provider?.avatar,
    providerPhone: order.provider?.phone,
    driverName: order.driver?.name,
    driverAvatar: order.driver?.avatar,
    driverVehicle: order.driver?.vehicleType,
    driverPhone: order.driver?.phone,
    storeName: order.store?.name,
    storeType: order.store?.type,
    items: decoded.items,
    notes: decoded.notes ?? undefined,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    serviceFee: order.serviceFee,
    tax: order.tax,
    total: order.total,
    paymentMethod: order.paymentMethod,
    estimatedArrivalMin: order.estimatedArrivalMin,
    urgency: order.urgency,
    scheduledFor: order.scheduledFor,
    tenantLocation: {
      lat: order.tenantLat ?? 0,
      lng: order.tenantLng ?? 0,
      label: order.tenantAddress,
    },
    originLocation: {
      lat: order.originLat ?? 0,
      lng: order.originLng ?? 0,
      label: order.store?.name || order.provider?.name || 'Origin',
    },
    currentLocation: {
      lat: order.currentLat ?? order.originLat ?? 0,
      lng: order.currentLng ?? order.originLng ?? 0,
    },
    messages: [] as {
      id: string;
      sender: string;
      senderName: string;
      text: string;
      timestamp: string;
    }[],
  };
}

export function mapDriver(driver: Driver) {
  return {
    id: driver.id,
    name: driver.name,
    avatar: driver.avatar ?? '',
    vehicleType: driver.vehicleType,
    vehiclePlate: driver.vehiclePlate,
    rating: driver.rating,
    completedDeliveries: driver.completedDeliveries,
    phone: driver.phone,
    currentLat: driver.currentLat,
    currentLng: driver.currentLng,
    isOnline: driver.isOnline,
    createdAt: driver.createdAt,
  };
}

export function mapPublicUser(user: Profile) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    role: user.role,
    createdAt: user.createdAt,
    suspendedAt: user.suspendedAt,
  };
}

export function mapPro(pro: VerifiedPro) {
  return {
    id: pro.id,
    name: pro.name,
    avatar: pro.avatar ?? '',
    category: pro.category,
    title: pro.title,
    rating: pro.rating,
    reviewCount: pro.reviewCount,
    hourlyRate: pro.hourlyRate,
    isVerified: pro.isVerified,
    licenseNumber: pro.licenseNumber ?? '',
    yearsExperience: pro.yearsExperience,
    distanceMiles: pro.distanceMiles,
    responseTimeMin: pro.responseTimeMin,
    specialties: pro.specialties,
    badges: pro.badges,
    phone: pro.phone,
    completedJobs: pro.completedJobs,
    bio: pro.bio ?? '',
    location: { lat: pro.lat, lng: pro.lng, address: pro.address },
  };
}
