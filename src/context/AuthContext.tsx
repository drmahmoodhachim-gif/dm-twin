import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { AppRole, AuthState } from '../types'
import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../lib/config'

type AuthContextValue = AuthState & {
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  setAuthStatus: (value: string) => void
  otpCooldownSeconds: number
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
  const [role, setRole] = useState<AppRole>(DEMO_MODE ? 'admin' : DEFAULT_ROLE)
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [connectionStatus, setConnectionStatus] = useState('Checking connection...')
  const [authStatus, setAuthStatus] = useState('')
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0)

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return

    const timer = window.setInterval(() => {
      setOtpCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [otpCooldownSeconds])

  useEffect(() => {
    if (DEMO_MODE) {
      setConnectionStatus('Demo mode enabled. Authentication is bypassed.')
      setLoading(false)
      return
    }

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
    if (DEMO_MODE) return
    if (!supabase) return

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (DEMO_MODE) {
      setRole('admin')
      return
    }

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
    if (DEMO_MODE) {
      setAuthStatus('Demo mode is enabled. Sign-in is not required.')
      return
    }
    if (!supabase) return
    if (otpCooldownSeconds > 0) {
      setAuthStatus(`Please wait ${otpCooldownSeconds}s before requesting another magic link.`)
      return
    }

    setAuthStatus('Sending magic link...')
    const emailRedirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })
    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        setOtpCooldownSeconds(60)
        setAuthStatus('Sign in failed: email rate limit exceeded. Please wait 60s and try again.')
        return
      }
      setAuthStatus(`Sign in failed: ${error.message}`)
      return
    }
    setOtpCooldownSeconds(60)
    setAuthStatus('Magic link sent. Check your email to sign in.')
  }

  async function signOut() {
    if (DEMO_MODE) {
      setAuthStatus('Demo mode is enabled.')
      return
    }
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
      otpCooldownSeconds,
    }),
    [session, role, loading, connectionStatus, authStatus, otpCooldownSeconds],
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
