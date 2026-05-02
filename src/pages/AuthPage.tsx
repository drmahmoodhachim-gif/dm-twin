import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AuthPage() {
  const {
    session,
    connectionStatus,
    authStatus,
    signInWithMagicLink,
    setAuthStatus,
    otpCooldownSeconds,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    await signInWithMagicLink(email.trim())
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="card auth-card">
        <h1>Sign in to DM Twin</h1>
        <p className="status">{connectionStatus}</p>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => {
                setEmail(event.target.value)
                setAuthStatus('')
              }}
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" disabled={loading || otpCooldownSeconds > 0}>
            {loading
              ? 'Sending...'
              : otpCooldownSeconds > 0
                ? `Retry in ${otpCooldownSeconds}s`
                : 'Send magic link'}
          </button>
        </form>
        {authStatus ? <p className="status">{authStatus}</p> : null}
      </section>
    </main>
  )
}
