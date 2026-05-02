import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { PatientProfileForm } from '../types'

const CURRENT_YEAR = new Date().getFullYear()

export function MePage() {
  const { session } = useAuth()
  const [status, setStatus] = useState('Loading profile...')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PatientProfileForm>({
    display_name: '',
    birth_year: '',
    sex: '',
    diabetes_type: '',
    diagnosis_date: '',
  })

  useEffect(() => {
    async function loadProfile() {
      if (!supabase || !session?.user?.id) return

      const { data, error } = await supabase
        .schema('clinical')
        .from('patient_profile')
        .select('display_name, birth_year, sex, diabetes_type, diagnosis_date')
        .eq('patient_id', session.user.id)
        .maybeSingle()

      if (error) {
        setStatus(`Unable to load profile: ${error.message}`)
        return
      }

      if (!data) {
        setStatus('No profile yet. Complete your onboarding form.')
        return
      }

      setForm({
        display_name: data.display_name ?? '',
        birth_year: data.birth_year ? String(data.birth_year) : '',
        sex: data.sex ?? '',
        diabetes_type: data.diabetes_type ?? '',
        diagnosis_date: data.diagnosis_date ?? '',
      })
      setStatus('Profile loaded.')
    }

    void loadProfile()
  }, [session?.user?.id])

  const canSubmit = useMemo(
    () =>
      Boolean(form.display_name.trim() && form.birth_year.trim() && form.sex && form.diabetes_type && !saving),
    [form, saving],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !session?.user?.id) return
    const birthYear = Number(form.birth_year)
    if (!birthYear || birthYear < 1900 || birthYear > CURRENT_YEAR) {
      setStatus(`Birth year must be between 1900 and ${CURRENT_YEAR}.`)
      return
    }

    setSaving(true)
    setStatus('Saving profile...')

    const { error } = await supabase
      .schema('clinical')
      .from('patient_profile')
      .upsert(
        {
          patient_id: session.user.id,
          display_name: form.display_name,
          birth_year: birthYear,
          sex: form.sex,
          diabetes_type: form.diabetes_type,
          diagnosis_date: form.diagnosis_date || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'patient_id' },
      )

    if (error) {
      setStatus(`Save failed: ${error.message}`)
      setSaving(false)
      return
    }

    setStatus('Profile saved.')
    setSaving(false)
  }

  return (
    <section className="card">
      <h2>My Profile</h2>
      <p className="status">{status}</p>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            autoComplete="name"
            value={form.display_name}
            onChange={(event) => setForm((prev) => ({ ...prev, display_name: event.target.value }))}
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
            value={form.birth_year}
            onChange={(event) => setForm((prev) => ({ ...prev, birth_year: event.target.value }))}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="sex">Sex</label>
          <select
            id="sex"
            value={form.sex}
            onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value }))}
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
            value={form.diabetes_type}
            onChange={(event) => setForm((prev) => ({ ...prev, diabetes_type: event.target.value }))}
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
            value={form.diagnosis_date}
            onChange={(event) => setForm((prev) => ({ ...prev, diagnosis_date: event.target.value }))}
          />
        </div>

        <button type="submit" disabled={!canSubmit}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </section>
  )
}
