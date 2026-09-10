import express, { Response } from 'express';
import { requireHybridAuth } from './lib/hybridAuth';
import type { AuthedRequest } from './lib/supabaseAdmin';
import { prisma } from './lib/prisma';
import { mapPublicUser, mapStore, mapDriver, mapOrder } from './lib/mappers';

const router = express.Router();

router.get('/me', requireHybridAuth(), async (req: AuthedRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user!.id },
    });

    return res.json({
      success: true,
      data: {
        id: req.user!.id,
        email: req.user!.email,
        name: profile?.name || req.user!.name || req.user!.email,
        role: req.user!.role,
        createdAt: profile?.createdAt ?? null,
      },
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load profile' });
  }
});

router.get('/', requireHybridAuth(['admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    const role = String(req.query.role || '').trim();
    const users = await prisma.profile.findMany({
      where: {
        ...(role
          ? { role: role as 'tenant' | 'provider' | 'driver' | 'merchant' | 'admin' }
          : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.json({ success: true, data: users.map(mapPublicUser) });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

router.get('/stats', requireHybridAuth(['admin']), async (_req: AuthedRequest, res: Response) => {
  try {
    const [users, stores, drivers, orders] = await Promise.all([
      prisma.profile.count(),
      prisma.localStore.count(),
      prisma.driver.count(),
      prisma.order.count(),
    ]);
    return res.json({ success: true, data: { users, stores, drivers, orders } });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
});

router.get('/admin/stores', requireHybridAuth(['admin']), async (_req: AuthedRequest, res: Response) => {
  try {
    const stores = await prisma.localStore.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: stores.map(mapStore) });
  } catch (err) {
    console.error('Admin stores error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load stores' });
  }
});

router.get('/admin/orders', requireHybridAuth(['admin']), async (_req: AuthedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { driver: true, store: true, provider: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: orders.map(mapOrder) });
  } catch (err) {
    console.error('Admin orders error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load orders' });
  }
});

router.get('/admin/drivers', requireHybridAuth(['admin']), async (_req: AuthedRequest, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: drivers.map(mapDriver) });
  } catch (err) {
    console.error('Admin drivers error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load drivers' });
  }
});

export default router;
