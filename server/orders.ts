import express, { Request, Response } from 'express';
import { PrismaClient, OrderStatus, OrderType } from '@prisma/client';
import { requireAuth, AuthedRequest } from './lib/supabaseAdmin';

const prisma = new PrismaClient();
const router = express.Router();

const statusSequence: OrderStatus[] = ['pending', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed'];
const allowedStatuses = new Set<OrderStatus>([...statusSequence, 'cancelled']);

function serializeOrder(order: any) {
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
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    serviceFee: Number(order.serviceFee),
    tax: Number(order.tax),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    estimatedArrivalMin: order.estimatedArrivalMin,
    urgency: order.urgency,
    scheduledFor: order.scheduledFor?.toISOString?.(),
    notes: order.notes ?? undefined,
    tenantLocation: { lat: order.tenantLat ?? 0, lng: order.tenantLng ?? 0, label: order.tenantAddress },
    originLocation: { lat: order.originLat ?? 0, lng: order.originLng ?? 0, label: order.provider?.address ?? order.store?.address ?? 'Nairobi, Kenya' },
    currentLocation: { lat: order.currentLat ?? order.originLat ?? 0, lng: order.currentLng ?? order.originLng ?? 0 },
    messages: (order.messages ?? []).map((m: any) => ({
      id: m.id, sender: m.sender, senderName: m.senderName, text: m.text, timestamp: m.createdAt?.toISOString?.() ?? m.createdAt,
    })),
  };
}

async function includeForOrder() {
  return {
    provider: true,
    driver: true,
    store: true,
    messages: { orderBy: { createdAt: 'asc' as const } },
  };
}

