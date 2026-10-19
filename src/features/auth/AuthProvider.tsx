'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile, UserRole } from '../../lib/types';

type AuthUser = {
  id: string;
  email: string | null;
  role: UserRole | null;
  is_active: boolean;
};

type AuthContextType = {
  session: any | null;
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session ?? null);
        if (session?.user && mounted) {
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? null,
              role: (prof?.role as UserRole) ?? null,
              is_active: prof?.is_active ?? false,
            });
            setProfile(prof);
          }
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
        setSession(session ?? null);
        if (session?.user) {
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? null,
              role: (prof?.role as UserRole) ?? null,
              is_active: prof?.is_active ?? false,
            });
            setProfile(prof);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  const value: AuthContextType = { session, user, profile, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
