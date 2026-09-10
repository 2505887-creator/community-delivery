import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  };
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(options: { windowMs: number; max: number; key?: (req: Request) => string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.key ? options.key(req) : req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }
    existing.count += 1;
    if (existing.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((existing.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }
    return next();
  };
}

export function hashUploadName(originalName: string) {
  return crypto.createHash('sha256').update(originalName).digest('hex').slice(0, 16);
}
