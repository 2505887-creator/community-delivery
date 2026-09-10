import { prisma } from './lib/prisma';
import express, { Response } from 'express';
import {
  requireAuth,
  optionalAuth,
  AuthedRequest,
  supabaseAdmin,
} from './lib/supabaseAdmin';
import { cleanString, finiteNumber, validCoordinate, SERVICE_CATEGORIES } from './lib/validation';

const router = express.Router();

function serializePro(pro: any) {
  return {
    id: pro.id,
    userId: pro.userId ?? undefined,

    name: pro.name,

    avatar:
      pro.avatar ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',

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

    specialties: Array.isArray(pro.specialties)
      ? pro.specialties
      : [],

    badges: Array.isArray(pro.badges)
      ? pro.badges
      : [],

    phone: pro.phone || '',

    completedJobs: Number(pro.completedJobs || 0),

    bio: pro.bio || '',

    location: {
      lat: Number(pro.lat || 0),
      lng: Number(pro.lng || 0),
      address: pro.address || 'Nairobi, Kenya',
    },
  };
}

/**
 * GET /api/services
 *
 * Public list of verified service providers.
 */
router.get(
  '/',
  optionalAuth(),
  async (req: AuthedRequest, res: Response) => {
    try {
      // Customers only see verified providers. A provider also receives their
      // own listing so the dashboard can edit it even while verification is pending.
      const actor = req.user;
      const where: any = actor?.role === 'provider'? {
        OR: [
          { isVerified: true },
          { userId: actor.id },
        ],
      }
    : {};
      const pros = await prisma.verifiedPro.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        success: true,
        data: pros.map(serializePro),
      });
    } catch (error) {
      console.error('List services error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to load services',
      });
    }
  }
);

/**
 * GET /api/services/mine
 *
 * Provider's own service listing.
 */
router.get(
  '/mine',
  requireAuth(['provider']),
  async (req: AuthedRequest, res: Response) => {
    try {
      const mine = await prisma.verifiedPro.findUnique({
        where: {
          userId: req.user!.id,
        },
      });

      return res.json({
        success: true,
        data: mine ? serializePro(mine) : null,
      });
    } catch (error) {
      console.error('Get own service error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to load your service listing',
      });
    }
  }
);

/**
 * POST /api/services/ensure
 *
 * Creates a minimal provider workspace record after the provider has
 * confirmed their Supabase email and signed in. This makes the auth flow
 * deterministic even when the provider used the generic registration modal.
 * The provider can complete/edit the listing later with PATCH /:id.
 */
router.post(
  '/ensure',
  requireAuth(['provider']),
  async (req: AuthedRequest, res: Response) => {
    try {
      const user = req.user!;
      const { data: authUserResult } = await supabaseAdmin.auth.admin.getUserById(user.id);
      const metadata = authUserResult.user?.user_metadata ?? {};
      const existing = await prisma.verifiedPro.findUnique({
        where: { userId: user.id },
      });

      if (existing) {
        return res.json({ success: true, data: serializePro(existing), created: false });
      }

      const created = await prisma.verifiedPro.create({
        data: {
          userId: user.id,
          name: user.name?.trim() || user.email.split('@')[0] || 'Provider',
          category: ['plumbing','electrical','cleaning','carpentry','appliances'].includes(String(metadata.category)) ? String(metadata.category) as any : 'plumbing',
          title: metadata.title ? String(metadata.title) : 'Local service professional',
          hourlyRate: 0,
          isVerified: false,
          isOnline: false,
          licenseNumber: metadata.licenseNumber ? String(metadata.licenseNumber) : null,
          yearsExperience: 0,
          distanceMiles: 0,
          responseTimeMin: 30,
          specialties: [],
          badges: [],
          phone: metadata.phone ? String(metadata.phone) : '',
          completedJobs: 0,
          bio: metadata.vehicle ? `Equipment / vehicle: ${String(metadata.vehicle)}` : 'Complete your provider profile to start receiving jobs.',
          lat: -1.2864,
          lng: 36.8172,
          address: 'Nairobi, Kenya',
        },
      });

      return res.status(201).json({ success: true, data: serializePro(created), created: true });
    } catch (error) {
      console.error('Ensure provider service error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize your provider workspace',
      });
    }
  }
);

/**
 * POST /api/services
 *
 * Provider creates their service listing.
 */
