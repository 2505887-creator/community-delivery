import type { Response, NextFunction } from 'express';
import {
  requireAuth,
  optionalAuth,
  type AuthedRequest,
  type AuthedUser,
  type UserRole,
} from './supabaseAdmin';

export type AppRole = UserRole;

/**
 * Compatibility names for existing routers.
 * Authentication is Supabase-only. There is no local JWT fallback.
 */
export function optionalHybridAuth() {
  return optionalAuth();
}

export function requireHybridAuth(requiredRoles: AppRole[] = []) {
  return requireAuth(requiredRoles);
}

export type { AuthedRequest, AuthedUser };
