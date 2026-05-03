import { NextResponse } from 'next/server'

type InterpretRequest = {
  patientId?: string
  context?: string
}

function buildFallbackInterpretation(patientId: string, context: string) {
  const lowered = context.toLowerCase()
  const flags: string[] = []

  if (lowered.includes('fatigue')) flags.push('fatigue trend needs review')
  if (lowered.includes('steps') || lowered.includes('activity')) flags.push('activity drop may precede worsening')
  if (lowered.includes('glucose')) flags.push('glycemic drift should be tracked for 7 days')
  if (lowered.includes('sleep')) flags.push('sleep disruption can amplify next-day glucose variability')

  const summary = flags.length > 0 ? flags.join('; ') : 'no obvious high-risk signal from this note'
  return `Patient ${patientId}: ${summary}. Suggested next step: confirm daily adherence, repeat check-in tomorrow, and escalate to care-team review if two or more signals worsen together.`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InterpretRequest
    const patientId = body.patientId ?? 'unknown'
    const context = body.context ?? ''
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        interpretation: buildFallbackInterpretation(patientId, context),
        liveClaude: false,
      })
    }

    const prompt = [
      'You are a clinical decision-support assistant for diabetes remote monitoring.',
      'Give a short interpretation in plain language with:',
      '1) likely signal pattern, 2) risk level (low/moderate/high), 3) immediate next action.',
      'Avoid diagnosis claims. Stay as triage guidance only.',
      `Patient ID: ${patientId}`,
      `Daily context: ${context}`,
    ].join('\n')

    const anthropicModel = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: anthropicModel,
        max_tokens: 220,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({
        interpretation: buildFallbackInterpretation(patientId, context),
        liveClaude: false,
      })
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const text = data.content?.find((part) => part.type === 'text')?.text?.trim()

    return NextResponse.json({
      interpretation: text || buildFallbackInterpretation(patientId, context),
      liveClaude: Boolean(text),
    })
  } catch {
    return NextResponse.json(
      {
        interpretation:
          'Interpretation temporarily unavailable. Continue daily logging and use care-team review for any worsening trends.',
        liveClaude: false,
      },
      { status: 200 },
    )
  }
}
