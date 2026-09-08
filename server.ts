import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Order, VerifiedPro, LocalStore, Driver } from './src/types';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import driversRouter from './server/drivers';
import servicesRouter from './server/services';
import storesRouter from './server/stores';
import ordersRouter from './server/orders';
import usersRouter from './server/users';
import catalogRouter from './server/catalog';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.APP_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
);

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

function getTokenFromReq(req: Request): string | null {
  const cookieToken = req.cookies?.session;
  if (cookieToken) return cookieToken;

  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim() || null;

  return null;
}

/*
 * Legacy/local JWT middleware is retained for backward compatibility.
 * Supabase-backed application routes use server/lib/supabaseAdmin.ts.
 */
function authMiddleware(requiredRoles: string[] = []) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const token = getTokenFromReq(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Missing authorization token',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id?: string;
        email?: string;
        role?: string;
      };

      if (!decoded.id || !decoded.email || !decoded.role) {
        throw new Error('Invalid token payload');
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: insufficient role',
        });
      }

      return next();
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  };
}

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      success: true,
      message: 'OmniServe API is running',
      database: 'connected',
    });
  } catch (error) {
    console.error('[health]', error);
    return res.status(503).json({
      success: false,
      message: 'OmniServe API is running',
      database: 'unavailable',
    });
  }
});

/*
 * Legacy authentication endpoints remain available for compatibility.
 * New frontend authentication is handled by Supabase Auth.
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: String(name || normalizedEmail.split('@')[0]).trim(),
        role: role || 'tenant',
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[auth:register]', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[auth:login]', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

app.get('/api/auth/me', authMiddleware(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[auth:me]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch current user',
    });
  }
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('session');
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/*
 * Legacy public driver listing is kept for marketplace compatibility.
 * Driver-specific onboarding/management is implemented by the router below.
 */
async function getDrivers(): Promise<Driver[]> {
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return drivers as unknown as Driver[];
}

app.get('/api/drivers', async (_req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: await getDrivers(),
    });
  } catch (error) {
    console.error('[drivers:list]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers',
    });
  }
});

/*
 * Application API routers.
 *
 * Each router owns its endpoint-level authentication/authorization.
 */
app.use('/api/drivers', driversRouter);
app.use('/api/services', servicesRouter);
app.use('/api/stores', storesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/catalog', catalogRouter);

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
