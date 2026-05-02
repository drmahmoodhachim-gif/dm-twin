import { useEffect, useState } from 'react'
import { hasSupabaseEnv, supabase } from './lib/supabase'
import './App.css'

function App() {
  const [status, setStatus] = useState('Checking connection...')

  useEffect(() => {
    async function checkSupabase() {
      if (!supabase) {
        setStatus('Supabase env vars are not configured yet.')
        return
      }

      const { error } = await supabase.auth.getSession()
      if (error) {
        setStatus(`Supabase connected but returned: ${error.message}`)
        return
      }

      setStatus('Supabase is connected and ready.')
    }

    void checkSupabase()
  }, [])

  return (
    <main className="app-shell">
      <h1>DM Twin</h1>
      <p className="subtitle">Standalone React + Netlify + Supabase starter project.</p>

      <section className="card">
        <h2>Environment status</h2>
        <p>{hasSupabaseEnv ? 'Supabase keys detected in env.' : 'Supabase keys missing in env.'}</p>
        <p className="status">{status}</p>
      </section>

      <section className="card">
        <h2>Next steps</h2>
        <ol>
          <li>Copy `.env.example` to `.env` for local development.</li>
          <li>Run `npm run dev` to start the app locally.</li>
          <li>Push updates to GitHub and deploy through Netlify.</li>
        </ol>
      </section>
    </main>
  )
}

export default App
