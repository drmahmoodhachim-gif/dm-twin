import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { AppRole, AuthState } from '../types'
import { supabase } from '../lib/supabase'

type AuthContextValue = AuthState & {
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  setAuthStatus: (value: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEFAULT_ROLE: AppRole = 'patient'

function normalizeRole(value: unknown): AppRole {
  if (value === 'patient' || value === 'clinician' || value === 'researcher' || value === 'admin') {
    return value
  }
  return DEFAULT_ROLE
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthState['session']>(null)
  const [role, setRole] = useState<AppRole>(DEFAULT_ROLE)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('Checking connection...')
  const [authStatus, setAuthStatus] = useState('')

  useEffect(() => {
    async function bootstrap() {
      if (!supabase) {
        setConnectionStatus('Supabase env vars are not configured yet.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setConnectionStatus(`Supabase connected but returned: ${error.message}`)
        setLoading(false)
        return
      }

      setSession(data.session)
      setConnectionStatus('Supabase is connected and ready.')
      setLoading(false)
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    if (!supabase) return

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchRole() {
      if (!supabase || !session?.user?.id) {
        setRole(DEFAULT_ROLE)
        return
      }

      const { data, error } = await supabase.rpc('current_user_role')
      if (error) {
        setRole(DEFAULT_ROLE)
        return
      }

      setRole(normalizeRole(data))
    }

    void fetchRole()
  }, [session?.user?.id])

  async function signInWithMagicLink(email: string) {
    if (!supabase) return
    setAuthStatus('Sending magic link...')
    const emailRedirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })
    if (error) {
      setAuthStatus(`Sign in failed: ${error.message}`)
      return
    }
    setAuthStatus('Magic link sent. Check your email to sign in.')
  }

  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthStatus(`Sign out failed: ${error.message}`)
      return
    }
    setAuthStatus('')
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      role,
      loading,
      connectionStatus,
      authStatus,
      signInWithMagicLink,
      signOut,
      setAuthStatus,
    }),
    [session, role, loading, connectionStatus, authStatus],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
