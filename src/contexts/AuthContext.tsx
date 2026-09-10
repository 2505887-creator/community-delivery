import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole | 'admin';
  name?: string;
} | null;

export const SELF_SERVICE_ROLES: UserRole[] = [
  'tenant',
  'provider',
  'driver',
  'merchant',
];

interface SignUpResult {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: PublicUser;
  session: Session | null;
  loading: boolean;

  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    metadata?: Record<string, unknown>
  ) => Promise<SignUpResult>;

  resendConfirmation: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;

  signIn: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    role?: UserRole | 'admin';
  }>;

  signOut: () => Promise<void>;

  sendPasswordReset: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;

  updatePassword: (
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
};

const isUserRole = (
  value: unknown
): value is UserRole | 'admin' =>
  ['tenant', 'provider', 'driver', 'merchant', 'admin'].includes(
    String(value)
  );

async function loadProfile(
  session: Session | null
): Promise<PublicUser> {
  if (!session?.user) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('[Auth] Profile query failed:', error.message);
      return null;
    }

    if (!data || !isUserRole(data.role)) {
      console.error('[Auth] No valid application profile exists for this session.');
      return null;
    }

    return {
      id: data.id,
      email: data.email || session.user.email || '',
      name: data.name ?? undefined,
      role: data.role,
    };
  } catch (error) {
    console.error('[Auth] Unexpected profile error:', error);
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<PublicUser>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        setSession(data.session);

        setUser(
          await loadProfile(data.session)
        );
      } catch (error) {
        console.error(
          '[Auth] Session initialization failed:',
          error
        );

        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initialize();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (
        event: AuthChangeEvent,
        newSession
      ) => {
        if (!mounted) {
          return;
        }

        setSession(newSession);

        window.setTimeout(async () => {
          if (!mounted) {
            return;
          }

          if (!newSession) {
            setUser(null);
            setLoading(false);
            return;
          }

          setUser(
            await loadProfile(newSession)
          );

          setLoading(false);
        }, 0);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    metadata: Record<string, unknown> = {}
  ): Promise<SignUpResult> => {
    if (!SELF_SERVICE_ROLES.includes(role)) {
      return {
        success: false,
        error:
          'That account type cannot be created here.',
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error:
          'Password must be at least 8 characters.',
      };
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const { data, error } =
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            role,
            ...metadata,
          },

          emailRedirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error:
          'Supabase did not create the account.',
      };
    }

    return {
      success: true,
      needsEmailConfirmation:
        !data.session,
    };
  };

  const resendConfirmation = async (
    email: string
  ) => {
    const { error } =
      await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

    return error
      ? {
          success: false,
          error: error.message,
        }
      : {
          success: true,
        };
  };

  const signIn = async (
    email: string,
    password: string
  ) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (error) {
      const message =
        /email not confirmed/i.test(
          error.message
        )
          ? 'Please confirm your email before signing in. Check your inbox or resend the confirmation email.'
          : error.message;

      return {
        success: false,
        error: message,
      };
    }

    if (!data.session) {
      return {
        success: false,
        error:
          'No active session was created.',
      };
    }

    const profile = await loadProfile(data.session);

    if (!profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Your account profile could not be loaded. Please contact support.',
      };
    }

    if (profile.role === 'provider') {
      try {
        const response = await fetch(
          '/api/services/ensure',
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${data.session.access_token}`,
              'Content-Type':
                'application/json',
            },
          }
        );

        if (!response.ok) {
          const payload =
            await response
              .json()
              .catch(() => ({}));

          console.warn(
            '[Auth] Provider workspace initialization failed:',
            payload.error ||
              response.statusText
          );
        }
      } catch (error) {
        console.warn(
          '[Auth] Provider workspace initialization error:',
          error
        );
      }
    }

    return {
      success: true,
      role: profile.role,
    };
  };

  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        '[Auth] Sign-out failed:',
        error.message
      );
    }

    setUser(null);
    setSession(null);
  };

  const sendPasswordReset = async (
    email: string
  ) => {
    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo:
            `${window.location.origin}/auth/reset-password`,
        }
      );

    return error
      ? {
          success: false,
          error: error.message,
        }
      : {
          success: true,
        };
  };

  const updatePassword = async (
    newPassword: string
  ) => {
    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    return error
      ? {
          success: false,
          error: error.message,
        }
      : {
          success: true,
        };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        resendConfirmation,
        signIn,
        signOut,
        sendPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}