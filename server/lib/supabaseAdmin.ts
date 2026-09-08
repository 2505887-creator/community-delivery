import { createClient } from '@supabase/supabase-js';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import jwt from 'jsonwebtoken';

const supabaseUrl =
  process.env.SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'dev_secret_change_me';

if (!supabaseUrl) {
  console.error(
    '[auth] Missing SUPABASE_URL.'
  );
}

if (!serviceRoleKey) {
  console.error(
    '[auth] Missing SUPABASE_SERVICE_ROLE_KEY.'
  );
}

export const supabaseAdmin =
  createClient(
    supabaseUrl || '',
    serviceRoleKey || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
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

export interface AuthedRequest
  extends Request {
  user?: AuthedUser;
}

function getToken(
  req: Request
): string | null {
  /*
   * Support both:
   *
   * 1. Supabase:
   *    Authorization: Bearer <access_token>
   *
   * 2. Existing legacy application:
   *    session cookie
   */
  const cookieToken =
    req.cookies?.session;

  if (cookieToken) {
    return cookieToken;
  }

  const header =
    req.headers.authorization;

  if (
    !header ||
    !header.startsWith('Bearer ')
  ) {
    return null;
  }

  const token =
    header.slice(7).trim();

  return token || null;
}

function localJwtUser(
  token: string
): AuthedUser | null {
  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      ) as {
        id?: string;
        email?: string;
        role?: UserRole;
        name?: string;
      };

    if (
      !decoded.id ||
      !decoded.email ||
      !decoded.role ||
      !validRoles.includes(
        decoded.role
      )
    ) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name:
        decoded.name ?? null,
    };
  } catch {
    return null;
  }
}

export async function loadUserFromToken(
  token: string
): Promise<AuthedUser | null> {
  /*
   * First support the older Prisma/JWT
   * authentication system.
   */
  const localUser =
    localJwtUser(token);

  if (localUser) {
    return localUser;
  }

  /*
   * Then validate the token against
   * Supabase Auth.
   */
  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return null;
  }

  try {
    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      authError ||
      !authData.user
    ) {
      if (authError) {
        console.error(
          '[auth] Supabase token error:',
          authError.message
        );
      }

      return null;
    }

    const authUser =
      authData.user;

    const {
      data: profile,
      error: profileError,
    } =
      await supabaseAdmin
        .from('profiles')
        .select(
          'id, email, name, role'
        )
        .eq(
          'id',
          authUser.id
        )
        .maybeSingle();

    if (profileError) {
      console.error(
        '[auth] Profile lookup error:',
        profileError.message
      );

      return null;
    }

    const metadata =
      authUser.user_metadata ||
      {};

    const metadataRole =
      metadata.role as
        | UserRole
        | undefined;

    const role: UserRole =
      profile &&
      validRoles.includes(
        profile.role as UserRole
      )
        ? (profile.role as UserRole)
        : metadataRole &&
            validRoles.includes(
              metadataRole
            )
          ? metadataRole
          : 'tenant';

    return {
      id: authUser.id,

      email:
        profile?.email ||
        authUser.email ||
        '',

      name:
        profile?.name ||
        (
          typeof metadata.name ===
          'string'
            ? metadata.name
            : null
        ),

      role,
    };
  } catch (error) {
    console.error(
      '[auth] Unexpected authentication error:',
      error
    );

    return null;
  }
}

export function requireAuth(
  requiredRoles: UserRole[] = []
) {
  return async (
    req: AuthedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const token =
      getToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error:
          'Missing authentication token',
      });
    }

    const user =
      await loadUserFromToken(
        token
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        error:
          'Invalid or expired session',
      });
    }

    if (
      requiredRoles.length > 0 &&
      !requiredRoles.includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: insufficient role',
      });
    }

    req.user = user;

    next();
  };
}

export function optionalAuth() {
  return async (
    req: AuthedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    const token =
      getToken(req);

    if (token) {
      req.user =
        (await loadUserFromToken(
          token
        )) ?? undefined;
    }

    next();
  };
}