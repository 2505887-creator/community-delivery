require("dotenv").config();
require("dotenv").config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data (keep simple for demo)
  await prisma.order.deleteMany();
  await prisma.storeItem.deleteMany();
  await prisma.localStore.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.verifiedPro.deleteMany();

  // Create verified pros
  const pro1 = await prisma.verifiedPro.create({
    data: {
      name: 'Marco Rossi',
      avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a',
      category: 'plumbing',
      title: 'Master Licensed Plumber & Pipe Specialist',
      rating: 4.95,
      reviewCount: 342,
      hourlyRate: 65,
      isVerified: true,
      licenseNumber: 'MP-89241-NY',
      yearsExperience: 14,
      distanceMiles: 0.9,
      responseTimeMin: 15,
      specialties: ['Emergency Leak Repair', 'Drain Camera & Snaking'],
      badges: ['Background Checked', 'Licensed & Insured'],
      phone: '+1 (555) 234-8910',
      completedJobs: 1240,
      bio: 'Certified Master Plumber with over 14 years serving local residential complexes and apartment towers.',
      lat: 40.7135,
      lng: -74.0040,
      address: '74 Hudson St, New York, NY'
    }
  });

  const pro2 = await prisma.verifiedPro.create({
    data: {
      name: 'Elena Ramos',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      category: 'electrical',
      title: 'Certified Master Residential Electrician',
      rating: 4.98,
      reviewCount: 289,
      hourlyRate: 70,
      isVerified: true,
      licenseNumber: 'EL-40192-NY',
      yearsExperience: 12,
      distanceMiles: 1.3,
      responseTimeMin: 20,
      specialties: ['Circuit Breaker Diagnostics', 'Short Circuit & Wiring'],
      badges: ['OSHA Certified', 'Licensed Master Electrician'],
      phone: '+1 (555) 345-6789',
      completedJobs: 980,
      bio: 'Specialist in apartment electrical diagnostic, breaker panel upgrades, and energy efficiency.',
      lat: 40.7180,
      lng: -73.9980,
      address: '142 Grand St, New York, NY'
    }
  });

  // Create stores and items
  const store1 = await prisma.localStore.create({
    data: {
      name: 'GreenMarket Organics & Groceries',
      type: 'supermarket',
      logo: '',
      coverImage: '',
      rating: 4.88,
      reviewCount: 620,
      distanceMiles: 0.6,
      deliveryEstimateMin: 20,
      deliveryFee: 2.99,
      minOrder: 15,
      address: '185 Greenwich St, New York, NY',
      isOpen: true,
      items: {
        create: [
          {
            name: 'Organic Whole Milk (1 Gallon)',
            category: 'Dairy',
            price: 5.49,
            unit: '1 gal',
            inStock: true,
            description: 'Grade A USDA organic whole milk.'
          },
          {
            name: 'Artisan Sourdough Loaf',
            category: 'Bakery',
            price: 4.99,
            unit: '1 loaf',
            inStock: true,
            description: 'Freshly baked naturally fermented sourdough bread.'
          }
        ]
      }
    }
  });

  const store2 = await prisma.localStore.create({
    data: {
      name: 'CarePlus Community Pharmacy & Health',
      type: 'pharmacy',
      logo: '',
      coverImage: '',
      rating: 4.94,
      reviewCount: 480,
      distanceMiles: 0.5,
      deliveryEstimateMin: 15,
      deliveryFee: 1.99,
      minOrder: 10,
      address: '92 Chambers St, New York, NY',
      isOpen: true,
      items: {
        create: [
          {
            name: 'Extra Strength Pain & Headache Relief (100 Caplets)',
            category: 'Pain Relief',
            price: 9.49,
            unit: '100 count',
            inStock: true,
            description: 'Acetaminophen 500mg for rapid relief.'
          }
        ]
      }
    }
  });

  // Create drivers
  const driver1 = await prisma.driver.create({
    data: {
      name: 'Alex Rivera',
      avatar: '',
      vehicleType: 'Cargo Van',
      vehiclePlate: 'NY-TX4812',
      rating: 4.96,
      completedDeliveries: 1420,
      phone: '+1 (555) 890-1234',
      currentLat: 40.7145,
      currentLng: -74.0060,
      isOnline: true
    }
  });

  const driver2 = await prisma.driver.create({
    data: {
      name: 'Samira Khan',
      avatar: '',
      vehicleType: 'Motorbike / Scooter',
      vehiclePlate: 'NY-BK902',
      rating: 4.99,
      completedDeliveries: 980,
      phone: '+1 (555) 901-2345',
      currentLat: 40.7125,
      currentLng: -74.0020,
      isOnline: true
    }
  });

  // Create orders
  await prisma.order.create({
    data: {
      type: 'service',
      title: 'Emergency Kitchen Sink Drain & Trap Leak',
      category: 'plumbing',
      status: 'en_route',
      tenantName: 'Jordan Vance',
      tenantPhone: '+1 (555) 123-4567',
      tenantAddress: '72 Wall St, Apt 14C',
      apartmentUnit: 'Apt 14C, Tower East',
      providerId: pro1.id,
      providerId: pro1.id,
      subtotal: 65.0,
      deliveryFee: 0,
      serviceFee: 5.0,
      tax: 5.6,
      total: 75.6,
      paymentMethod: 'card',
      estimatedArrivalMin: 8,
      urgency: 'emergency',
      notes: 'Shut off valve is stiff. Please call when in lobby for elevator code.',
      tenantLat: 40.7065,
      tenantLng: -74.0090,
      originLat: pro1.lat,
      originLng: pro1.lng,
      currentLat: 40.7095,
      currentLng: -74.0070
    }
  });

  await prisma.order.create({
    data: {
      type: 'store_delivery',
      title: 'Pharmacy Urgent Relief Essentials',
      category: 'pharmacy',
      status: 'assigned',
      tenantName: 'Jordan Vance',
      tenantPhone: '+1 (555) 123-4567',
      tenantAddress: '72 Wall St, Apt 14C',
      apartmentUnit: 'Apt 14C',
      storeId: store2.id,
      driverId: driver2.id,
      subtotal: 20.78,
      deliveryFee: 1.99,
      serviceFee: 2.0,
      tax: 1.82,
      total: 26.59,
      paymentMethod: 'apple_pay',
      estimatedArrivalMin: 14,
      urgency: 'normal',
      notes: 'Please leave with concierge if unavailable.',
      tenantLat: 40.7065,
      tenantLng: -74.0090,
      originLat: store2.createdAt ? 40.7150 : 40.7150,
      originLng: store2.createdAt ? -74.0050 : -74.0050,
      currentLat: 40.7140,
      currentLng: -74.0055
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
