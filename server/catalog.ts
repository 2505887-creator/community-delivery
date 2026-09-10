import { prisma } from './lib/prisma';
import express, { Response } from 'express';
import { optionalHybridAuth } from './lib/hybridAuth';
import type { AuthedRequest } from './lib/supabaseAdmin';
import { mapPro } from './lib/mappers';


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
