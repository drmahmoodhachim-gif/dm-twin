'use client'

import { useState } from 'react'
import Link from 'next/link'

type ManualEntry = {
  id: string
  patientId: string
  timestamp: string
  note: string
  clinicianConcern: string
  homeObservation: string
  customMetricName: string
  customMetricValue: string
}

const ENTRIES_STORAGE_KEY = 'dm-twin-manual-entries'
const PATIENT_IDS = ['DM-1021', 'DM-1187', 'DM-1274', 'DM-1312', 'DM-1405']

export default function PatientEntryPage() {
  const [patientId, setPatientId] = useState(PATIENT_IDS[0])
  const [note, setNote] = useState('')
  const [clinicianConcern, setClinicianConcern] = useState('')
  const [homeObservation, setHomeObservation] = useState('')
  const [customMetricName, setCustomMetricName] = useState('')
  const [customMetricValue, setCustomMetricValue] = useState('')
  const [status, setStatus] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const entry: ManualEntry = {
      id: `${patientId}-${Date.now()}`,
      patientId,
      timestamp: new Date().toISOString(),
      note,
      clinicianConcern,
      homeObservation,
      customMetricName,
      customMetricValue,
    }

    const raw = window.localStorage.getItem(ENTRIES_STORAGE_KEY)
    const existing = raw ? (JSON.parse(raw) as ManualEntry[]) : []
    const next = [entry, ...existing]
    window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('dm-twin-entries-updated'))

    setStatus('Entry saved and broadcast to dashboard feed.')
    setNote('')
    setClinicianConcern('')
    setHomeObservation('')
    setCustomMetricName('')
    setCustomMetricValue('')
  }

  return (
    <section className="space-y-4 rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(to_bottom,_#020617,_#111827)] p-4 text-zinc-100 md:p-6">
      <div className="rounded-2xl border border-cyan-400/25 bg-zinc-950/70 p-6 shadow-[0_0_35px_rgba(34,211,238,0.14)]">
        <h1 className="text-2xl font-semibold text-cyan-100">Blank entry page</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Add manual at-home observations and clinician concerns. This entry appears simultaneously in the
          main dashboard feed.
        </p>
        <Link
          href="/me"
          className="mt-4 inline-flex rounded-full border border-cyan-300/50 bg-cyan-400/15 px-3 py-1.5 text-sm text-cyan-100"
        >
          Back to dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-zinc-400">Patient ID</span>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-100"
            >
              {PATIENT_IDS.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-xs text-zinc-400">Clinician concern (short)</span>
            <input
              value={clinicianConcern}
              onChange={(e) => setClinicianConcern(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-100"
              placeholder="e.g., Possible deterioration despite stable vitals"
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-zinc-400">Home observation</span>
            <textarea
              value={homeObservation}
              onChange={(e) => setHomeObservation(e.target.value)}
              className="min-h-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-100"
              placeholder="Free-text home/caregiver observation"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-xs text-zinc-400">Clinical note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-100"
              placeholder="Blank note entry"
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-zinc-400">Custom metric name</span>
            <input
              value={customMetricName}
              onChange={(e) => setCustomMetricName(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-100"
              placeholder="e.g., morning_weight_kg"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-zinc-400">Custom metric value</span>
            <input
              value={customMetricValue}
              onChange={(e) => setCustomMetricValue(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-100"
              placeholder="e.g., 84.6"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm text-cyan-100"
          >
            Save entry
          </button>
          {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
        </div>
      </form>

      <div className="rounded-2xl border border-indigo-400/25 bg-zinc-950/75 p-6 shadow-[0_0_30px_rgba(99,102,241,0.12)]">
        <h2 className="text-lg font-semibold text-indigo-100">Excellent clinical question</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Daily patient inputs are what make a twin different from a CGM viewer. Prioritize four streams:
          glycemic, behavioral, physiological, and subjective signals.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3 text-xs text-zinc-300">
            <p className="font-semibold text-cyan-200">High-impact daily captures</p>
            <ul className="mt-2 space-y-1">
              <li>- Medication adherence one-tap</li>
              <li>- Steps and active minutes</li>
              <li>- Sleep hours and quality</li>
              <li>- Energy, mood, stress sliders</li>
              <li>- Symptom check and optional voice note</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3 text-xs text-zinc-300">
            <p className="font-semibold text-cyan-200">How to wire model + alerting</p>
            <ul className="mt-2 space-y-1">
              <li>- Layer 1: Personal-baseline anomaly detection</li>
              <li>- Layer 2: Multi-signal pattern scoring</li>
              <li>- Layer 3: Hard safety rules and escalation</li>
              <li>- Alert tiers: nudge, care-team review, urgent</li>
              <li>- Keep daily check-in under 60 seconds</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
