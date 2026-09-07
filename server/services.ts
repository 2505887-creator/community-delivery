import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, optionalAuth, AuthedRequest } from './lib/supabaseAdmin';

const prisma = new PrismaClient();
const router = express.Router();

function serializePro(pro: any) {
  return {
    id: pro.id,
    userId: pro.userId ?? undefined,
    name: pro.name,
    avatar: pro.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    category: pro.category,
    title: pro.title,
    rating: Number(pro.rating || 0),
    reviewCount: Number(pro.reviewCount || 0),
    hourlyRate: Number(pro.hourlyRate || 0),
    isVerified: Boolean(pro.isVerified),
    isOnline: Boolean(pro.isOnline),
    licenseNumber: pro.licenseNumber || '',
    yearsExperience: Number(pro.yearsExperience || 0),
    distanceMiles: Number(pro.distanceMiles || 0),
    responseTimeMin: Number(pro.responseTimeMin || 30),
    specialties: Array.isArray(pro.specialties) ? pro.specialties : [],
    badges: Array.isArray(pro.badges) ? pro.badges : [],
    phone: pro.phone || '',
    completedJobs: Number(pro.completedJobs || 0),
    bio: pro.bio || '',
    location: { lat: Number(pro.lat || 0), lng: Number(pro.lng || 0), address: pro.address || 'Nairobi, Kenya' },
  };
}

// --------------------------------------------------
// GET /api/services  -- public browse of all verified pros
// --------------------------------------------------
router.get('/', optionalAuth(), async (_req: AuthedRequest, res: Response) => {
  try {
    const pros = await prisma.verifiedPro.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: pros.map(serializePro) });
  } catch (err) {
    console.error('List services error:', err);
    res.status(500).json({ success: false, error: 'Failed to load services' });
  }
});

// --------------------------------------------------
// GET /api/services/mine  -- the signed-in provider's own listing
// --------------------------------------------------
router.get('/mine', requireAuth(['provider']), async (req: AuthedRequest, res: Response) => {
  try {
    const mine = await prisma.verifiedPro.findUnique({ where: { userId: req.user!.id } });
    res.json({ success: true, data: mine ? serializePro(mine) : null });
  } catch (err) {
    console.error('Get own service error:', err);
    res.status(500).json({ success: false, error: 'Failed to load your service listing' });
  }
});

// --------------------------------------------------
// POST /api/services  -- a provider creates their service listing
// --------------------------------------------------
//
// This is the "tenant context" the brief asks for: a provider can only ever
// create or edit the single VerifiedPro row tied to their own user_id.
// requireAuth(['provider']) enforces that at the API layer; the
// verified_pros_insert_own / verified_pros_update_own RLS policies in
// supabase/migrations/0001_auth_and_rbac.sql enforce the same thing at the
// database layer, so it holds even if this route had a bug.
// --------------------------------------------------
router.post('/', requireAuth(['provider']), async (req: AuthedRequest, res: Response) => {
  try {
    const existing = await prisma.verifiedPro.findUnique({ where: { userId: req.user!.id } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'You already have a service listing. Use PATCH to update it.' });
    }

    const body = req.body ?? {};
    const required = ['name', 'category', 'title', 'hourlyRate', 'phone', 'lat', 'lng', 'address'];
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length > 0) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    }

    const created = await prisma.verifiedPro.create({
      data: {
        userId: req.user!.id,
        name: body.name,
        avatar: body.avatar ?? null,
        category: body.category,
        title: body.title,
        rating: 0,
        reviewCount: 0,
        hourlyRate: Number(body.hourlyRate),
        isVerified: false,
        licenseNumber: body.licenseNumber ?? null,
        yearsExperience: Number(body.yearsExperience ?? 0),
        distanceMiles: 0,
        responseTimeMin: Number(body.responseTimeMin ?? 30),
        specialties: Array.isArray(body.specialties) ? body.specialties : [],
        badges: [],
        phone: body.phone,
        completedJobs: 0,
        bio: body.bio ?? null,
        lat: Number(body.lat),
        lng: Number(body.lng),
        address: body.address,
      },
    });

    res.status(201).json({ success: true, data: serializePro(created) });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ success: false, error: 'Failed to create service listing' });
  }
});

// --------------------------------------------------
// PATCH /api/services/:id  -- a provider updates their own listing only
// --------------------------------------------------
router.patch('/:id', requireAuth(['provider', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const target = await prisma.verifiedPro.findUnique({ where: { id } });

    if (!target) {
      return res.status(404).json({ success: false, error: 'Service listing not found' });
    }

    // Tenant isolation at the API layer: a provider may only touch their own
    // row, regardless of what id they pass. Admins may edit any row.
    if (req.user!.role !== 'admin' && target.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'You can only edit your own service listing' });
    }

    const editable = [
      'name', 'avatar', 'title', 'hourlyRate', 'isOnline', 'licenseNumber', 'yearsExperience',
      'responseTimeMin', 'specialties', 'badges', 'phone', 'bio', 'lat', 'lng', 'address',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of editable) {
      if (req.body?.[field] !== undefined) data[field] = req.body[field];
    }

    const updated = await prisma.verifiedPro.update({ where: { id }, data });
    res.json({ success: true, data: serializePro(updated) });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ success: false, error: 'Failed to update service listing' });
  }
});

export default router;
