import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { hasSupabaseEnv, supabase } from './lib/supabase'
import './App.css'

type Snapshot = {
  id: string
  source: string
  dataset: string
  fetched_at: string
}

type PatientProfileForm = {
  display_name: string
  birth_year: string
  sex: string
  diabetes_type: string
  diagnosis_date: string
}

const CURRENT_YEAR = new Date().getFullYear()

function App() {
  const [connectionStatus, setConnectionStatus] = useState('Checking connection...')
  const [authStatus, setAuthStatus] = useState('')
  const [email, setEmail] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [researchStatus, setResearchStatus] = useState('Sign in to load datasets.')
  const [researchLoading, setResearchLoading] = useState(false)

  const [patientStatus, setPatientStatus] = useState('Sign in to manage patient profile.')
  const [patientSaving, setPatientSaving] = useState(false)
  const [profileForm, setProfileForm] = useState<PatientProfileForm>({
    display_name: '',
    birth_year: '',
    sex: '',
    diabetes_type: '',
    diagnosis_date: '',
  })

  const [clinicianStatus, setClinicianStatus] = useState('Sign in to view care team.')
  const [careTeamRows, setCareTeamRows] = useState<Array<{ patient_id: string; relationship: string }>>([])

  const [mohapStatus, setMohapStatus] = useState('Sign in to run ingestion.')
  const [mohapLoading, setMohapLoading] = useState(false)

  const currentUserId = useMemo(() => session?.user?.id ?? null, [session])

  const loadResearchSnapshots = useCallback(async () => {
    if (!supabase || !session) return
    setResearchLoading(true)

    const { data, error } = await supabase
      .from('dataset_snapshots_public')
      .select('id, source, dataset, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(8)

    if (error) {
      setResearchStatus(`Could not load snapshots: ${error.message}`)
      setResearchLoading(false)
      return
    }

    setSnapshots(data ?? [])
    setResearchStatus(data && data.length > 0 ? 'Recent ingestions loaded.' : 'No ingestions found yet.')
    setResearchLoading(false)
  }, [session])

  useEffect(() => {
    async function checkSupabase() {
      if (!supabase) {
        setConnectionStatus('Supabase env vars are not configured yet.')
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setConnectionStatus(`Supabase connected but returned: ${error.message}`)
        return
      }

      setSession(data.session)
      setConnectionStatus('Supabase is connected and ready.')
    }

    void checkSupabase()
  }, [])

  useEffect(() => {
    if (!supabase) return

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setSnapshots([])
      setResearchStatus('Sign in to load datasets.')
      return
    }

    void loadResearchSnapshots()
  }, [loadResearchSnapshots, session])

  useEffect(() => {
    async function loadPatientProfile() {
      if (!supabase || !currentUserId) return

      const { data, error } = await supabase
        .schema('clinical')
        .from('patient_profile')
        .select('display_name, birth_year, sex, diabetes_type, diagnosis_date')
        .eq('patient_id', currentUserId)
        .maybeSingle()

      if (error) {
        setPatientStatus(`Patient profile access issue: ${error.message}`)
        return
      }

      if (!data) {
        setPatientStatus('No patient profile found yet. Fill and save below.')
        return
      }

      setProfileForm({
        display_name: data.display_name ?? '',
        birth_year: data.birth_year ? String(data.birth_year) : '',
        sex: data.sex ?? '',
        diabetes_type: data.diabetes_type ?? '',
        diagnosis_date: data.diagnosis_date ?? '',
      })
      setPatientStatus('Patient profile loaded.')
    }

    async function loadCareTeam() {
      if (!supabase || !currentUserId) return

      const { data, error } = await supabase
        .schema('clinical')
        .from('care_team')
        .select('patient_id, relationship')
        .eq('clinician_id', currentUserId)
        .order('created_at', { ascending: false })

      if (error) {
        setClinicianStatus(`Care team access issue: ${error.message}`)
        return
      }

      setCareTeamRows(data ?? [])
      setClinicianStatus(data && data.length > 0 ? 'Care team loaded.' : 'No patients linked yet.')
    }

    if (!currentUserId) {
      setPatientStatus('Sign in to manage patient profile.')
      setClinicianStatus('Sign in to view care team.')
      setMohapStatus('Sign in to run ingestion.')
      setCareTeamRows([])
      return
    }

    void loadPatientProfile()
    void loadCareTeam()
  }, [currentUserId])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !email.trim()) return

    setAuthLoading(true)
    setAuthStatus('Sending magic link...')

    const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })

    if (error) {
      setAuthStatus(`Sign in failed: ${error.message}`)
      setAuthLoading(false)
      return
    }

    setAuthStatus('Magic link sent. Check your email to sign in.')
    setAuthLoading(false)
  }

  async function handleSignOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthStatus(`Sign out failed: ${error.message}`)
      return
    }

    setAuthStatus('')
    setSession(null)
  }

  async function handlePatientSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !currentUserId) {
      setPatientStatus('Please sign in first.')
      return
    }

    const birthYearValue = profileForm.birth_year.trim() ? Number(profileForm.birth_year.trim()) : null
    if (!birthYearValue || birthYearValue < 1900 || birthYearValue > CURRENT_YEAR) {
      setPatientStatus(`Birth year must be between 1900 and ${CURRENT_YEAR}.`)
      return
    }

    setPatientStatus('Saving profile...')
    setPatientSaving(true)

    const { error } = await supabase
      .schema('clinical')
      .from('patient_profile')
      .upsert(
        {
          patient_id: currentUserId,
          display_name: profileForm.display_name || null,
          birth_year: birthYearValue,
          sex: profileForm.sex || null,
          diabetes_type: profileForm.diabetes_type || null,
          diagnosis_date: profileForm.diagnosis_date || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'patient_id' },
      )

    if (error) {
      setPatientStatus(`Save failed: ${error.message}`)
      setPatientSaving(false)
      return
    }

    setPatientStatus('Patient profile saved.')
    setPatientSaving(false)
  }

  async function handleRunMohapIngest() {
    if (!supabase || !session) {
      setMohapStatus('Please sign in first.')
      return
    }

    setMohapStatus('Running MOHAP ingestion...')
    setMohapLoading(true)
    const { data, error } = await supabase.functions.invoke('mohap-ingest', { method: 'POST' })

    if (error) {
      const humanMessage = error.message.includes('Failed to send a request')
        ? 'Ingest failed: function unreachable or unauthorized. Verify deployment and auth.'
        : `Ingest failed: ${error.message}`
      setMohapStatus(humanMessage)
      setMohapLoading(false)
      return
    }

    const snapshotId = data?.snapshotId ? ` Snapshot: ${data.snapshotId}` : ''
    setMohapStatus(`Ingest completed.${snapshotId}`)
    setMohapLoading(false)
    await loadResearchSnapshots()
  }

  const canSaveProfile = Boolean(
    session &&
      profileForm.display_name.trim() &&
      profileForm.birth_year.trim() &&
      profileForm.sex &&
      profileForm.diabetes_type &&
      !patientSaving,
  )

  return (
    <main className="app-shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <h1>DM Twin</h1>
        {session?.user ? (
          <div className="row compact">
            <p className="meta">Signed in as: {session.user.email}</p>
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        ) : null}
      </header>
      <p className="subtitle">Research + patient + clinician + ingestion control panel.</p>

      <section className="card" id="content">
        <h2>Environment status</h2>
        <p>{hasSupabaseEnv ? 'Supabase keys detected in env.' : 'Supabase keys missing in env.'}</p>
        <p className="status">{connectionStatus}</p>

        {!session ? (
          <>
            <form className="row" onSubmit={handleSignIn}>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setAuthStatus('')
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" disabled={authLoading}>
                {authLoading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
            {authStatus ? <p className="status">{authStatus}</p> : null}
          </>
        ) : null}
      </section>

      <section className="card">
        <h2>
          Research Dashboard <span className={`badge ${snapshots.length > 0 ? 'ok' : 'warn'}`}></span>
        </h2>
        {!session ? <p className="status">Sign in to access research datasets.</p> : null}
        <div className="row">
          <p className="status">{researchStatus}</p>
          <button type="button" onClick={() => void loadResearchSnapshots()} disabled={researchLoading || !session}>
            {researchLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {snapshots.length > 0 ? (
          <ul className="list">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id}>
                <strong>{snapshot.source}</strong> / {snapshot.dataset} -{' '}
                {new Date(snapshot.fetched_at).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="grid">
        <section className="card">
          <h2>
            Patient Onboarding <span className={`badge ${session ? 'ok' : 'warn'}`}></span>
          </h2>
          <p className="status">{patientStatus}</p>
          <form className="stack" onSubmit={handlePatientSave}>
            <div className="field">
              <label htmlFor="display-name">Display name</label>
              <input
                id="display-name"
                value={profileForm.display_name}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, display_name: event.target.value }))
                }
                autoComplete="name"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="birth-year">Birth year</label>
              <input
                id="birth-year"
                type="number"
                min={1900}
                max={CURRENT_YEAR}
                value={profileForm.birth_year}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, birth_year: event.target.value }))}
                inputMode="numeric"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="sex">Sex</label>
              <select
                id="sex"
                value={profileForm.sex}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, sex: event.target.value }))}
                required
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="diabetes-type">Diabetes type</label>
              <select
                id="diabetes-type"
                value={profileForm.diabetes_type}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, diabetes_type: event.target.value }))
                }
                required
              >
                <option value="">Select</option>
                <option value="type_1">Type 1</option>
                <option value="type_2">Type 2</option>
                <option value="gestational">Gestational</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="diagnosis-date">Diagnosis date</label>
              <input
                id="diagnosis-date"
                type="date"
                value={profileForm.diagnosis_date}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, diagnosis_date: event.target.value }))
                }
              />
            </div>
            <button type="submit" disabled={!canSaveProfile}>
              {patientSaving ? 'Saving...' : 'Save patient profile'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>
            Clinician Patient List <span className={`badge ${careTeamRows.length > 0 ? 'ok' : 'warn'}`}></span>
          </h2>
          <p className="status">{clinicianStatus}</p>
          {careTeamRows.length > 0 ? (
            <ul className="list">
              {careTeamRows.map((row, index) => (
                <li key={`${row.patient_id}-${index}`}>
                  {row.patient_id} ({row.relationship})
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </section>

      <section className="card">
        <h2>
          MOHAP Ingestion <span className={`badge ${mohapStatus.startsWith('Ingest completed') ? 'ok' : 'warn'}`}></span>
        </h2>
        {!session ? <p className="status">Sign in to run ingestion jobs.</p> : null}
        <p className="status">{mohapStatus}</p>
        <button type="button" onClick={handleRunMohapIngest} disabled={mohapLoading || !session}>
          {mohapLoading ? 'Running...' : 'Run MOHAP ingest now'}
        </button>
      </section>

      <footer className="footer">
        <p>Research use only. Do not use as clinical decision support without formal validation and approvals.</p>
      </footer>
    </main>
  )
}

export default App
