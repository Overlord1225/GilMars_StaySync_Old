'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../lib/types';

type AuthUser = {
  id: string;
  email: string | null;
  role: UserRole | null;
  is_active: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    contactNumber: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUser(sessionUser: { id: string; email?: string | null | undefined }) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionUser.id)
    .single();
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? null,
    role: (profile?.role as UserRole) ?? null,
    is_active: profile?.is_active ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(await fetchUser(session.user));
        }
      } catch {
        // no session
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(await fetchUser(session.user));
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    contactNumber: string
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, contact_number: contactNumber } },
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }

  async function refreshProfile() {
    if (!user) return;
    const refreshed = await fetchUser({ id: user.id, email: user.email ?? null });
    setUser(refreshed);
  }

  const value: AuthContextType = { user, loading, signIn, signUp, signOut, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}