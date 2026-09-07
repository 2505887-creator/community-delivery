import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole | 'admin';
  name?: string;
} | null;

export const SELF_SERVICE_ROLES: UserRole[] = ['tenant', 'provider', 'driver', 'merchant'];

interface SignUpResult {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: PublicUser;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole | 'admin' }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const isUserRole = (value: unknown): value is UserRole | 'admin' =>
  value === 'tenant' || value === 'provider' || value === 'driver' || value === 'merchant' || value === 'admin';

async function loadProfile(session: Session | null): Promise<PublicUser> {
  if (!session?.user) return null;

  const fallback: NonNullable<PublicUser> = {
    id: session.user.id,
    email: session.user.email || '',
    role: 'tenant',
    name: typeof session.user.user_metadata?.name === 'string' ? session.user.user_metadata.name : undefined,
  };

  // The profiles table is authoritative for authorization. Never trust a
  // client-supplied role in metadata when an existing profile is available.
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('[Auth] Unable to load profile:', error.message);
    return fallback;
  }

  if (!data) {
    // This can happen for an older Auth user created before the profile
    // trigger existed. Try to repair the row through the RLS-safe own-row
    // insert policy. If insertion is not permitted, the app still remains
    // usable as a tenant until the database migration is applied.
    const metadataRole = session.user.user_metadata?.role;
    const safeRole: UserRole = isUserRole(metadataRole) && metadataRole !== 'admin' ? metadataRole : 'tenant';

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: session.user.id,
        email: session.user.email || '',
        name: typeof session.user.user_metadata?.name === 'string' ? session.user.user_metadata.name : null,
        role: safeRole,
      })
      .select('id, email, name, role')
      .single();

    if (!createError && created) {
      return { id: created.id, email: created.email, role: created.role, name: created.name ?? undefined };
    }

    if (createError) {
      console.warn('[Auth] Profile row missing and could not be created:', createError.message);
    }
    return fallback;
  }

  if (!isUserRole(data.role)) {
    console.error('[Auth] Invalid profile role:', data.role);
    return { ...fallback, role: 'tenant', name: data.name ?? fallback.name };
  }

  return { id: data.id, email: data.email, role: data.role, name: data.name ?? undefined };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        setSession(data.session);
        const profile = await loadProfile(data.session);
        if (mounted) setUser(profile);
      } catch (error) {
        console.error('[Auth] Session initialization failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      // Do not perform a Supabase profile request synchronously inside the
      // auth callback. Deferring it avoids auth-lock contention and keeps the
      // session event responsive.
      window.setTimeout(async () => {
        if (!mounted) return;
        if (!newSession) {
          setUser(null);
          setLoading(false);
          return;
        }

        const profile = await loadProfile(newSession);
        if (mounted) {
          setUser(profile);
          setLoading(false);
        }
      }, 0);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<SignUpResult> => {
    if (!SELF_SERVICE_ROLES.includes(role)) {
      return { success: false, error: 'That account type cannot be created here.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      needsEmailConfirmation: !!data.user && !data.session,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { success: false, error: error?.message || 'Unable to create a session.' };
    }

    // Read the profile explicitly here so LoginModal can immediately verify
    // the selected portal role before allowing the user into the dashboard.
    const profile = await loadProfile(data.session);
    return { success: true, role: profile?.role || 'tenant' };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[Auth] Sign-out failed:', error.message);
    setUser(null);
    setSession(null);
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, sendPasswordReset, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}
