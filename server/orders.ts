import express, { Response } from 'express';
import { OrderStatus, OrderType } from '@prisma/client';
import { requireAuth } from './lib/supabaseAdmin';
import type { AuthedRequest } from './lib/supabaseAdmin';
import { prisma } from './lib/prisma';
import { createNotification } from './lib/notifications';
import {
  canTransition,
  decodeOrderNotes,
  encodeOrderNotes,
  type CheckoutItem,
} from './lib/orderRules';

const router = express.Router();

const ORDER_TYPES: OrderType[] = ['service', 'store_delivery', 'ride_cargo'];
const PAYMENT_METHODS = ['mpesa', 'cash'] as const;
const SERVICE_FEE = Number(process.env.ORDER_SERVICE_FEE || 150);
const TAX_RATE = Number(process.env.ORDER_TAX_RATE || 0);
const RIDE_FARES: Record<string, number> = {
  Car: Number(process.env.RIDE_FARE_CAR || 500),
  'Cargo Van': Number(process.env.RIDE_FARE_CARGO_VAN || 900),
  'Motorbike / Scooter': Number(process.env.RIDE_FARE_MOTORBIKE || 300),
};

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalCoordinate(value: unknown, min: number, max: number): number | null {
  const parsed = finiteNumber(value);
  if (parsed === null || parsed < min || parsed > max) return null;
  return parsed;
}

function serializeOrder(order: any) {
  const decoded = decodeOrderNotes(order.notes);

  return {
    id: order.id,
    type: order.type,
    title: order.title,
    category: order.category ?? undefined,
    status: order.status,
    createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
    tenantName: order.tenantName,
    tenantPhone: order.tenantPhone,
    tenantAddress: order.tenantAddress,
    apartmentUnit: order.apartmentUnit ?? undefined,
    providerId: order.providerId ?? undefined,
    providerName: order.provider?.name,
    providerAvatar: order.provider?.avatar,
    providerPhone: order.provider?.phone,
    driverId: order.driverId ?? undefined,
    driverName: order.driver?.name,
    driverAvatar: order.driver?.avatar,
    driverVehicle: order.driver?.vehicleType,
    driverPhone: order.driver?.phone,
    storeId: order.storeId ?? undefined,
    storeName: order.store?.name,
    storeType: order.store?.type,
    items: decoded.items,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    serviceFee: Number(order.serviceFee),
    tax: Number(order.tax),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    estimatedArrivalMin: order.estimatedArrivalMin,
    urgency: order.urgency,
    scheduledFor: order.scheduledFor?.toISOString?.(),
    notes: decoded.notes ?? undefined,
    tenantLocation: {
      lat: order.tenantLat ?? 0,
      lng: order.tenantLng ?? 0,
      label: order.tenantAddress,
    },
    originLocation: {
      lat: order.originLat ?? 0,
      lng: order.originLng ?? 0,
      label: order.provider?.address ?? order.store?.address ?? 'Nairobi, Kenya',
    },
    currentLocation: {
      lat: order.currentLat ?? order.originLat ?? 0,
      lng: order.currentLng ?? order.originLng ?? 0,
    },
    paymentStatus: order.payment?.status ?? 'pending',
    paymentProvider: order.payment?.provider ?? undefined,
    paymentReference: order.payment?.providerReference ?? undefined,
    messages: (order.messages ?? []).map((m: any) => ({
      id: m.id,
      sender: m.sender,
      senderName: m.senderName,
      text: m.text,
      timestamp: m.createdAt?.toISOString?.() ?? m.createdAt,
    })),
  };
}

const orderInclude = {
  provider: true,
  driver: true,
  store: true,
  messages: { orderBy: { createdAt: 'asc' as const } },
  payment: true,
};

async function getOrderAccessWhere(actor: NonNullable<AuthedRequest['user']>) {
  if (actor.role === 'admin') return {};

  if (actor.role === 'tenant') {
    return { tenantUserId: actor.id };
  }

  if (actor.role === 'provider') {
    const pro = await prisma.verifiedPro.findUnique({ where: { userId: actor.id } });
    if (!pro) return { id: '__no_access__' };
    return {
      OR: [
        { providerId: pro.id },
        {
          status: 'pending' as OrderStatus,
          type: 'service' as OrderType,
          OR: [{ category: pro.category }, { category: null }],
        },
      ],
    };
  }

  if (actor.role === 'driver') {
    const driver = await prisma.driver.findUnique({ where: { userId: actor.id } });
    return driver ? { driverId: driver.id } : { id: '__no_access__' };
  }

  if (actor.role === 'merchant') {
    const stores = await prisma.localStore.findMany({
      where: { ownerId: actor.id },
      select: { id: true },
    });
    return stores.length
      ? { storeId: { in: stores.map((store) => store.id) } }
      : { id: '__no_access__' };
  }

  return { id: '__no_access__' };
}

