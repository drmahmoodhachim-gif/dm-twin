import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Completing sign-in...')

  useEffect(() => {
    async function completeAuth() {
      if (!supabase) {
        setStatus('Supabase is not configured.')
        return
      }

      const currentUrl = new URL(window.location.href)
      const tokenHash = currentUrl.searchParams.get('token_hash')
      const type = currentUrl.searchParams.get('type')

      try {
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'magiclink' | 'signup' | 'recovery' | 'email_change' | 'invite' | 'email',
          })
          if (error) {
            setStatus(`Sign-in failed: ${error.message}`)
            return
          }
        } else {
          const { error } = await supabase.auth.getSession()
          if (error) {
            setStatus(`Sign-in failed: ${error.message}`)
            return
          }
        }

        navigate('/', { replace: true })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown authentication error'
        setStatus(`Sign-in failed: ${message}`)
      }
    }

    void completeAuth()
  }, [navigate])

  return (
    <main className="auth-page">
      <section className="card auth-card">
        <h1>Auth Callback</h1>
        <p className="status">{status}</p>
      </section>
    </main>
  )
}
