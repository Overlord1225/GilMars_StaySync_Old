import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { AuthContext, type AuthContextValue, type AuthUser } from './AuthContext'
import { hasActiveProfile, isCurrentAuthRequest } from './profileAccess'


function toAuthUser(user: User, profile: Profile | null): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role ?? null,
    is_active: profile?.is_active ?? false,
  }
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

function describeProfileError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const detail = error as { message?: unknown; code?: unknown; details?: unknown }
    const message = typeof detail.message === 'string' ? detail.message : 'Unknown database error'
    const code = typeof detail.code === 'string' ? ` (${detail.code})` : ''
    const details = typeof detail.details === 'string' ? ` ${detail.details}` : ''
    return `${message}${code}${details}`
  }
  return String(error)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const authVersion = useRef(0)

  useEffect(() => {
    let active = true
    const clearAuthState = () => {
      setSession(null)
      setUser(null)
      setProfile(null)
    }

    const readProfileForSession = async (nextSession: Session, version: number) => {
      try {
        const nextProfile = await loadProfile(nextSession.user.id)
        if (!active || !isCurrentAuthRequest(version, authVersion.current)) return
        if (!hasActiveProfile(nextProfile)) {
          clearAuthState()
          void supabase.auth.signOut()
          return
        }
        setSession(nextSession)
        setProfile(nextProfile)
        setUser(toAuthUser(nextSession.user, nextProfile))
      } catch {
        if (!active || !isCurrentAuthRequest(version, authVersion.current)) return
        clearAuthState()
        void supabase.auth.signOut()
      } finally {
        if (active && isCurrentAuthRequest(version, authVersion.current)) setLoading(false)
      }
    }

    const initialVersion = authVersion.current
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const version = ++authVersion.current
      setLoading(true)
      if (!nextSession?.user) {
        clearAuthState()
        setLoading(false)
        return
      }
      setSession(nextSession)
      setUser(null)
      setProfile(null)
      // Supabase recommends keeping auth callbacks synchronous. Defer profile
      // access until after the auth event has completed.
      window.setTimeout(() => {
        void readProfileForSession(nextSession, version)
      }, 0)
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || !isCurrentAuthRequest(initialVersion, authVersion.current)) return
      if (error) {
        setLoading(false)
        return
      }
      if (!data.session?.user) {
        clearAuthState()
        setLoading(false)
        return
      }
      const version = ++authVersion.current
      setSession(data.session)
      void readProfileForSession(data.session, version)
    }).catch(() => {
      if (active && isCurrentAuthRequest(initialVersion, authVersion.current)) setLoading(false)
    })

    return () => {
      active = false
      authVersion.current += 1
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const requestVersion = authVersion.current
    const currentSession = session ?? (await supabase.auth.getSession()).data.session
    if (!isCurrentAuthRequest(requestVersion, authVersion.current)) return
    if (!currentSession?.user) {
      setProfile(null)
      setUser(null)
      return
    }
    const nextProfile = await loadProfile(currentSession.user.id)
    if (!isCurrentAuthRequest(requestVersion, authVersion.current)) return
    if (!hasActiveProfile(nextProfile)) {
      setSession(null)
      setProfile(null)
      setUser(null)
      await supabase.auth.signOut()
      throw new Error('Your account profile is missing or inactive. Contact support.')
    }
    setSession(currentSession)
    setProfile(nextProfile)
    setUser(toAuthUser(currentSession.user, nextProfile))
  }, [session])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    profile,
    role: user?.role ?? null,
    loading,
    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      let nextProfile: Profile | null
      try {
        nextProfile = await loadProfile(data.user.id)
      } catch (profileError) {
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
        setUser(null)
        const details = ` Details: ${describeProfileError(profileError)}`
        throw new Error(`Your password was accepted, but StaySync could not read your profile.${details}`)
      }
      if (!nextProfile) {
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
        setUser(null)
        throw new Error('Your login succeeded, but no StaySync profile exists for this account. Ask an administrator to check the profile record.')
      }
      if (!hasActiveProfile(nextProfile)) {
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
        setUser(null)
        throw new Error('Your account is inactive or still being provisioned. Contact support.')
      }
      setSession(data.session)
      setProfile(nextProfile)
      setUser(toAuthUser(data.user, nextProfile))
      return nextProfile.role
    },
    async signInWithOAuth(provider: string) {
      const { error } = await supabase.auth.signInWithOAuth({ provider: provider as 'google' })
      if (error) throw error
    },
    async signUp({ email, password, fullName }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
      return { confirmationRequired: !data.session }
    },
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
      setUser(null)
      setProfile(null)
    },
    async sendPasswordReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    },
    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    async updateProfile(updates) {
      if (!user) throw new Error('Sign in to update your account.')
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
    },
    refreshProfile,
  }), [session, user, profile, loading, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
