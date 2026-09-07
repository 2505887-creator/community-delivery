import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole | 'admin';
  name?: string;
} | null;

// Roles a person can pick for themselves at sign-up. Admin is assigned
// manually (via Supabase dashboard / an admin tool), never through the
// public form -- the DB trigger also enforces this server-side.
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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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

async function loadProfile(session: Session | null): Promise<PublicUser> {
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', session.user.id)
    .single();

  if (error || !data) {
    // Profile row may not have been created yet (rare race right after
    // sign-up) -- fall back to what the auth session itself tells us.
    return {
      id: session.user.id,
      email: session.user.email || '',
      role: (session.user.user_metadata?.role as UserRole) || 'tenant',
      name: session.user.user_metadata?.name,
    };
  }

  return { id: data.id, email: data.email, role: data.role, name: data.name ?? undefined };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(await loadProfile(data.session));
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(await loadProfile(newSession));
      setLoading(false);
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) return { success: false, error: error.message };

    // If email confirmation is required, Supabase returns a user but no
    // active session yet.
    const needsEmailConfirmation = !!data.user && !data.session;
    return { success: true, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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