router.get('/', requireAuth(), async (req: AuthedRequest, res: Response) => {
  try {
    const where = await getOrderAccessWhere(req.user!);
    const orders = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: orders.map(serializeOrder) });
  } catch (error) {
    console.error('List orders error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load orders' });
  }
});

router.post('/', requireAuth(['tenant', 'provider', 'driver', 'merchant', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const actor = req.user!;
    const body = req.body ?? {};
    const type = body.type as OrderType;

    if (!ORDER_TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid order type' });
    }

    const title = String(body.title || '').trim();
    const tenantAddress = String(body.tenantAddress || '').trim();
    if (!title || !tenantAddress) {
      return res.status(400).json({ success: false, error: 'Title and delivery/service address are required' });
    }

    const paymentMethod = String(body.paymentMethod || 'cash');
    if (!PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    const urgency = body.urgency === 'emergency' ? 'emergency' : 'normal';
    const tenantProfile = await prisma.profile.findUnique({
      where: { id: actor.id },
      select: { name: true, phone: true },
    });

    let providerId: string | null = null;
    let driverId: string | null = null;
    let storeId: string | null = null;
    let subtotal = 0;
    let deliveryFee = 0;
    let serviceFee = 0;
    let tax = 0;
    let estimatedArrivalMin = 30;
    let encodedItems: CheckoutItem[] = [];
    let originLat: number | null = null;
    let originLng: number | null = null;

    if (type === 'service') {
      providerId = typeof body.providerId === 'string' ? body.providerId : null;
      if (!providerId) {
        return res.status(400).json({ success: false, error: 'A provider is required for a service order' });
      }

      const provider = await prisma.verifiedPro.findUnique({ where: { id: providerId } });
      if (!provider || !provider.isVerified) {
        return res.status(400).json({ success: false, error: 'Provider is unavailable or not verified' });
      }

      if (body.category && String(body.category) !== provider.category) {
        return res.status(400).json({ success: false, error: 'Provider category does not match the order' });
      }

      subtotal = roundMoney(provider.hourlyRate + (urgency === 'emergency' ? 20 : 0));
      serviceFee = SERVICE_FEE;
      tax = roundMoney(subtotal * TAX_RATE);
      estimatedArrivalMin = provider.responseTimeMin;
      originLat = provider.lat;
      originLng = provider.lng;
    }

    if (type === 'store_delivery') {
      storeId = typeof body.storeId === 'string' ? body.storeId : null;
      if (!storeId) {
        return res.status(400).json({ success: false, error: 'A store is required for a store delivery' });
      }

      const store = await prisma.localStore.findUnique({
        where: { id: storeId },
        include: { items: true },
      });
      if (!store || !store.isOpen) {
        return res.status(400).json({ success: false, error: 'Store is unavailable' });
      }

      if (actor.role === 'merchant' && store.ownerId !== actor.id) {
        return res.status(403).json({ success: false, error: 'You can only create orders for your own store' });
      }

      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length === 0 || rawItems.length > 50) {
        return res.status(400).json({ success: false, error: 'A store order must contain between 1 and 50 items' });
      }

      const requested = new Map<string, number>();
      for (const raw of rawItems) {
        const itemId = String(raw?.itemId || '').trim();
        const quantity = Number(raw?.quantity);
        if (!itemId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
          return res.status(400).json({ success: false, error: 'Invalid store item or quantity' });
        }
        requested.set(itemId, (requested.get(itemId) || 0) + quantity);
      }

      const itemById = new Map(store.items.map((item) => [item.id, item]));
      for (const [itemId, quantity] of requested) {
        const item = itemById.get(itemId);
        if (!item) {
          return res.status(400).json({ success: false, error: 'One or more items do not belong to this store' });
        }
        if (!item.inStock || item.stockQuantity < quantity) {
          return res.status(409).json({ success: false, error: `${item.name} does not have enough stock` });
        }
        subtotal += item.price * quantity;
      }

      subtotal = roundMoney(subtotal);
      if (subtotal < store.minOrder) {
        return res.status(400).json({ success: false, error: `Minimum order is ${store.minOrder}` });
      }

      deliveryFee = roundMoney(store.deliveryFee);
      serviceFee = SERVICE_FEE;
      tax = roundMoney(subtotal * TAX_RATE);
      estimatedArrivalMin = store.deliveryEstimateMin;
      originLat = null;
      originLng = null;
      encodedItems = [...requested.entries()].map(([itemId, quantity]) => ({ itemId, quantity }));
    }

    if (type === 'ride_cargo') {
      driverId = typeof body.driverId === 'string' ? body.driverId : null;
      if (!driverId) {
        return res.status(400).json({ success: false, error: 'A driver is required for a ride/cargo order' });
      }

      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (!driver || !driver.verified) {
        return res.status(400).json({ success: false, error: 'Driver is unavailable or not verified' });
      }

      subtotal = RIDE_FARES[driver.vehicleType] ?? RIDE_FARES.Car;
      deliveryFee = 0;
      serviceFee = Number(process.env.RIDE_SERVICE_FEE || 100);
      tax = roundMoney(subtotal * TAX_RATE);
      estimatedArrivalMin = 10;
      originLat = driver.currentLat;
      originLng = driver.currentLng;
    }

    const total = roundMoney(subtotal + deliveryFee + serviceFee + tax);
    const scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid scheduled time' });
    }

    const tenantUserId = actor.role === 'tenant' ? actor.id : null;
    const tenantName = tenantProfile?.name || actor.name || actor.email.split('@')[0] || 'Customer';
    const tenantPhone = tenantProfile?.phone || 'Not provided';
    const tenantLat = optionalCoordinate(body.tenantLat, -90, 90);
    const tenantLng = optionalCoordinate(body.tenantLng, -180, 180);

    const notes = String(body.notes || '').trim().slice(0, 4000) || undefined;
    const persistedNotes = encodeOrderNotes(notes, encodedItems);

    const created = await prisma.$transaction(async (tx) => {
      if (type === 'store_delivery' && storeId) {
        for (const item of encodedItems) {
          const result = await tx.storeItem.updateMany({
            where: { id: item.itemId, storeId, inStock: true, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (result.count !== 1) throw new Error(`INSUFFICIENT_STOCK:${item.itemId}`);
        }
      }

      const order = await tx.order.create({
        data: {
          type,
          title: title.slice(0, 160),
          category: body.category ? String(body.category).slice(0, 60) : type === 'ride_cargo' ? 'transport' : null,
          status: providerId || driverId ? 'assigned' : 'pending',
          tenantUserId,
          tenantName: tenantName.slice(0, 120),
          tenantPhone: tenantPhone.slice(0, 40),
          tenantAddress: tenantAddress.slice(0, 500),
          apartmentUnit: body.apartmentUnit ? String(body.apartmentUnit).slice(0, 80) : null,
          providerId,
          driverId,
          storeId,
          subtotal,
          deliveryFee,
          serviceFee,
          tax,
          total,
          paymentMethod,
          estimatedArrivalMin,
          urgency,
          scheduledFor,
          notes: persistedNotes,
          tenantLat,
          tenantLng,
          originLat,
          originLng,
          currentLat: originLat,
          currentLng: originLng,
        },
        include: orderInclude,
      });

      await tx.payment.create({
        data: {
          orderId: order.id, status: 'pending', method: paymentMethod, amount: total, currency: 'KES',
          provider: paymentMethod === 'mpesa' ? 'safaricom' : null,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id, type: 'created',
          payload: { actorId: actor.id, serverCalculatedTotal: total, paymentStatus: 'pending' },
        },
      });

      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    });

    if (created.tenantUserId) {
      await createNotification({
        userId: created.tenantUserId,
        type: 'order.created',
        title: 'Order created',
        message: `${created.title} has been created.`,
        data: { orderId: created.id },
      });
    }

    if (created.provider?.userId) {
      await createNotification({
        userId: created.provider.userId,
        type: 'order.assigned',
        title: 'New service request',
        message: `${created.title} is assigned to you.`,
        data: { orderId: created.id },
      });
    }

    return res.status(201).json({ success: true, data: serializeOrder(created) });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

router.patch('/:orderId/assign', requireAuth(['provider', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const actor = req.user!;
    const { orderId } = req.params;
    const proId = typeof req.body?.proId === 'string' ? req.body.proId : '';
    const requestedDriverId = typeof req.body?.driverId === 'string' ? req.body.driverId : null;

    if (!proId) {
      return res.status(400).json({ success: false, error: 'proId is required' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(409).json({ success: false, error: `Order is already ${order.status}` });
    }

    const provider = await prisma.verifiedPro.findUnique({ where: { id: proId } });
    if (!provider || !provider.isVerified) {
      return res.status(400).json({ success: false, error: 'Provider is unavailable or not verified' });
    }

    if (actor.role === 'provider' && provider.userId !== actor.id) {
      return res.status(403).json({ success: false, error: 'You can only assign work to your own provider profile' });
    }

    let driverId: string | null = null;
    if (requestedDriverId) {
      const driver = await prisma.driver.findUnique({ where: { id: requestedDriverId } });
      if (!driver || !driver.verified) {
        return res.status(400).json({ success: false, error: 'Driver is unavailable or not verified' });
      }
      driverId = driver.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: { providerId: provider.id, driverId, status: 'assigned' },
        include: orderInclude,
      });

      await tx.orderAssignment.create({
        data: {
          orderId,
          proId: provider.id,
          driverId,
          assignedBy: actor.id,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          type: 'assigned',
          payload: { proId: provider.id, driverId, actorId: actor.id },
        },
      });

      return next;
    });

    if (order.tenantUserId) {
      await createNotification({
        userId: order.tenantUserId,
        type: 'order.assigned',
        title: 'Provider assigned',
        message: `${provider.name} accepted your request.`,
        data: { orderId },
      });
    }

    if (provider.userId) {
      await createNotification({
        userId: provider.userId,
        type: 'order.assigned',
        title: 'Job assigned',
        message: `${order.title} is now assigned to you.`,
        data: { orderId },
      });
    }

    return res.json({ success: true, data: serializeOrder(updated) });
  } catch (error) {
    console.error('Assign order error:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign order' });
  }
});

router.patch('/:orderId/status', requireAuth(['tenant', 'provider', 'driver', 'merchant', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const actor = req.user!;
    const { orderId } = req.params;
    const status = req.body?.status as OrderStatus;

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (actor.role === 'provider') {
      const own = await prisma.verifiedPro.findUnique({ where: { userId: actor.id } });
      if (!own || order.providerId !== own.id) {
        return res.status(403).json({ success: false, error: 'You are not assigned to this order' });
      }
    }

    if (actor.role === 'driver') {
      const own = await prisma.driver.findUnique({ where: { userId: actor.id } });
      if (!own || order.driverId !== own.id) {
        return res.status(403).json({ success: false, error: 'You are not assigned to this order' });
      }
    }

    if (!canTransition(order.status, status, actor.role === 'admin')) {
      return res.status(409).json({
        success: false,
        error: `Cannot transition order from ${order.status} to ${status}`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (status === 'cancelled' && order.type === 'store_delivery' && order.storeId) {
        const decoded = decodeOrderNotes(order.notes);
        for (const item of decoded.items) {
          await tx.storeItem.updateMany({ where: { id: item.itemId, storeId: order.storeId }, data: { stockQuantity: { increment: item.quantity }, inStock: true } });
        }
      }
      const next = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: orderInclude,
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          type: 'status_change',
          payload: { from: order.status, to: status, actorId: actor.id },
        },
      });

      return next;
    });

    if (order.tenantUserId) {
      await createNotification({
        userId: order.tenantUserId,
        type: 'order.status',
        title: 'Order status updated',
        message: `${order.title}: ${status.replaceAll('_', ' ')}.`,
        data: { orderId, status },
      });
    }

    return res.json({ success: true, data: serializeOrder(updated) });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

router.post('/:orderId/messages', requireAuth(), async (req: AuthedRequest, res: Response) => {
  try {
    const actor = req.user!;
    const { orderId } = req.params;
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ success: false, error: 'Message cannot be empty' });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    let allowed = actor.role === 'admin' || order.tenantUserId === actor.id;
    if (actor.role === 'provider') {
      const pro = await prisma.verifiedPro.findUnique({ where: { userId: actor.id } });
      allowed = allowed || (!!pro && order.providerId === pro.id);
    }
    if (actor.role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { userId: actor.id } });
      allowed = allowed || (!!driver && order.driverId === driver.id);
    }
    if (actor.role === 'merchant') {
      const store = order.storeId
        ? await prisma.localStore.findFirst({ where: { id: order.storeId, ownerId: actor.id } })
        : null;
      allowed = allowed || !!store;
    }

    if (!allowed) {
      return res.status(403).json({ success: false, error: 'You cannot message this order' });
    }

    const message = await prisma.orderMessage.create({
      data: {
        orderId,
        sender: actor.role,
        senderName: actor.name || actor.email,
        text: text.slice(0, 1000),
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: message.id,
        sender: message.sender,
        senderName: message.senderName,
        text: message.text,
        timestamp: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Message error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;
