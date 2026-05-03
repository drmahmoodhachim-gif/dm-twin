'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const demoBypassAuth =
    process.env.NEXT_PUBLIC_DEMO_BYPASS_AUTH === 'true' || process.env.DEMO_BYPASS_AUTH === 'true'

  useEffect(() => {
    if (demoBypassAuth) {
      window.location.replace('/me')
    }
  }, [demoBypassAuth])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setStatus('Sending magic link...')

    const redirectUrl =
      typeof window === 'undefined'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`
        : `${window.location.origin}/api/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (error) {
      setStatus(`Sign in failed: ${error.message}`)
      setLoading(false)
      return
    }

    setStatus('Magic link sent. Check your email.')
    setLoading(false)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-6">
      <section className="w-full rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-black/20 px-3 py-2"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded bg-black px-3 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>
        {status ? <p className="mt-3 text-sm text-zinc-700">{status}</p> : null}
      </section>
    </main>
  )
}
