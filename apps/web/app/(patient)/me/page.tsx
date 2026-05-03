'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type DailyInput = {
  symptomBurden: number
  painScore: number
  fatigueScore: number
  medicationAdherence: number
  sleepHours: number
  activityMinutes: number
  systolicBP: number
  diastolicBP: number
  restingHR: number
  fastingGlucose: number
}

type LabMetric = {
  name: string
  latest: number
  previous: number
  unit: string
  target: string
}

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

type PatientScenario = {
  id: string
  name: string
  age: number
  condition: string
  location: 'At home' | 'Home with caregiver'
  input: DailyInput
  labs: LabMetric[]
  riskHistory: number[]
  doctorFeedback: string[]
  hiddenWarnings: string[]
}

const PATIENT_SCENARIOS: PatientScenario[] = [
  {
    id: 'DM-1021',
    name: 'Fatima A.',
    age: 58,
    condition: 'Type 2 diabetes + hypertension',
    location: 'At home',
    input: {
      symptomBurden: 3,
      painScore: 2,
      fatigueScore: 3,
      medicationAdherence: 92,
      sleepHours: 7.2,
      activityMinutes: 36,
      systolicBP: 128,
      diastolicBP: 82,
      restingHR: 72,
      fastingGlucose: 104,
    },
    labs: [
      { name: 'HbA1c', latest: 7.1, previous: 7.4, unit: '%', target: '< 8.0%' },
      { name: 'CRP', latest: 2.1, previous: 2.8, unit: 'mg/L', target: '< 3.0 mg/L' },
      { name: 'LDL-C', latest: 92, previous: 104, unit: 'mg/dL', target: '< 100 mg/dL' },
      { name: 'eGFR', latest: 88, previous: 86, unit: 'mL/min', target: '>= 60 mL/min' },
    ],
    riskHistory: [47, 42, 38],
    doctorFeedback: ['Maintain current antihypertensive plan and daily walking target.'],
    hiddenWarnings: [],
  },
  {
    id: 'DM-1187',
    name: 'Yousef M.',
    age: 64,
    condition: 'Heart failure + diabetes',
    location: 'At home',
    input: {
      symptomBurden: 7,
      painScore: 4,
      fatigueScore: 8,
      medicationAdherence: 76,
      sleepHours: 5.4,
      activityMinutes: 12,
      systolicBP: 154,
      diastolicBP: 96,
      restingHR: 94,
      fastingGlucose: 148,
    },
    labs: [
      { name: 'HbA1c', latest: 8.5, previous: 8.2, unit: '%', target: '< 8.0%' },
      { name: 'CRP', latest: 8.4, previous: 7.9, unit: 'mg/L', target: '< 3.0 mg/L' },
      { name: 'LDL-C', latest: 132, previous: 126, unit: 'mg/dL', target: '< 100 mg/dL' },
      { name: 'eGFR', latest: 68, previous: 71, unit: 'mL/min', target: '>= 60 mL/min' },
    ],
    riskHistory: [63, 70, 76],
    doctorFeedback: ['Consider medication reconciliation and fluid status review within 24h.'],
    hiddenWarnings: [
      'Nocturnal tachycardia episodes detected by wearable for 3 nights.',
      'Home BP cuff uploads are delayed by 36h despite symptom escalation.',
    ],
  },
  {
    id: 'DM-1274',
    name: 'Mariam K.',
    age: 52,
    condition: 'Autoimmune disease with inflammatory flares',
    location: 'Home with caregiver',
    input: {
      symptomBurden: 6,
      painScore: 6,
      fatigueScore: 6,
      medicationAdherence: 81,
      sleepHours: 6.1,
      activityMinutes: 22,
      systolicBP: 136,
      diastolicBP: 86,
      restingHR: 81,
      fastingGlucose: 112,
    },
    labs: [
      { name: 'HbA1c', latest: 6.8, previous: 6.9, unit: '%', target: '< 8.0%' },
      { name: 'CRP', latest: 6.2, previous: 5.0, unit: 'mg/L', target: '< 3.0 mg/L' },
      { name: 'LDL-C', latest: 108, previous: 110, unit: 'mg/dL', target: '< 100 mg/dL' },
      { name: 'eGFR', latest: 84, previous: 84, unit: 'mL/min', target: '>= 60 mL/min' },
    ],
    riskHistory: [58, 56, 59],
    doctorFeedback: ['Inflammatory marker trend suggests early flare despite stable vitals.'],
    hiddenWarnings: ['Reduced morning mobility reported by caregiver but not in patient symptom diary.'],
  },
  {
    id: 'DM-1312',
    name: 'Ahmed R.',
    age: 71,
    condition: 'CKD + hypertension',
    location: 'At home',
    input: {
      symptomBurden: 5,
      painScore: 3,
      fatigueScore: 5,
      medicationAdherence: 84,
      sleepHours: 6.7,
      activityMinutes: 20,
      systolicBP: 146,
      diastolicBP: 90,
      restingHR: 79,
      fastingGlucose: 118,
    },
    labs: [
      { name: 'HbA1c', latest: 7.3, previous: 7.3, unit: '%', target: '< 8.0%' },
      { name: 'CRP', latest: 4.2, previous: 4.3, unit: 'mg/L', target: '< 3.0 mg/L' },
      { name: 'LDL-C', latest: 101, previous: 109, unit: 'mg/dL', target: '< 100 mg/dL' },
      { name: 'eGFR', latest: 58, previous: 63, unit: 'mL/min', target: '>= 60 mL/min' },
    ],
    riskHistory: [60, 62, 64],
    doctorFeedback: ['Monitor renal function trend; adjust nephrotoxic exposure and hydration plan.'],
    hiddenWarnings: ['Weight gain of 1.8 kg in 48h from connected scale suggests fluid retention.'],
  },
  {
    id: 'DM-1405',
    name: 'Layla S.',
    age: 49,
    condition: 'Post-discharge metabolic syndrome follow-up',
    location: 'At home',
    input: {
      symptomBurden: 4,
      painScore: 3,
      fatigueScore: 4,
      medicationAdherence: 88,
      sleepHours: 7.0,
      activityMinutes: 28,
      systolicBP: 134,
      diastolicBP: 85,
      restingHR: 76,
      fastingGlucose: 121,
    },
    labs: [
      { name: 'HbA1c', latest: 7.6, previous: 8.0, unit: '%', target: '< 8.0%' },
      { name: 'CRP', latest: 3.6, previous: 4.4, unit: 'mg/L', target: '< 3.0 mg/L' },
      { name: 'LDL-C', latest: 98, previous: 118, unit: 'mg/dL', target: '< 100 mg/dL' },
      { name: 'eGFR', latest: 90, previous: 89, unit: 'mL/min', target: '>= 60 mL/min' },
    ],
    riskHistory: [61, 54, 48],
    doctorFeedback: ['Recovery trajectory is positive; continue remote coaching and weekly review.'],
    hiddenWarnings: [],
  },
]

