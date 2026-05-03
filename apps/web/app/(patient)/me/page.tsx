'use client'

import { useMemo, useState } from 'react'

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

const baselineInput: DailyInput = {
  symptomBurden: 6,
  painScore: 5,
  fatigueScore: 6,
  medicationAdherence: 72,
  sleepHours: 5.8,
  activityMinutes: 18,
  systolicBP: 148,
  diastolicBP: 92,
  restingHR: 89,
  fastingGlucose: 132,
}

const baselineLabs: LabMetric[] = [
  { name: 'HbA1c', latest: 8.1, previous: 8.4, unit: '%', target: '< 8.0%' },
  { name: 'CRP', latest: 7.2, previous: 9.1, unit: 'mg/L', target: '< 3.0 mg/L' },
  { name: 'LDL-C', latest: 124, previous: 136, unit: 'mg/dL', target: '< 100 mg/dL' },
  { name: 'eGFR', latest: 76, previous: 78, unit: 'mL/min', target: '>= 60 mL/min' },
]

const last3DayRisk = [71, 68, 66]

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

export default function MePage() {
  const [input, setInput] = useState<DailyInput>(baselineInput)
  const [labs] = useState<LabMetric[]>(baselineLabs)

  const currentRisk = useMemo(() => computeRiskScore(input, labs), [input, labs])
  const priorRisk = last3DayRisk[last3DayRisk.length - 1]
  const trend = classifyTrend(currentRisk, priorRisk)

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
    if (queue.length === 0) {
      queue.push({ title: 'No urgent escalation; continue routine monitoring', severity: 'low' })
    }
    return queue
  }, [input, labs, trend])

  const cohortStatus = [
    { patient: 'DM-1021', delta: -6, status: 'Improving' },
    { patient: 'DM-1187', delta: -2, status: 'Stable improving' },
    { patient: 'DM-1274', delta: 0, status: 'Stable' },
    { patient: 'DM-1312', delta: 5, status: 'Worsening' },
    { patient: 'DM-1405', delta: 8, status: 'Worsening high risk' },
  ]

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Patient twin clinical dashboard</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Daily measures, lab evidence, and rule-based risk prediction to activate eMeasures and notify
          care teams about improving or worsening trajectories.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Current risk score</p>
          <p className="mt-1 text-3xl font-semibold">{currentRisk}/100</p>
          <p className="mt-1 text-sm text-zinc-600">Previous: {priorRisk}/100</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Trend classification</p>
          <p className="mt-1 text-2xl font-semibold capitalize">{trend}</p>
          <p className="mt-1 text-sm text-zinc-600">Delta vs prior day: {currentRisk - priorRisk}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Active notifications</p>
          <p className="mt-1 text-3xl font-semibold">{notifications.length}</p>
          <p className="mt-1 text-sm text-zinc-600">Escalation-ready care team queue</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Daily patient inputs</h2>
          <p className="mb-4 mt-1 text-sm text-zinc-600">
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
                <span className="text-xs text-zinc-600">{label}</span>
                <input
                  className="rounded border border-black/20 px-2 py-1"
                  type="number"
                  min={Number(min)}
                  max={Number(max)}
                  step={Number(step)}
                  value={input[key as keyof DailyInput]}
                  onChange={(e) =>
                    setInput((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Lab evidence panel</h2>
            <div className="mt-3 space-y-2 text-sm">
              {labs.map((lab) => {
                const delta = Number((lab.latest - lab.previous).toFixed(1))
                const improving =
                  (lab.name === 'CRP' || lab.name === 'LDL-C' || lab.name === 'HbA1c') ? delta < 0 : delta >= 0
                return (
                  <div key={lab.name} className="rounded border border-black/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{lab.name}</p>
                      <p className={`text-xs ${improving ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {improving ? 'Improving' : 'Needs review'}
                      </p>
                    </div>
                    <p className="text-zinc-700">
                      Latest: {lab.latest} {lab.unit} | Previous: {lab.previous} {lab.unit} | Target: {lab.target}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Doctor feedback</h2>
            <ul className="mt-2 space-y-2 text-sm text-zinc-700">
              <li>Cardiology: Intensify BP control if home BP {'>'} 140/90 for 3 days.</li>
              <li>Endocrinology: Keep HbA1c target under 8.0% with adherence support.</li>
              <li>Internal medicine: Escalate if CRP trend rises with symptom burden.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Activated eMeasures</h2>
          <div className="mt-3 space-y-2 text-sm">
            {eMeasures.map((measure) => (
              <div key={measure.name} className="rounded border border-black/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{measure.name}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      measure.status === 'Activated'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {measure.status}
                  </span>
                </div>
                <p className="mt-1 text-zinc-700">{measure.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Care-team notification queue</h2>
          <div className="mt-3 space-y-2 text-sm">
            {notifications.map((item) => (
              <div key={item.title} className="rounded border border-black/10 p-3">
                <div className="flex items-center justify-between">
                  <p>{item.title}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      item.severity === 'high'
                        ? 'bg-rose-100 text-rose-900'
                        : item.severity === 'medium'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
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

      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Doctor cohort monitoring view</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Auto-triage summary to identify who is improving vs worsening across active patients.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-600">
                <th className="py-2">Patient ID</th>
                <th className="py-2">Risk delta (24h)</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {cohortStatus.map((row) => (
                <tr key={row.patient} className="border-b border-black/5">
                  <td className="py-2 font-medium">{row.patient}</td>
                  <td className="py-2">{row.delta}</td>
                  <td className="py-2">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Clinical evidence logic in this prototype uses guideline-like thresholds (BP, HbA1c, CRP, LDL,
        adherence). It supports decision awareness and triage, not standalone medical diagnosis.
      </p>
    </section>
  )
}
