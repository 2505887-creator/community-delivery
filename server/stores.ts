import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  optionalAuth,
  AuthedRequest,
} from './lib/supabaseAdmin';

const prisma = new PrismaClient();

const router = express.Router();

/**
 * GET /api/stores
 *
 * Public endpoint.
 * Authentication is optional.
 */
router.get(
  '/',
  optionalAuth(),
  async (_req: AuthedRequest, res: Response) => {
    try {
      const stores = await prisma.localStore.findMany({
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const data = stores.map((store) => ({
        id: store.id,
        name: store.name,
        type: store.type,
        logo: store.logo || '',
        coverImage: store.coverImage || '',
        rating: Number(store.rating || 0),
        reviewCount: Number(store.reviewCount || 0),
        distanceMiles: Number(store.distanceMiles || 0),
        deliveryEstimateMin: Number(
          store.deliveryEstimateMin || 0
        ),
        deliveryFee: Number(store.deliveryFee || 0),
        minOrder: Number(store.minOrder || 0),
        address: store.address || '',
        isOpen: Boolean(store.isOpen),

        items: store.items.map((item) => ({
          ...item,
          image: item.image || '',
          description: item.description || '',
        })),
      }));

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('List stores error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to load stores',
      });
    }
  }
);

export default router;