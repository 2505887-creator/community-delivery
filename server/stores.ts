import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuth, AuthedRequest } from './lib/supabaseAdmin';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', optionalAuth(), async (_req: AuthedRequest, res: Response) => {
  try {
    const stores = await prisma.localStore.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
    return res.json({
      success: true,
      data: stores.map(store => ({
        id: store.id, name: store.name, type: store.type, logo: store.logo || '', coverImage: store.coverImage || '',
        rating: store.rating, reviewCount: store.reviewCount, distanceMiles: store.distanceMiles,
        deliveryEstimateMin: store.deliveryEstimateMin, deliveryFee: store.deliveryFee, minOrder: store.minOrder,
        address: store.address, isOpen: store.isOpen,
        items: store.items.map(item => ({ ...item, image: item.image || '', description: item.description || '' })),
      })),
    });
  } catch (error) {
    console.error('List stores error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load stores' });
  }
});

export default router;
