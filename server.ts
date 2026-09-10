import 'dotenv/config';

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Driver } from './src/types';
import cors from 'cors';

import driversRouter from './server/drivers';
import servicesRouter from './server/services';
import storesRouter from './server/stores';
import ordersRouter from './server/orders';
import usersRouter from './server/users';
import catalogRouter from './server/catalog';
import accountRouter from './server/account';
import adminRouter from './server/admin';
import paymentsRouter from './server/payments';
import documentsRouter from './server/documents';
import { processEmailQueue } from './server/lib/emailQueue';
import { prisma } from './server/lib/prisma';
import { rateLimit, securityHeaders } from './server/lib/security';
import aiRouter from './server/ai';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(securityHeaders());
app.use(express.json({ limit: '2mb' }));
const allowedOrigins = (process.env.APP_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: false,
}));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 60 }));
app.use('/api/ai', rateLimit({ windowMs: 60 * 1000, max: 20 }), aiRouter);

/*
 * Application API routers.
 *
 * Each router owns its endpoint-level authentication/authorization.
 */
app.use('/api/drivers', driversRouter);
app.use('/api/services', servicesRouter);
app.use('/api/stores', storesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/account', accountRouter);
app.use('/api/admin', adminRouter);

/*
 * Unknown API routes should return JSON instead of the SPA.
 */
app.use('/api', (_req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: 'API route not found',
  });
});

/*
 * Vite development middleware / production static serving.
 */
let emailWorker: NodeJS.Timeout | null = null;

if (process.env.ENABLE_EMAIL_WORKER !== 'false') {
  emailWorker = setInterval(() => {
    processEmailQueue().catch((error) =>
      console.error('[email-worker]', error),
    );
  }, Number(process.env.EMAIL_WORKER_INTERVAL_MS || 15000));
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] OmniServe running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received; shutting down...`);

    if (emailWorker) {
      clearInterval(emailWorker);
      emailWorker = null;
    }

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

startServer().catch(async (error) => {
  console.error('[server] Failed to start:', error);
  await prisma.$disconnect();
  process.exit(1);
});
