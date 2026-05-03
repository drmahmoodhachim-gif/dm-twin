'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type DailyMonitoringLog = {
  id: string
  patientId: string
  date: string
  checkinComplete: boolean
  medicationLogged: boolean
  symptomsLogged: boolean
  activityLogged: boolean
  note: string
  createdAt: string
}

type InterpretationResponse = {
  interpretation: string
  liveClaude: boolean
}

const PATIENT_IDS = ['DM-1021', 'DM-1187', 'DM-1274', 'DM-1312', 'DM-1405']
const DAILY_LOGS_KEY = 'dm-twin-daily-monitoring-logs'

export default function PatientOpeningPage() {
  const [patientId, setPatientId] = useState(PATIENT_IDS[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [checkinComplete, setCheckinComplete] = useState(true)
  const [medicationLogged, setMedicationLogged] = useState(true)
  const [symptomsLogged, setSymptomsLogged] = useState(false)
  const [activityLogged, setActivityLogged] = useState(false)
  const [note, setNote] = useState('')
  const [logs, setLogs] = useState<DailyMonitoringLog[]>([])
  const [status, setStatus] = useState('')
  const [interpretInput, setInterpretInput] = useState(
    'Patient reports higher fatigue and lower steps over 4 days with fasting glucose creeping up.',
  )
  const [interpretation, setInterpretation] = useState('')
  const [isInterpreting, setIsInterpreting] = useState(false)
  const [liveClaude, setLiveClaude] = useState(false)

  useEffect(() => {
    const raw = window.localStorage.getItem(DAILY_LOGS_KEY)
    if (!raw) return
    try {
      setLogs(JSON.parse(raw) as DailyMonitoringLog[])
    } catch {
      setLogs([])
    }
  }, [])

  function persist(next: DailyMonitoringLog[]) {
    setLogs(next)
    window.localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(next))
  }

  function saveDailyLog() {
    const item: DailyMonitoringLog = {
      id: `${patientId}-${date}-${Date.now()}`,
      patientId,
      date,
      checkinComplete,
      medicationLogged,
      symptomsLogged,
      activityLogged,
      note,
      createdAt: new Date().toISOString(),
    }
    persist([item, ...logs])
    setStatus('Daily monitoring entry saved.')
    setNote('')
  }

  async function runInterpretation() {
    try {
      setIsInterpreting(true)
      setInterpretation('')
      const response = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, context: interpretInput }),
      })
      if (!response.ok) throw new Error('Interpretation failed')
      const data = (await response.json()) as InterpretationResponse
      setInterpretation(data.interpretation)
      setLiveClaude(data.liveClaude)
    } catch {
      setInterpretation('Interpretation unavailable. Please try again.')
      setLiveClaude(false)
    } finally {
      setIsInterpreting(false)
    }
  }

  const filteredLogs = useMemo(() => logs.filter((item) => item.patientId === patientId), [logs, patientId])
  const completionRate = useMemo(() => {
    if (filteredLogs.length === 0) return 0
    const completed = filteredLogs.filter(
      (item) => item.checkinComplete && item.medicationLogged && item.symptomsLogged && item.activityLogged,
    ).length
    return Math.round((completed / filteredLogs.length) * 100)
  }, [filteredLogs])

  return (
    <section className="space-y-4 rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.14),_transparent_35%),linear-gradient(to_bottom,_#020617,_#111827)] p-4 text-zinc-100 md:p-6">
      <div className="rounded-2xl border border-cyan-400/25 bg-zinc-950/70 p-6 shadow-[0_0_35px_rgba(34,211,238,0.14)]">
        <h1 className="text-2xl font-semibold text-cyan-100">Welcome to your DM Twin flow</h1>
        <p className="mt-2 text-sm text-zinc-300">
          This opening page explains how the system works, your role, daily data feeding, and what results to
          expect from monitoring.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            href="/me"
            className="rounded-full border border-cyan-300/50 bg-cyan-400/15 px-3 py-1.5 text-cyan-100"
          >
            Open dashboard
          </Link>
          <Link href="/me/entry" className="rounded-full border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-zinc-200">
            Open entry page
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/70 p-5">
          <h2 className="text-lg font-semibold text-indigo-100">Your role</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>- Log daily check-ins in under 60 seconds.</li>
            <li>- Add symptom/context notes in the entry page.</li>
            <li>- Confirm medication and activity daily.</li>
            <li>- Watch trend cards and respond to nudges quickly.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/70 p-5">
          <h2 className="text-lg font-semibold text-indigo-100">Care team role</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>- Review composite risk and hidden warnings.</li>
            <li>- Act on SOP activations and alert tier escalations.</li>
            <li>- Provide fast outreach before routine-visit deterioration.</li>
            <li>- Use feedback outcomes to improve monitoring precision.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/25 bg-zinc-950/70 p-5">
        <h2 className="text-lg font-semibold text-cyan-100">Action flow schema</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Daily flow from patient input to clinical action. This is the expected loop each day.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            '1) Patient logs daily inputs',
            '2) Twin fuses signals and detects patterns',
            '3) Alerts tiered: nudge, review, urgent',
            '4) Team acts and updates plan',
          ].map((step, idx) => (
            <div key={step} className="relative rounded-xl border border-zinc-700 bg-zinc-900/80 p-3 text-xs">
              <span className="absolute -right-2 -top-2 h-3 w-3 animate-pulse rounded-full bg-cyan-300" />
              <p className="text-zinc-100">{step}</p>
              {idx < 3 ? <p className="mt-2 text-cyan-300">{'\u2192'}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/70 p-5">
          <h2 className="text-lg font-semibold text-indigo-100">Daily additions (savable per patient)</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <label className="grid gap-1">
              <span className="text-xs text-zinc-400">Patient</span>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2"
              >
                {PATIENT_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-zinc-400">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-zinc-300">
              <input type="checkbox" checked={checkinComplete} onChange={(e) => setCheckinComplete(e.target.checked)} />
              Daily check-in completed
            </label>
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={medicationLogged}
                onChange={(e) => setMedicationLogged(e.target.checked)}
              />
              Medication adherence logged
            </label>
            <label className="flex items-center gap-2 text-zinc-300">
              <input type="checkbox" checked={symptomsLogged} onChange={(e) => setSymptomsLogged(e.target.checked)} />
              Symptoms logged
            </label>
            <label className="flex items-center gap-2 text-zinc-300">
              <input type="checkbox" checked={activityLogged} onChange={(e) => setActivityLogged(e.target.checked)} />
              Activity logged
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-2"
              placeholder="Daily observation note"
            />
            <button
              type="button"
              onClick={saveDailyLog}
              className="rounded-full border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-cyan-100"
            >
              Save daily monitoring
            </button>
            {status ? <p className="text-xs text-emerald-300">{status}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/70 p-5">
          <h2 className="text-lg font-semibold text-indigo-100">Daily monitoring history</h2>
          <p className="mt-1 text-sm text-zinc-300">
            {patientId} completion rate: <span className="font-semibold text-cyan-200">{completionRate}%</span>
          </p>
          <div className="mt-3 space-y-2 text-xs">
            {filteredLogs.length === 0 ? (
              <div className="rounded border border-dashed border-zinc-700 p-3 text-zinc-400">
                No saved daily logs for this patient yet.
              </div>
            ) : (
              filteredLogs.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-zinc-700 bg-zinc-900/70 p-3 text-zinc-300">
                  <p className="font-medium text-zinc-100">{item.date}</p>
                  <p>
                    check-in:{' '}
                    <span className={item.checkinComplete ? 'text-emerald-300' : 'text-amber-300'}>
                      {item.checkinComplete ? 'yes' : 'no'}
                    </span>{' '}
                    | meds:{' '}
                    <span className={item.medicationLogged ? 'text-emerald-300' : 'text-amber-300'}>
                      {item.medicationLogged ? 'yes' : 'no'}
                    </span>{' '}
                    | symptoms:{' '}
                    <span className={item.symptomsLogged ? 'text-emerald-300' : 'text-amber-300'}>
                      {item.symptomsLogged ? 'yes' : 'no'}
                    </span>{' '}
                    | activity:{' '}
                    <span className={item.activityLogged ? 'text-emerald-300' : 'text-amber-300'}>
                      {item.activityLogged ? 'yes' : 'no'}
                    </span>
                  </p>
                  {item.note ? <p className="mt-1 text-zinc-400">{item.note}</p> : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/25 bg-zinc-950/70 p-5">
        <h2 className="text-lg font-semibold text-cyan-100">Claude interpretation assistant</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Real Claude can be activated by setting <code>ANTHROPIC_API_KEY</code>. Without key, the system uses a
          safe local fallback summary.
        </p>
        <textarea
          value={interpretInput}
          onChange={(e) => setInterpretInput(e.target.value)}
          aria-label="Clinical context for interpretation"
          placeholder="Enter daily context for interpretation"
          className="mt-3 min-h-24 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={runInterpretation}
            disabled={isInterpreting}
            className="rounded-full border border-indigo-300/50 bg-indigo-400/15 px-4 py-2 text-sm text-indigo-100 disabled:opacity-60"
          >
            {isInterpreting ? 'Interpreting...' : 'Interpret results'}
          </button>
          <span className={`text-xs ${liveClaude ? 'text-emerald-300' : 'text-amber-300'}`}>
            {liveClaude ? 'Live Claude active' : 'Fallback mode'}
          </span>
        </div>
        {interpretation ? (
          <div className="mt-3 rounded border border-zinc-700 bg-zinc-900/70 p-3 text-sm text-zinc-200">
            {interpretation}
          </div>
        ) : null}
      </div>
    </section>
  )
}
