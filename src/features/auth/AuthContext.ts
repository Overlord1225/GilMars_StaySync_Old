import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/lib/types'

export type AuthUser = {
  id: string
  email: string | null
  role: UserRole | null
  is_active: boolean
}

export type AuthContextValue = {
  session: Session | null
  user: AuthUser | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserRole>
  signUp: (input: {
    email: string
    password: string
    fullName: string
  }) => Promise<{ confirmationRequired: boolean }>
  signInWithOAuth: (provider: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (updates: Pick<Profile, 'full_name'>) => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