const ENTRIES_STORAGE_KEY = 'dm-twin-manual-entries'
const SIGNAL_STREAMS = [
  {
    title: 'Glycemic signals',
    detail:
      'CGM/fingerstick/ketones. Watch CV above 36%, TIR drop greater than 10 points, and fasting trends over 7 days.',
  },
  {
    title: 'Behavioral signals',
    detail:
      'Meals, adherence, insulin timing, activity, sleep, alcohol, smoking. Engagement drop often predicts deterioration before glucose worsens.',
  },
  {
    title: 'Physiological signals',
    detail:
      'Weight, BP, RHR, HRV, temperature, foot photo, symptom checklist. Detect early infection and fluid overload patterns.',
  },
  {
    title: 'Subjective signals',
    detail:
      'Energy, mood, stress, distress screeners, and free-text/voice notes. Often the first warning before measurable decompensation.',
  },
]

const MODEL_LAYERS = [
  'Layer 1: Per-signal anomaly detection against each patient baseline (14-30 days).',
  'Layer 2: Multi-signal pattern recognition for infection, burnout, kidney risk, nocturnal hypo, and Ramadan risk.',
  'Layer 3: Transparent clinical safety rules as non-negotiable guardrails.',
]

const ALERT_TIERS = [
  'Self-care nudge: Patient only, non-interruptive.',
  'Care-team review: Clinician inbox within 24h.',
  'Urgent contact: Real-time clinician ping plus patient prompt.',
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function computeRiskScore(input: DailyInput, labs: LabMetric[]) {
  const hba1c = labs.find((l) => l.name === 'HbA1c')?.latest ?? 8
  const crp = labs.find((l) => l.name === 'CRP')?.latest ?? 5
  const ldl = labs.find((l) => l.name === 'LDL-C')?.latest ?? 120

  const bpRisk = clamp(((input.systolicBP - 120) / 35) * 20, 0, 20)
  const glucoseRisk = clamp(((input.fastingGlucose - 90) / 80) * 15, 0, 15)
  const inflammationRisk = clamp((crp / 10) * 15, 0, 15)
  const symptomRisk = clamp((input.symptomBurden / 10) * 15, 0, 15)
  const adherenceRisk = clamp(((100 - input.medicationAdherence) / 40) * 15, 0, 15)
  const activityRisk = clamp(((30 - input.activityMinutes) / 30) * 8, 0, 8)
  const sleepRisk = clamp(((7 - input.sleepHours) / 3) * 6, 0, 6)
  const hba1cRisk = clamp(((hba1c - 6.5) / 3.5) * 6, 0, 6)
  const ldlRisk = clamp(((ldl - 70) / 80) * 5, 0, 5)

  return Math.round(
    bpRisk +
      glucoseRisk +
      inflammationRisk +
      symptomRisk +
      adherenceRisk +
      activityRisk +
      sleepRisk +
      hba1cRisk +
      ldlRisk,
  )
}

function classifyTrend(current: number, previous: number) {
  if (current - previous >= 4) return 'worsening'
  if (previous - current >= 4) return 'improving'
  return 'stable'
}

function riskBand(score: number) {
  if (score >= 70) return { label: 'High', color: 'text-rose-300', ring: '#fb7185' }
  if (score >= 40) return { label: 'Moderate', color: 'text-amber-300', ring: '#fbbf24' }
  return { label: 'Low', color: 'text-emerald-300', ring: '#34d399' }
}

function TrendSparkline({ values }: { values: number[] }) {
  const w = 220
  const h = 64
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * (w - 10) + 5
      const y = h - ((v - min) / span) * (h - 12) - 6
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full rounded bg-zinc-900/60">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" className="text-cyan-300" />
      {values.map((v, i) => {
        const x = (i / (values.length - 1 || 1)) * (w - 10) + 5
        const y = h - ((v - min) / span) * (h - 12) - 6
        return <circle key={`${v}-${i}`} cx={x} cy={y} r="3.5" className="fill-zinc-950 stroke-cyan-300" />
      })}
    </svg>
  )
}

