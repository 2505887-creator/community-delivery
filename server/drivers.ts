import { prisma } from './lib/prisma';
import express, { Response } from 'express';
import multer from 'multer';
import { uploadBufferToS3 } from './uploads';
import { normalizeKenyaPhone } from '../src/utils/phone-server';
import { requireAuth, optionalAuth, AuthedRequest } from './lib/supabaseAdmin';



const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

// Auth is centralised in server/lib/supabaseAdmin.ts -- requireAuth(['admin'])
// below replaces this file's old hand-rolled JWT `adminOnly` middleware, and
// optionalAuth() replaces the old cookie/JWT-based one. Both now verify a
// real Supabase session instead of a locally-signed JWT.
type DriverAuthRequest = AuthedRequest;

// --------------------------------------------------
// DRIVER APPLICATION
// --------------------------------------------------

router.post(
  '/apply',
  requireAuth(['driver']),
  upload.fields([
    {
      name: 'idDocument',
      maxCount: 1,
    },
    {
      name: 'vehicleDoc',
      maxCount: 1,
    },
  ]),
  async (req: DriverAuthRequest, res: Response) => {
    try {
      const body = req.body;

      const name = String(body.name || '').trim();
      const rawPhone = String(body.phone || '').trim();
      const idNumber = String(body.idNumber || '').trim();
      const vehicleReg = String(body.vehicleReg || '').trim();
      const vehicleType = String(body.vehicleType || '').trim();

      if (name.length > 120 || idNumber.length > 80 || vehicleReg.length > 40 || vehicleType.length > 60) {
        return res.status(400).json({ success: false, error: 'One or more fields are too long' });
      }

      const payoutMethod = String(body.payoutMethod || 'mpesa').trim().toLowerCase();
      if (!['mpesa', 'bank'].includes(payoutMethod)) {
        return res.status(400).json({ success: false, error: 'Invalid payout method' });
      }

      if (!name || !rawPhone || !idNumber || !vehicleReg) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // ------------------------------------------------
      // PHONE VALIDATION
      // ------------------------------------------------

      const phone = normalizeKenyaPhone(rawPhone);

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Kenyan phone number',
        });
      }

      // ------------------------------------------------
      // PAYOUT INFO
      // ------------------------------------------------

      let payoutInfo: any = undefined;

      if (body.payoutInfo) {
        try {
          payoutInfo = JSON.parse(body.payoutInfo);
        } catch {
          payoutInfo = {
            value: String(body.payoutInfo),
          };
        }
      }

      // ------------------------------------------------
      // USER ID
      // ------------------------------------------------

      // requireAuth(['driver']) guarantees req.user is set here.
      const userId = req.user!.id;

      // Don't let the same account submit a second application.
      const existingDriver = await prisma.driver.findUnique({
        where: {
          userId,
        },
      });

      if (existingDriver) {
        return res.status(409).json({
          success: false,
          error: 'You already have a driver application',
        });
      }

      // ------------------------------------------------
      // CREATE DRIVER
      // ------------------------------------------------
      //
      // These fields are required by your existing
      // Prisma Driver model.
      // ------------------------------------------------

      const created = await prisma.driver.create({
        data: {
          userId,
          name,
          phone,

          idNumber,
          vehicleReg,
          vehicleType,

          // Existing required Driver fields
          vehiclePlate: vehicleReg,
          rating: 0,
          completedDeliveries: 0,
          currentLat: 0,
          currentLng: 0,
          isOnline: false,

          payoutMethod,

          payoutInfo:
            payoutInfo !== undefined
              ? payoutInfo
              : undefined,

          verified: false,
        },
      });

      // ------------------------------------------------
      // FILE UPLOADS
      // ------------------------------------------------

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      if (files?.idDocument?.[0]) {
        const file = files.idDocument[0];

        const uploaded = await uploadBufferToS3(
          file.buffer,
          file.mimetype,
          `drivers/${created.id}/`
        );

        await prisma.driver.update({
          where: {
            id: created.id,
          },
          data: {
            idDocumentUrl: uploaded.key,
          },
        });
      }

      if (files?.vehicleDoc?.[0]) {
        const file = files.vehicleDoc[0];

        const uploaded = await uploadBufferToS3(
          file.buffer,
          file.mimetype,
          `drivers/${created.id}/`
        );

        await prisma.driver.update({
          where: {
            id: created.id,
          },
          data: {
            vehicleDocUrl: uploaded.key,
          },
        });
      }

      const finalDriver = await prisma.driver.findUnique({
        where: {
          id: created.id,
        },
      });

      return res.status(201).json({
        success: true,
        data: finalDriver,
      });
    } catch (err) {
      console.error('Driver apply error:', err);

      return res.status(500).json({
        success: false,
        error: 'Server error while submitting driver application',
      });
    }
  }
);

// --------------------------------------------------
// GET PENDING DRIVERS
// --------------------------------------------------

router.get(
  '/pending',
  requireAuth(['admin']),
  async (_req: DriverAuthRequest, res: Response) => {
    try {
      const pending = await prisma.driver.findMany({
        where: {
          verified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        data: pending,
      });
    } catch (err) {
      console.error('Pending drivers error:', err);

      return res.status(500).json({
        success: false,
        error: 'Server error',
      });
    }
  }
);

// --------------------------------------------------
// APPROVE DRIVER
// --------------------------------------------------

router.patch(
  '/:id/approve',
  requireAuth(['admin']),
  async (req: DriverAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const driver = await prisma.driver.findUnique({
        where: {
          id,
        },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      const updated = await prisma.driver.update({
        where: {
          id,
        },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      console.error('Driver approval error:', err);

      return res.status(500).json({
        success: false,
        error: 'Server error',
      });
    }
  }
);

// --------------------------------------------------
// REJECT DRIVER
// --------------------------------------------------

router.patch(
  '/:id/reject',
  requireAuth(['admin']),
  async (req: DriverAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const driver = await prisma.driver.findUnique({
        where: {
          id,
        },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      const reason =
        String(req.body?.reason || 'Rejected').trim();

      console.log(
        `Driver ${id} rejected. Reason: ${reason}`
      );

      const updated = await prisma.driver.update({
        where: {
          id,
        },
        data: {
          verified: false,
          verifiedAt: null,
        },
      });

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      console.error('Driver rejection error:', err);

      return res.status(500).json({
        success: false,
        error: 'Server error',
      });
    }
  }
);

// --------------------------------------------------
// CURRENT DRIVER APPLICATION
// --------------------------------------------------

router.get(
  '/me',
  optionalAuth(),
  async (req: DriverAuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.json({
          success: true,
          data: null,
        });
      }

      const driver = await prisma.driver.findUnique({
        where: {
          userId,
        },
      });

      return res.json({
        success: true,
        data: driver,
      });
    } catch (err) {
      console.error('Get driver profile error:', err);

      return res.status(500).json({
        success: false,
        error: 'Server error',
      });
    }
  }
);

export default router;