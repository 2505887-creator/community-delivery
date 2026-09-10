import express, { Response } from 'express';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { requireAuth, AuthedRequest } from './lib/supabaseAdmin';
import { prisma } from './lib/prisma';
const router = express.Router();
const bucket = process.env.AWS_S3_BUCKET || '';
const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1', ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? { credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } } : {}) });
router.get('/driver/:driverId/:documentType', requireAuth(['driver', 'admin']), async (req: AuthedRequest, res: Response) => {
  try {
    if (!bucket) return res.status(503).json({ success: false, error: 'Document storage is not configured' });
    const { driverId, documentType } = req.params;
    if (!['id', 'vehicle'].includes(documentType)) return res.status(400).json({ success: false, error: 'Invalid document type' });
    const driver = await prisma.driver.findUnique({ where: { id: driverId }, select: { userId: true, idDocumentUrl: true, vehicleDocUrl: true } });
    if (!driver) return res.status(404).json({ success: false, error: 'Driver not found' });
    if (req.user!.role !== 'admin' && driver.userId !== req.user!.id) return res.status(403).json({ success: false, error: 'Forbidden' });
    const key = documentType === 'id' ? driver.idDocumentUrl : driver.vehicleDocUrl;
    if (!key || !key.startsWith('drivers/')) return res.status(404).json({ success: false, error: 'Document not found' });
    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!object.Body) return res.status(404).json({ success: false, error: 'Document not found' });
    res.setHeader('Content-Type', object.ContentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-store');
    const body = object.Body as any;
    if (typeof body.pipe === 'function') body.pipe(res); else res.send(Buffer.from(await body.transformToByteArray()));
  } catch (error) {
    console.error('Driver document error:', error);
    return res.status(404).json({ success: false, error: 'Unable to retrieve document' });
  }
});
export default router;
