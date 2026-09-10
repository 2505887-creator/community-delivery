import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const REGION = process.env.AWS_REGION || 'eu-west-1';
const BUCKET = process.env.AWS_S3_BUCKET || '';

const s3 = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
    : undefined,
});

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
]);

export function assertAllowedUpload(contentType: string, size: number) {
  if (!ALLOWED_TYPES.has(contentType)) throw new Error('Unsupported file type');
  if (size <= 0 || size > 8 * 1024 * 1024) throw new Error('File exceeds the 8 MB limit');
}

export async function uploadBufferToS3(buffer: Buffer, contentType: string, prefix = 'uploads/') {
  if (!BUCKET) throw new Error('AWS_S3_BUCKET not configured');
  assertAllowedUpload(contentType, buffer.length);

  const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/+/g, '/');
  const key = `${safePrefix}${randomUUID()}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'private',
    ServerSideEncryption: 'AES256',
  }));

  return { key };
}
