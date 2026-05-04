'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type TeamMember = {
  name: string
  role: string
  focus: string
  image: string
  contact?: string
  bio?: string
}

const PI_TEAM: TeamMember[] = [
  {
    name: 'Mahmood Yaseen Hachim Al Mashhadani',
    role: 'Assistant Professor - Molecular Medicine | Overall PI and Twin Maker',
    focus:
      'Principal leadership for molecular medicine strategy, translational pathways, and predictive biomarker development.',
    image: '/team/your-profile.png',
    contact: 'Contact Faculty: +9714 383 8729',
  },
  {
    name: 'Dr. Dima Abdelmannan',
    role: 'Co-Principal Investigator (Co-PI)',
    focus: 'Endocrinology co-lead for clinical direction and patient-centered outcomes.',
    image: '/team/dr-dima-abdelmannan.png',
  },
  {
    name: 'Remote Monitoring Unit',
    role: 'Operations',
    focus: 'Daily monitoring workflows, escalation, and SOP execution',
    image: 'https://api.dicebear.com/8.x/initials/svg?seed=Remote+Monitoring+Unit&backgroundType=gradientLinear',
  },
]

const FLOW_STEPS = [
  'Patient and caregiver submit daily inputs',
  'Twin engine fuses glycemic and behavior signals',
  'Risk and hidden-warning patterns are detected',
  'Care-team receives triage with SOP recommendations',
] 

export default function OpeningPage() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length)
    }, 1800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="space-y-4 rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.14),_transparent_35%),linear-gradient(to_bottom,_#020617,_#111827)] p-4 text-zinc-100 md:p-6">
      <div className="rounded-2xl border border-cyan-400/30 bg-zinc-950/70 p-6 shadow-[0_0_35px_rgba(34,211,238,0.14)]">
        <h1 className="text-3xl font-semibold tracking-tight text-cyan-100">DM Twin Project Opening</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-300">
          Meet the principal investigator team and understand the live care flow before entering the explanatory
          onboarding page.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-700 bg-zinc-950/75 p-5">
        <h2 className="text-lg font-semibold text-indigo-100">Principal investigator and project team</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PI_TEAM.map((member) => (
            <article key={member.name} className="rounded-xl border border-zinc-700 bg-zinc-900/75 p-4">
              <img
                src={member.image}
                alt={`${member.name} profile`}
                className="h-28 w-28 rounded-xl border border-cyan-300/30 bg-zinc-950"
              />
              <p className="mt-3 font-semibold text-cyan-100">{member.name}</p>
              <p className="text-xs text-indigo-200">{member.role}</p>
              <p className="mt-2 text-xs text-zinc-300">{member.focus}</p>
              {member.contact ? <p className="mt-2 text-xs font-medium text-cyan-200">{member.contact}</p> : null}
              {member.bio ? <p className="mt-2 text-xs leading-relaxed text-zinc-300">{member.bio}</p> : null}
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-zinc-950/75 p-5">
        <h2 className="text-lg font-semibold text-cyan-100">Dynamic live action flow</h2>
        <p className="mt-1 text-sm text-zinc-300">
          The highlighted stage moves continuously to show how data becomes clinical action in real time.
        </p>
        <div className="mt-4 space-y-3">
          {FLOW_STEPS.map((step, idx) => {
            const isActive = idx === activeStep
            const isCompleted = idx < activeStep
            return (
              <div
                key={step}
                className={`rounded-xl border px-4 py-3 text-sm transition ${
                  isActive
                    ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
                    : isCompleted
                      ? 'border-emerald-300/50 bg-emerald-500/10 text-emerald-200'
                      : 'border-zinc-700 bg-zinc-900/75 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p>{step}</p>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      isActive ? 'animate-pulse bg-cyan-300' : isCompleted ? 'bg-emerald-300' : 'bg-zinc-600'
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-400/25 bg-zinc-950/70 p-6">
        <h2 className="text-lg font-semibold text-indigo-100">Enter the site flow</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Click below to continue to the explanatory onboarding page before using the main dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/me/start"
            className="rounded-full border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-400/25"
          >
            Enter and continue to explanatory page
          </Link>
          <Link
            href="/me"
            className="rounded-full border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500"
          >
            Skip to dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
