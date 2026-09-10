import { prisma } from './lib/prisma';
import express, { Response } from 'express';
import {
  optionalAuth,
  requireAuth,
  AuthedRequest,
} from './lib/supabaseAdmin';



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
          items: {
            where: { inStock: true },
            orderBy: { name: 'asc' },
          },
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
          id: item.id,
          storeId: item.storeId,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          unit: item.unit,
          image: item.image || '',
          description: item.description || '',
          stockQuantity: Number(item.stockQuantity || 0),
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



router.post('/items', requireAuth(['merchant', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const storeId = String(req.body?.storeId || '').trim();
    const name = String(req.body?.name || '').trim();
    const category = String(req.body?.category || '').trim();
    const unit = String(req.body?.unit || 'item').trim();
    const price = Number(req.body?.price);
    const stockQuantity = Number(req.body?.stockQuantity);
    if (!storeId || !name || !category || !Number.isFinite(price) || price < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return res.status(400).json({ success: false, error: 'storeId, name, category, non-negative price and integer stockQuantity are required' });
    }
    const store = await prisma.localStore.findUnique({ where: { id: storeId }, select: { ownerId: true } });
    if (!store || (req.user!.role !== 'admin' && store.ownerId !== req.user!.id)) return res.status(403).json({ success: false, error: 'You do not own this store' });
    const item = await prisma.storeItem.create({ data: { storeId, name: name.slice(0, 160), category: category.slice(0, 80), unit: unit.slice(0, 40), price, stockQuantity, inStock: stockQuantity > 0, image: req.body?.image ? String(req.body.image).slice(0, 1000) : null, description: req.body?.description ? String(req.body.description).slice(0, 1000) : null } });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create store item error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create store item' });
  }
});

router.patch('/items/:itemId', requireAuth(['merchant', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const item = await prisma.storeItem.findUnique({ where: { id: req.params.itemId }, include: { store: { select: { ownerId: true } } } });
    if (!item || (req.user!.role !== 'admin' && item.store.ownerId !== req.user!.id)) return res.status(404).json({ success: false, error: 'Store item not found' });
    const data: any = {};
    if (req.body?.name !== undefined) data.name = String(req.body.name).trim().slice(0, 160);
    if (req.body?.category !== undefined) data.category = String(req.body.category).trim().slice(0, 80);
    if (req.body?.unit !== undefined) data.unit = String(req.body.unit).trim().slice(0, 40);
    if (req.body?.price !== undefined) { const price = Number(req.body.price); if (!Number.isFinite(price) || price < 0) return res.status(400).json({ success: false, error: 'Invalid price' }); data.price = price; }
    if (req.body?.stockQuantity !== undefined) { const qty = Number(req.body.stockQuantity); if (!Number.isInteger(qty) || qty < 0) return res.status(400).json({ success: false, error: 'Invalid stockQuantity' }); data.stockQuantity = qty; data.inStock = qty > 0; }
    if (req.body?.image !== undefined) data.image = req.body.image ? String(req.body.image).slice(0, 1000) : null;
    if (req.body?.description !== undefined) data.description = req.body.description ? String(req.body.description).slice(0, 1000) : null;
    const updated = await prisma.storeItem.update({ where: { id: item.id }, data });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update store item error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update store item' });
  }
});

export default router;