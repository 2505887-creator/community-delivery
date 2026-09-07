import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalHybridAuth } from './lib/hybridAuth';
import type { AuthedRequest } from './lib/supabaseAdmin';
import { mapPro } from './lib/mappers';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', optionalHybridAuth(), async (_req: AuthedRequest, res: Response) => {
  try {
    const pros = await prisma.verifiedPro.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: pros.map(mapPro) });
  } catch (err) {
    console.error('List services error:', err);
    res.status(500).json({ success: false, error: 'Failed to load services' });
  }
});

export default router;
