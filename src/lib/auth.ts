import { supabase } from './supabase';
import type { Profile, UserRole } from './types';

export interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole | null;
  is_active: boolean;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  contactNumber: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, contact_number: contactNumber } },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data: data as Profile | null, error };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

export function mapAuthUser(sessionUser: { id: string; email: string | null }, profile: Profile | null): AuthUser {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    role: (profile?.role as UserRole) ?? null,
    is_active: profile?.is_active ?? false,
  };
}