function ValueBar({
  value,
  max,
  tone,
}: {
  value: number
  max: number
  tone: 'good' | 'warn' | 'bad'
}) {
  return (
    <progress
      value={Math.min(value, max)}
      max={max}
      className={`h-2 w-full overflow-hidden rounded [&::-webkit-progress-bar]:bg-zinc-100 ${
        tone === 'good'
          ? '[&::-webkit-progress-value]:bg-emerald-500'
          : tone === 'warn'
            ? '[&::-webkit-progress-value]:bg-amber-500'
            : '[&::-webkit-progress-value]:bg-rose-500'
      }`}
    />
  )
}

function buildSOPs(input: DailyInput, labs: LabMetric[], currentRisk: number, hiddenWarnings: string[]) {
  const hba1c = labs.find((l) => l.name === 'HbA1c')?.latest ?? 8
  const crp = labs.find((l) => l.name === 'CRP')?.latest ?? 3
  const bpHigh = input.systolicBP >= 150 || input.diastolicBP >= 95

  return [
    {
      name: 'SOP-HTN-01: Hypertension escalation',
      active: bpHigh,
      priority: 'high',
      trigger: 'BP >= 150/95 on daily input',
      action: 'Notify clinician, check adherence, adjust antihypertensives within 24h.',
    },
    {
      name: 'SOP-DM-02: Glycemic optimization',
      active: hba1c >= 8 || input.fastingGlucose >= 140,
      priority: 'high',
      trigger: 'HbA1c >= 8.0% or fasting glucose >= 140 mg/dL',
      action: 'Activate diabetes education + medication review + nutrition consult.',
    },
    {
      name: 'SOP-INF-03: Inflammation flare pathway',
      active: crp > 5 || input.symptomBurden >= 7,
      priority: 'medium',
      trigger: 'CRP > 5 mg/L or symptom burden >= 7/10',
      action: 'Order repeat inflammatory panel and tele-visit in 48h.',
    },
    {
      name: 'SOP-RPM-04: Hidden-risk home monitoring',
      active: hiddenWarnings.length > 0,
      priority: 'high',
      trigger: 'At-home hidden warning detected',
      action: 'Escalate to remote monitoring nurse and inform primary doctor immediately.',
    },
    {
      name: 'SOP-PREV-05: Preventive follow-up',
      active: currentRisk < 45 && input.medicationAdherence >= 80,
      priority: 'low',
      trigger: 'Risk under control with good adherence',
      action: 'Continue weekly follow-up and preventive coaching.',
    },
  ]
}

