import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loadUserFromToken, type AuthedRequest, type AuthedUser } from './supabaseAdmin';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export type AppRole = AuthedUser['role'];

function getToken(req: AuthedRequest): string | null {
  const cookies = (req as AuthedRequest & { cookies?: Record<string, string> }).cookies;
  if (cookies?.session) return cookies.session;

  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

async function resolveUser(req: AuthedRequest): Promise<AuthedUser | null> {
  const token = getToken(req);

  console.log('[auth] request token:', {
    present: Boolean(token),
    length: token?.length || 0,
  });

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: AppRole;
      name?: string;
    };
    if (decoded?.id && decoded?.email) {
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name ?? null,
      };
    }
  } catch {
    // Not a locally signed JWT — try Supabase access token next.
  }

  return loadUserFromToken(token);
}

export function optionalHybridAuth() {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    req.user = (await resolveUser(req)) ?? undefined;
    next();
  };
}

export function requireHybridAuth(requiredRoles: AppRole[] = []) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
    }
    req.user = user;
    next();
  };
}
