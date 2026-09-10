import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('[auth] Missing SUPABASE_URL.');
}

if (!serviceRoleKey) {
  console.error('[auth] Missing SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabaseAdmin = createClient(
  supabaseUrl || '',
  serviceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export type UserRole =
  | 'tenant'
  | 'provider'
  | 'driver'
  | 'merchant'
  | 'admin';

const validRoles: UserRole[] = [
  'tenant',
  'provider',
  'driver',
  'merchant',
  'admin',
];

export type AuthedUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
};

export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function loadUserFromToken(
  token: string,
): Promise<AuthedUser | null> {
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      if (authError) {
        console.error('[auth] Supabase token error:', authError.message);
      }
      return null;
    }

    const authUser = authData.user;
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, suspendedAt')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('[auth] Profile lookup error:', profileError.message);
      return null;
    }

    if (!profile) {
      console.error('[auth] Authenticated user has no application profile:', authUser.id);
      return null;
    }

    if (profile.suspendedAt) {
      return null;
    }

    if (!validRoles.includes(profile.role as UserRole)) {
      console.error('[auth] Profile has an invalid role:', authUser.id);
      return null;
    }

    return {
      id: authUser.id,
      email: profile.email || authUser.email || '',
      name: profile.name || null,
      role: profile.role as UserRole,
    };
  } catch (error) {
    console.error('[auth] Unexpected authentication error:', error);
    return null;
  }
}

export function requireAuth(requiredRoles: UserRole[] = []) {
  return async (
    req: AuthedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Missing Bearer authentication token',
      });
    }

    const user = await loadUserFromToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid, expired, or suspended session',
      });
    }

    if (
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: insufficient role',
      });
    }

    req.user = user;
    return next();
  };
}

export function optionalAuth() {
  return async (
    req: AuthedRequest,
    _res: Response,
    next: NextFunction,
  ) => {
    const token = getBearerToken(req);
    if (token) {
      req.user = (await loadUserFromToken(token)) ?? undefined;
    }
    return next();
  };
}