router.get('/', requireAuth(), async (req: AuthedRequest, res: Response) => {
  try {
    const actor = req.user!;
    const where: any = {};

    if (actor.role === 'provider') {
      const pro = await prisma.verifiedPro.findUnique({ where: { userId: actor.id } });
      if (!pro) return res.json({ success: true, data: [] });
      where.OR = [
        { providerId: pro.id },
        { status: 'pending', type: 'service', OR: [{ category: pro.category }, { category: null }] },
      ];
    } else if (actor.role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { userId: actor.id } });
      if (!driver) return res.json({ success: true, data: [] });
      where.driverId = driver.id;
    } else if (actor.role !== 'admin') {
      where.tenantUserId = actor.id;
    }

    const orders = await prisma.order.findMany({
      where,
      include: await includeForOrder(),
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
    if (!['service', 'store_delivery', 'ride_cargo'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid order type' });
    }
    if (!body.title || !body.tenantAddress || !body.tenantPhone) {
      return res.status(400).json({ success: false, error: 'Title, phone and delivery/service address are required' });
    }

    let providerId = body.providerId || null;
    if (type === 'service' && providerId) {
      const provider = await prisma.verifiedPro.findUnique({ where: { id: providerId } });
      if (!provider) return res.status(400).json({ success: false, error: 'Provider not found' });
    }

    const created = await prisma.order.create({
      data: {
        type,
        title: String(body.title).slice(0, 160),
        category: body.category ? String(body.category) : null,
        status: providerId || body.driverId ? 'assigned' : 'pending',
        tenantUserId: actor.role === 'tenant' ? actor.id : (body.tenantUserId || null),
        tenantName: String(body.tenantName || actor.name || 'Customer'),
        tenantPhone: String(body.tenantPhone),
        tenantAddress: String(body.tenantAddress),
        apartmentUnit: body.apartmentUnit || null,
        providerId,
        driverId: body.driverId || null,
        storeId: body.storeId || null,
        subtotal: Number(body.subtotal ?? body.total ?? 0),
        deliveryFee: Number(body.deliveryFee ?? 0),
        serviceFee: Number(body.serviceFee ?? 0),
        tax: Number(body.tax ?? 0),
        total: Number(body.total ?? 0),
        paymentMethod: String(body.paymentMethod || 'cash'),
        estimatedArrivalMin: Number(body.estimatedArrivalMin ?? 30),
        urgency: String(body.urgency || 'normal'),
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        notes: body.notes ? String(body.notes) : null,
        tenantLat: Number.isFinite(Number(body.tenantLat)) ? Number(body.tenantLat) : null,
        tenantLng: Number.isFinite(Number(body.tenantLng)) ? Number(body.tenantLng) : null,
        originLat: Number.isFinite(Number(body.originLat)) ? Number(body.originLat) : null,
        originLng: Number.isFinite(Number(body.originLng)) ? Number(body.originLng) : null,
        currentLat: Number.isFinite(Number(body.currentLat)) ? Number(body.currentLat) : null,
        currentLng: Number.isFinite(Number(body.currentLng)) ? Number(body.currentLng) : null,
      },
      include: await includeForOrder(),
    });

    await prisma.orderEvent.create({ data: { orderId: created.id, type: 'created', payload: { actorId: actor.id } } });
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
    const { proId, driverId } = req.body ?? {};
    if (!proId) return res.status(400).json({ success: false, error: 'proId is required' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (actor.role === 'provider') {
      const own = await prisma.verifiedPro.findUnique({ where: { userId: actor.id } });
      if (!own || own.id !== proId) return res.status(403).json({ success: false, error: 'You can only assign work to your own provider profile' });
    }
    if (order.status !== 'pending') return res.status(409).json({ success: false, error: `Order is already ${order.status}` });
    const updated = await prisma.order.update({ where: { id: orderId }, data: { providerId: proId, driverId: driverId || null, status: 'assigned' }, include: await includeForOrder() });
    await prisma.orderAssignment.create({ data: { orderId, proId, driverId: driverId || null, assignedBy: actor.id } });
    await prisma.orderEvent.create({ data: { orderId, type: 'assigned', payload: { proId, driverId: driverId || null, actorId: actor.id } } });
    return res.json({ success: true, data: serializeOrder(updated) });
  } catch (error) {
    console.error('Assign order error:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign order' });
  }
});

router.patch('/:orderId/status', requireAuth(['provider', 'driver', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const actor = req.user!;
    const { orderId } = req.params;
    const status = req.body?.status as OrderStatus;
    if (!allowedStatuses.has(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (actor.role === 'provider') {
      const own = await prisma.verifiedPro.findUnique({ where: { userId: actor.id } });
      if (!own || order.providerId !== own.id) return res.status(403).json({ success: false, error: 'You are not assigned to this order' });
    }
    if (actor.role === 'driver') {
      const own = await prisma.driver.findUnique({ where: { userId: actor.id } });
      if (!own || order.driverId !== own.id) return res.status(403).json({ success: false, error: 'You are not assigned to this order' });
    }

    const currentIndex = statusSequence.indexOf(order.status);
    const nextIndex = statusSequence.indexOf(status);
    if (status !== 'cancelled' && currentIndex >= 0 && nextIndex < currentIndex) {
      return res.status(409).json({ success: false, error: 'Order status cannot move backwards' });
    }

    const updated = await prisma.order.update({ where: { id: orderId }, data: { status }, include: await includeForOrder() });
    await prisma.orderEvent.create({ data: { orderId, type: 'status_change', payload: { from: order.status, to: status, actorId: actor.id } } });
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
      allowed = allowed || !!pro && order.providerId === pro.id;
    }
    if (actor.role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { userId: actor.id } });
      allowed = allowed || !!driver && order.driverId === driver.id;
    }
    if (!allowed) return res.status(403).json({ success: false, error: 'You cannot message this order' });

    const message = await prisma.orderMessage.create({
      data: { orderId, sender: actor.role, senderName: actor.name || actor.email, text: text.slice(0, 1000) },
    });
    return res.status(201).json({ success: true, data: { id: message.id, sender: message.sender, senderName: message.senderName, text: message.text, timestamp: message.createdAt.toISOString() } });
  } catch (error) {
    console.error('Message error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;