router.post(
  '/',
  requireAuth(['provider']),
  async (req: AuthedRequest, res: Response) => {
    try {
      const existing = await prisma.verifiedPro.findUnique({
        where: {
          userId: req.user!.id,
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error:
            'You already have a service listing. Use PATCH to update it.',
        });
      }

      const body = req.body ?? {};

      const name = cleanString(body.name, 120);
      const title = cleanString(body.title, 160);
      const phone = cleanString(body.phone, 30);
      const address = cleanString(body.address, 300);
      const category = cleanString(body.category, 40);
      const hourlyRate = finiteNumber(body.hourlyRate);
      const lat = validCoordinate(body.lat, -90, 90);
      const lng = validCoordinate(body.lng, -180, 180);
      const yearsExperience = finiteNumber(body.yearsExperience ?? 0);
      const responseTimeMin = finiteNumber(body.responseTimeMin ?? 30);

      if (name === null || title === null || phone === null || address === null || category === null ||
          hourlyRate === null || lat === null || lng === null || yearsExperience === null || responseTimeMin === null ||
          yearsExperience < 0 || yearsExperience > 80 || responseTimeMin < 1 || responseTimeMin > 10080 ||
          !SERVICE_CATEGORIES.includes(category as any)) {
        return res.status(400).json({ success: false, error: 'Invalid provider profile fields' });
      }

      const requiredFields = [
        'name',
        'category',
        'title',
        'hourlyRate',
        'phone',
        'lat',
        'lng',
        'address',
      ];

      const missingFields = requiredFields.filter(
        (field) =>
          body[field] === undefined ||
          body[field] === null ||
          body[field] === ''
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
      }

      const created = await prisma.verifiedPro.create({
        data: {
          userId: req.user!.id,

          name,
          avatar: body.avatar ?? null,

          category: category as any,
          title,

          rating: 0,
          reviewCount: 0,

          hourlyRate,

          isVerified: false,

          licenseNumber: body.licenseNumber ?? null,
          yearsExperience,

          distanceMiles: 0,

          responseTimeMin,

          specialties: Array.isArray(body.specialties)
            ? body.specialties
            : [],

          badges: [],

          phone,

          completedJobs: 0,

          bio: body.bio ?? null,

          lat,
          lng,

          address,
        },
      });

      return res.status(201).json({
        success: true,
        data: serializePro(created),
      });
    } catch (error) {
      console.error('Create service error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to create service listing',
      });
    }
  }
);

/**
 * PATCH /api/services/:id
 *
 * Provider can update only their own listing.
 * Admin can update any listing.
 */
router.patch(
  '/:id',
  requireAuth(['provider', 'admin']),
  async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const target = await prisma.verifiedPro.findUnique({
        where: {
          id,
        },
      });

      if (!target) {
        return res.status(404).json({
          success: false,
          error: 'Service listing not found',
        });
      }

      if (
        req.user!.role !== 'admin' &&
        target.userId !== req.user!.id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'You can only edit your own service listing',
        });
      }

      const editableFields = [
        'name',
        'avatar',
        'title',
        'hourlyRate',
        'isOnline',
        'licenseNumber',
        'yearsExperience',
        'responseTimeMin',
        'specialties',
        'badges',
        'phone',
        'bio',
        'lat',
        'lng',
        'address',
      ] as const;

      const data: Record<string, unknown> = {};

      for (const field of editableFields) {
        if (req.body?.[field] !== undefined) {
          data[field] = req.body[field];
        }
      }

      if (data.hourlyRate !== undefined) {
        data.hourlyRate = Number(data.hourlyRate);
      }

      if (data.yearsExperience !== undefined) {
        data.yearsExperience = Number(
          data.yearsExperience
        );
      }

      if (data.responseTimeMin !== undefined) {
        data.responseTimeMin = Number(
          data.responseTimeMin
        );
      }

      if (data.lat !== undefined) {
        data.lat = Number(data.lat);
      }

      if (data.lng !== undefined) {
        data.lng = Number(data.lng);
      }

      const updated = await prisma.verifiedPro.update({
        where: {
          id,
        },
        data,
      });

      return res.json({
        success: true,
        data: serializePro(updated),
      });
    } catch (error) {
      console.error('Update service error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to update service listing',
      });
    }
  }
);

export default router;
