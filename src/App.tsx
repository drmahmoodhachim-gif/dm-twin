import { useEffect, useMemo, useState } from 'react'
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

function App() {
  const [status, setStatus] = useState('Checking connection...')
  const [email, setEmail] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [researchStatus, setResearchStatus] = useState('Loading datasets...')
  const [patientStatus, setPatientStatus] = useState('Sign in to manage patient profile.')
  const [clinicianStatus, setClinicianStatus] = useState('Sign in to view care team.')
  const [mohapStatus, setMohapStatus] = useState('Ready.')
  const [careTeamRows, setCareTeamRows] = useState<Array<{ patient_id: string; relationship: string }>>([])
  const [profileForm, setProfileForm] = useState<PatientProfileForm>({
    display_name: '',
    birth_year: '',
    sex: '',
    diabetes_type: '',
    diagnosis_date: '',
  })

  const currentUserId = useMemo(() => session?.user?.id ?? null, [session])

  useEffect(() => {
    async function checkSupabase() {
      if (!supabase) {
        setStatus('Supabase env vars are not configured yet.')
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setStatus(`Supabase connected but returned: ${error.message}`)
        return
      }

      setSession(data.session)
      setStatus('Supabase is connected and ready.')
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
    async function loadResearchSnapshots() {
      if (!supabase) return

      const { data, error } = await supabase
        .schema('external')
        .from('dataset_snapshots')
        .select('id, source, dataset, fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(8)

      if (error) {
        setResearchStatus(`Could not load snapshots: ${error.message}`)
        return
      }

      setSnapshots(data ?? [])
      setResearchStatus(data && data.length > 0 ? 'Recent ingestions loaded.' : 'No ingestions found yet.')
    }

    void loadResearchSnapshots()
  }, [])

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

    void loadPatientProfile()
    void loadCareTeam()
  }, [currentUserId])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    setStatus('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setStatus(`Sign in failed: ${error.message}`)
      return
    }

    setStatus('Magic link sent. Check your email to sign in.')
  }

  async function handleSignOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) {
      setStatus(`Sign out failed: ${error.message}`)
      return
    }

    setPatientStatus('Sign in to manage patient profile.')
    setClinicianStatus('Sign in to view care team.')
    setSession(null)
    setStatus('Signed out.')
  }

  async function handlePatientSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !currentUserId) {
      setPatientStatus('Please sign in first.')
      return
    }

    const birthYearValue = profileForm.birth_year.trim() ? Number(profileForm.birth_year.trim()) : null
    setPatientStatus('Saving profile...')

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
      return
    }

    setPatientStatus('Patient profile saved.')
  }

  async function handleRunMohapIngest() {
    if (!supabase) return
    setMohapStatus('Running MOHAP ingestion...')

    const { data, error } = await supabase.functions.invoke('mohap-ingest', {
      method: 'POST',
    })

    if (error) {
      setMohapStatus(`Ingest failed: ${error.message}`)
      return
    }

    const snapshotId = data?.snapshotId ? ` Snapshot: ${data.snapshotId}` : ''
    setMohapStatus(`Ingest completed.${snapshotId}`)
  }

  return (
    <main className="app-shell">
      <h1>DM Twin</h1>
      <p className="subtitle">Research + patient + clinician + ingestion control panel.</p>

      <section className="card">
        <h2>Environment status</h2>
        <p>{hasSupabaseEnv ? 'Supabase keys detected in env.' : 'Supabase keys missing in env.'}</p>
        <p className="status">{status}</p>
        {session?.user ? (
          <div className="row">
            <p className="meta">Signed in as: {session.user.email}</p>
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <form className="row" onSubmit={handleSignIn}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
            <button type="submit">Send magic link</button>
          </form>
        )}
      </section>

      <section className="card">
        <h2>Research Dashboard</h2>
        <p className="status">{researchStatus}</p>
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
          <h2>Patient Onboarding</h2>
          <p className="status">{patientStatus}</p>
          <form className="stack" onSubmit={handlePatientSave}>
            <input
              placeholder="Display name"
              aria-label="Display name"
              value={profileForm.display_name}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, display_name: event.target.value }))
              }
            />
            <input
              placeholder="Birth year"
              aria-label="Birth year"
              value={profileForm.birth_year}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, birth_year: event.target.value }))
              }
            />
            <input
              placeholder="Sex"
              aria-label="Sex"
              value={profileForm.sex}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, sex: event.target.value }))}
            />
            <input
              placeholder="Diabetes type"
              aria-label="Diabetes type"
              value={profileForm.diabetes_type}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, diabetes_type: event.target.value }))
              }
            />
            <input
              type="date"
              aria-label="Diagnosis date"
              value={profileForm.diagnosis_date}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, diagnosis_date: event.target.value }))
              }
            />
            <button type="submit">Save patient profile</button>
          </form>
        </section>

        <section className="card">
          <h2>Clinician Patient List</h2>
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
        <h2>MOHAP Ingestion</h2>
        <p className="status">{mohapStatus}</p>
        <button type="button" onClick={handleRunMohapIngest}>
          Run MOHAP ingest now
        </button>
      </section>
    </main>
  )
}

export default App
