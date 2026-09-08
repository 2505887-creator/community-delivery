import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import type { AuthedRequest } from './supabaseAdmin';
const prisma = new PrismaClient();
export async function audit(req: AuthedRequest, action: string, resource: string, resourceId?: string, metadata?: unknown) {
  if (!req.user) return;
  const ip = String(req.ip || req.headers['x-forwarded-for'] || '');
  const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;
  try { await prisma.auditEvent.create({ data: { actorId: req.user.id, action, resource, resourceId, metadata: metadata as any, ipHash, userAgent: String(req.headers['user-agent'] || '') } }); } catch (e) { console.error('[audit]', e); }
}