export default function MePage() {
  const [selectedPatientId, setSelectedPatientId] = useState(PATIENT_SCENARIOS[0].id)
  const [inputByPatient, setInputByPatient] = useState<Record<string, DailyInput>>(
    Object.fromEntries(PATIENT_SCENARIOS.map((p) => [p.id, p.input])),
  )
  const [entryFeed, setEntryFeed] = useState<ManualEntry[]>([])

  useEffect(() => {
    function loadEntries() {
      if (typeof window === 'undefined') return
      const raw = window.localStorage.getItem(ENTRIES_STORAGE_KEY)
      if (!raw) {
        setEntryFeed([])
        return
      }
      try {
        setEntryFeed(JSON.parse(raw) as ManualEntry[])
      } catch {
        setEntryFeed([])
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === ENTRIES_STORAGE_KEY) {
        loadEntries()
      }
    }

    function handleSameTabUpdate() {
      loadEntries()
    }

    loadEntries()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dm-twin-entries-updated', handleSameTabUpdate)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dm-twin-entries-updated', handleSameTabUpdate)
    }
  }, [])

  const selectedPatient = useMemo(
    () => PATIENT_SCENARIOS.find((p) => p.id === selectedPatientId) ?? PATIENT_SCENARIOS[0],
    [selectedPatientId],
  )

  const input = inputByPatient[selectedPatient.id]
  const labs = selectedPatient.labs
  const currentRisk = useMemo(() => computeRiskScore(input, labs), [input, labs])
  const priorRisk = selectedPatient.riskHistory[selectedPatient.riskHistory.length - 1]
  const trend = classifyTrend(currentRisk, priorRisk)
  const risk = riskBand(currentRisk)
  const riskSeries = [...selectedPatient.riskHistory, currentRisk]
  const sopList = useMemo(
    () => buildSOPs(input, labs, currentRisk, selectedPatient.hiddenWarnings),
    [input, labs, currentRisk, selectedPatient.hiddenWarnings],
  )

  const eMeasures = useMemo(() => {
    return [
      {
        name: 'BP control (NQF-style)',
        status: input.systolicBP < 140 && input.diastolicBP < 90 ? 'On track' : 'Activated',
        rationale: 'Target < 140/90 mmHg for high-risk chronic care patients.',
      },
      {
        name: 'Glycemic control',
        status:
          (labs.find((l) => l.name === 'HbA1c')?.latest ?? 8.5) < 8 ? 'On track' : 'Activated',
        rationale: 'HbA1c threshold 8.0% used for safety-focused chronic management.',
      },
      {
        name: 'Medication adherence',
        status: input.medicationAdherence >= 80 ? 'On track' : 'Activated',
        rationale: 'PDC-style adherence trigger at < 80%.',
      },
      {
        name: 'Inflammation surveillance',
        status: (labs.find((l) => l.name === 'CRP')?.latest ?? 4) < 3 ? 'On track' : 'Activated',
        rationale: 'CRP > 3 mg/L flags elevated inflammatory burden.',
      },
    ]
  }, [input, labs])

  const notifications = useMemo(() => {
    const queue: { title: string; severity: 'low' | 'medium' | 'high' }[] = []
    if (trend === 'worsening') {
      queue.push({ title: 'Patient risk trajectory worsened vs prior 24h', severity: 'high' })
    }
    if (input.systolicBP >= 150 || input.diastolicBP >= 95) {
      queue.push({ title: 'BP out of target range; medication review recommended', severity: 'high' })
    }
    if (input.medicationAdherence < 80) {
      queue.push({ title: 'Adherence below 80%; trigger outreach protocol', severity: 'medium' })
    }
    if ((labs.find((l) => l.name === 'CRP')?.latest ?? 0) > 5) {
      queue.push({ title: 'CRP remains elevated; review anti-inflammatory plan', severity: 'medium' })
    }
    selectedPatient.hiddenWarnings.forEach((warning) => {
      queue.push({ title: `Hidden warning: ${warning}`, severity: 'high' })
    })
    if (queue.length === 0) {
      queue.push({ title: 'No urgent escalation; continue routine monitoring', severity: 'low' })
    }
    return queue
  }, [input, labs, selectedPatient.hiddenWarnings, trend])

  const allPatientsDashboard = useMemo(() => {
    return PATIENT_SCENARIOS.map((patient) => {
      const patientInput = inputByPatient[patient.id]
      const patientRisk = computeRiskScore(patientInput, patient.labs)
      const prev = patient.riskHistory[patient.riskHistory.length - 1]
      const delta = patientRisk - prev
      const patientSops = buildSOPs(patientInput, patient.labs, patientRisk, patient.hiddenWarnings)
      const activeSops = patientSops.filter((s) => s.active).length
      return {
        id: patient.id,
        name: patient.name,
        risk: patientRisk,
        delta,
        hiddenWarnings: patient.hiddenWarnings.length,
        activeSops,
        location: patient.location,
      }
    })
  }, [inputByPatient])
  const selectedPatientEntries = useMemo(
    () =>
      entryFeed
        .filter((entry) => entry.patientId === selectedPatient.id)
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [entryFeed, selectedPatient.id],
  )

  return (
    <section className="space-y-4 rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_40%),linear-gradient(to_bottom,_#020617,_#111827)] p-4 text-zinc-100 md:p-6">
      <div className="rounded-2xl border border-cyan-400/20 bg-zinc-950/65 p-6 shadow-[0_0_40px_rgba(6,182,212,0.12)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-100">Patient twin command center</h1>
          <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
            Futuristic clinical twin mode
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-300">
          Five scenario records with selectable daily inputs, hidden at-home warnings, and SOP activation
          according to each case.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PATIENT_SCENARIOS.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => setSelectedPatientId(patient.id)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                selectedPatient.id === patient.id
                  ? 'border-cyan-300 bg-cyan-300/20 text-cyan-100'
                  : 'border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-cyan-400/40'
              }`}
            >
              {patient.id} - {patient.name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Selected case: {selectedPatient.name}, {selectedPatient.age}, {selectedPatient.condition} ({' '}
          {selectedPatient.location} )
        </p>
        <div className="mt-4">
          <Link
            href="/me/entry"
            className="inline-flex rounded-full border border-cyan-300/50 bg-cyan-400/15 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/25"
          >
            Open blank entry page
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-400/25 bg-zinc-950/70 p-5 shadow-[0_0_30px_rgba(99,102,241,0.12)]">
        <h2 className="text-lg font-semibold text-indigo-100">Live entry feed (from blank entry page)</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Entries added in the blank entry page are shown here simultaneously for dashboard awareness.
        </p>
        <div className="mt-3 space-y-2 text-sm">
          {selectedPatientEntries.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-700 p-3 text-zinc-400">
              No manual entries yet for this patient.
            </div>
          ) : (
            selectedPatientEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded border border-zinc-700/80 bg-zinc-900/80 p-3">
                <p className="text-xs text-zinc-400">{new Date(entry.timestamp).toLocaleString()}</p>
                <p className="mt-1">
                  <span className="font-medium">Note:</span> {entry.note || '-'}
                </p>
                <p>
                  <span className="font-medium">Concern:</span> {entry.clinicianConcern || '-'}
                </p>
                <p>
                  <span className="font-medium">Home observation:</span> {entry.homeObservation || '-'}
                </p>
                <p>
                  <span className="font-medium">Custom metric:</span>{' '}
                  {entry.customMetricName ? `${entry.customMetricName}: ${entry.customMetricValue || '-'}` : '-'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/20 bg-zinc-950/65 p-5 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <h2 className="text-lg font-semibold text-cyan-100">Clinical intelligence blueprint</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Excellent clinical question: daily patient inputs are what make a twin different from a CGM viewer.
          The twin fuses four signal streams to detect deterioration 5 to 14 days earlier than routine care.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SIGNAL_STREAMS.map((stream) => (
            <div key={stream.title} className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3">
              <p className="text-sm font-semibold text-cyan-200">{stream.title}</p>
              <p className="mt-1 text-xs text-zinc-300">{stream.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3">
            <p className="text-sm font-semibold text-indigo-200">AI decision stack</p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
              {MODEL_LAYERS.map((layer) => (
                <li key={layer}>- {layer}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3">
            <p className="text-sm font-semibold text-indigo-200">Three-tier alerting only</p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
              {ALERT_TIERS.map((tier) => (
                <li key={tier}>- {tier}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Current risk score</p>
          <div className="mt-3 flex items-center gap-4">
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r="30" stroke="#334155" strokeWidth="10" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke={risk.ring}
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={188.5}
                strokeDashoffset={188.5 - (188.5 * currentRisk) / 100}
              />
              <text
                x="40"
                y="45"
                textAnchor="middle"
                className="rotate-90 origin-center fill-cyan-100 text-[14px] font-bold"
              >
                {currentRisk}
              </text>
            </svg>
            <div>
              <p className={`text-sm font-semibold ${risk.color}`}>{risk.label} risk band</p>
              <p className="text-sm text-zinc-400">Previous: {priorRisk}/100</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Trend classification</p>
          <p className="mt-1 text-2xl font-semibold capitalize">{trend}</p>
          <p className="mt-1 text-sm text-zinc-400">Delta vs prior day: {currentRisk - priorRisk}</p>
          <div className="mt-3">
            <TrendSparkline values={riskSeries} />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Active notifications</p>
          <p className="mt-1 text-3xl font-semibold">{notifications.length}</p>
          <p className="mt-1 text-sm text-zinc-400">Escalation-ready care team queue</p>
          <div className="mt-3 space-y-1 text-xs text-zinc-400">
            <div className="flex items-center justify-between">
              <span>High</span>
              <span>{notifications.filter((n) => n.severity === 'high').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Medium</span>
              <span>{notifications.filter((n) => n.severity === 'medium').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Low</span>
              <span>{notifications.filter((n) => n.severity === 'low').length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Daily patient inputs</h2>
          <p className="mb-4 mt-1 text-sm text-zinc-400">
            Enter today&apos;s measures to update predictions in real time.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['symptomBurden', 'Symptom burden (0-10)', 0, 10, 1],
              ['painScore', 'Pain score (0-10)', 0, 10, 1],
              ['fatigueScore', 'Fatigue score (0-10)', 0, 10, 1],
              ['medicationAdherence', 'Medication adherence (%)', 0, 100, 1],
              ['sleepHours', 'Sleep (hours)', 0, 12, 0.1],
              ['activityMinutes', 'Activity (min/day)', 0, 120, 1],
              ['systolicBP', 'Systolic BP (mmHg)', 90, 220, 1],
              ['diastolicBP', 'Diastolic BP (mmHg)', 50, 140, 1],
              ['restingHR', 'Resting HR (bpm)', 40, 160, 1],
              ['fastingGlucose', 'Fasting glucose (mg/dL)', 60, 300, 1],
            ].map(([key, label, min, max, step]) => (
              <label key={key} className="grid gap-1">
                <span className="text-xs text-zinc-400">{label}</span>
                <input
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
                  type="number"
                  min={Number(min)}
                  max={Number(max)}
                  step={Number(step)}
                  value={input[key as keyof DailyInput]}
                  onChange={(e) =>
                    setInputByPatient((prev) => ({
                      ...prev,
                      [selectedPatient.id]: {
                        ...prev[selectedPatient.id],
                        [key]: Number(e.target.value),
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Lab evidence panel</h2>
            <div className="mt-3 space-y-2 text-sm">
              {labs.map((lab) => {
                const delta = Number((lab.latest - lab.previous).toFixed(1))
                const improving =
                  (lab.name === 'CRP' || lab.name === 'LDL-C' || lab.name === 'HbA1c') ? delta < 0 : delta >= 0
              const absoluteDelta = Math.abs(delta)
                return (
                  <div key={lab.name} className="rounded border border-zinc-700 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{lab.name}</p>
                      <p className={`text-xs ${improving ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {improving ? 'Improving' : 'Needs review'}
                      </p>
                    </div>
                    <p className="text-zinc-300">
                      Latest: {lab.latest} {lab.unit} | Previous: {lab.previous} {lab.unit} | Target: {lab.target}
                    </p>
                  <div className="mt-2">
                    <ValueBar value={absoluteDelta} max={5} tone={improving ? 'good' : 'bad'} />
                  </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Doctor feedback</h2>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              {selectedPatient.doctorFeedback.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Activated eMeasures</h2>
          <div className="mt-3 space-y-2 text-sm">
            {eMeasures.map((measure) => (
              <div key={measure.name} className="rounded border border-zinc-700 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{measure.name}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      measure.status === 'Activated'
                        ? 'bg-amber-300/20 text-amber-200'
                        : 'bg-emerald-300/20 text-emerald-200'
                    }`}
                  >
                    {measure.status}
                  </span>
                </div>
                <p className="mt-1 text-zinc-300">{measure.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Care-team notification queue</h2>
          <div className="mt-3 space-y-2 text-sm">
            {notifications.map((item) => (
              <div
                key={item.title}
                className={`rounded border p-3 ${
                  item.severity === 'high'
                    ? 'border-rose-200 bg-rose-50'
                    : item.severity === 'medium'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p>{item.title}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      item.severity === 'high'
                        ? 'bg-rose-300/20 text-rose-200'
                        : item.severity === 'medium'
                          ? 'bg-amber-300/20 text-amber-200'
                          : 'bg-emerald-300/20 text-emerald-200'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">SOP activation for selected case</h2>
        <div className="mt-3 space-y-2 text-sm">
          {sopList.map((sop) => (
            <div
              key={sop.name}
              className={`rounded border p-3 ${
                sop.active
                  ? sop.priority === 'high'
                    ? 'border-rose-200 bg-rose-50'
                    : sop.priority === 'medium'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-emerald-200 bg-emerald-50'
                  : 'border-zinc-700 bg-zinc-900/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{sop.name}</p>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">
                  {sop.active ? 'Activated' : 'Standby'}
                </span>
              </div>
              <p className="mt-1 text-zinc-300">Trigger: {sop.trigger}</p>
              <p className="text-zinc-300">Action: {sop.action}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedPatient.hiddenWarnings.length > 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-900">
            Hidden warnings doctors need to know (even at home)
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-rose-900">
            {selectedPatient.hiddenWarnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">All-patients command dashboard</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Scenario-wide triage with SOP counts and hidden warning signals.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="py-2">Patient ID</th>
                <th className="py-2">Name</th>
                <th className="py-2">Location</th>
                <th className="py-2">Risk</th>
                <th className="py-2">Risk delta (24h)</th>
                <th className="py-2">Hidden warnings</th>
                <th className="py-2">Active SOPs</th>
              </tr>
            </thead>
            <tbody>
              {allPatientsDashboard.map((row) => (
                <tr key={row.id} className="border-b border-zinc-800">
                  <td className="py-2 font-medium">{row.id}</td>
                  <td className="py-2">{row.name}</td>
                  <td className="py-2">{row.location}</td>
                  <td className="py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        row.risk >= 70
                          ? 'bg-rose-300/20 text-rose-200'
                          : row.risk >= 40
                            ? 'bg-amber-300/20 text-amber-200'
                            : 'bg-emerald-300/20 text-emerald-200'
                      }`}
                    >
                      {row.risk}/100
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8">{row.delta > 0 ? `+${row.delta}` : row.delta}</span>
                      <div className="w-24">
                        <ValueBar
                          value={Math.abs(row.delta)}
                          max={10}
                          tone={row.delta <= -2 ? 'good' : row.delta >= 4 ? 'bad' : 'warn'}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-center">{row.hiddenWarnings}</td>
                  <td className="py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        row.activeSops >= 3
                          ? 'bg-rose-300/20 text-rose-200'
                          : row.activeSops >= 2
                            ? 'bg-amber-300/20 text-amber-200'
                            : row.activeSops >= 1
                            ? 'bg-emerald-300/20 text-emerald-200'
                            : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {row.activeSops} activated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Clinical evidence logic in this prototype uses guideline-like thresholds (BP, HbA1c, CRP, LDL,
        adherence). It supports decision awareness and triage, not standalone medical diagnosis.
      </p>
    </section>
  )
}
