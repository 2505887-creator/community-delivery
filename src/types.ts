export type UserRole = 'tenant' | 'provider' | 'driver' | 'merchant'|'admin';

export type ServiceCategory = 'plumbing' | 'electrical' | 'cleaning' | 'carpentry' | 'appliances';

export interface VerifiedPro {
  id: string;
  name: string;
  avatar: string;
  category: ServiceCategory;
  title: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  isVerified: boolean;
  isOnline?: boolean;
  licenseNumber: string;
  yearsExperience: number;
  distanceMiles: number;
  responseTimeMin: number;
  specialties: string[];
  badges: string[];
  phone: string;
  completedJobs: number;
  bio: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface StoreItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  description: string;
}

export interface LocalStore {
  id: string;
  name: string;
  type: 'supermarket' | 'pharmacy';
  logo: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  distanceMiles: number;
  deliveryEstimateMin: number;
  deliveryFee: number;
  minOrder: number;
  address: string;
  isOpen: boolean;
  items: StoreItem[];
}

export type OrderType = 'service' | 'store_delivery' | 'ride_cargo';

export type OrderStatus = 
  | 'pending'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface OrderMessage {
  id: string;
  sender: 'tenant' | 'provider' | 'driver' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  type: OrderType;
  title: string;
  category?: ServiceCategory | 'supermarket' | 'pharmacy' | 'transport';
  status: OrderStatus;
  createdAt: string;
  
  // Tenant details
  tenantName: string;
  tenantPhone: string;
  tenantAddress: string;
  apartmentUnit?: string;
  
  // Provider / Driver details
  providerId?: string;
  providerName?: string;
  providerAvatar?: string;
  providerPhone?: string;
  
  driverId?: string;
  driverName?: string;
  driverAvatar?: string;
  driverVehicle?: string;
  driverPhone?: string;
  
  // Store details if applicable
  storeId?: string;
  storeName?: string;
  storeType?: 'supermarket' | 'pharmacy';
  
  items?: OrderItem[];
  
  // Financials
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  total: number;
  paymentMethod: 'mpesa' | 'cash';
  paymentStatus?: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  paymentProvider?: string;
  paymentReference?: string;
  
  // Timings & Location coordinates
  estimatedArrivalMin: number;
  urgency: 'normal' | 'emergency';
  scheduledFor?: string;
  notes?: string;
  
  // Coordinates for real-time map tracking
  tenantLocation: { lat: number; lng: number; label: string };
  originLocation: { lat: number; lng: number; label: string };
  currentLocation: { lat: number; lng: number };
  
  messages: OrderMessage[];
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  vehicleType: 'Car' | 'Cargo Van' | 'Motorbike / Scooter' | 'Pickup Truck';
  vehiclePlate: string;
  rating: number;
  completedDeliveries: number;
  phone: string;
  currentLat: number;
  currentLng: number;
  isOnline: boolean;
}
