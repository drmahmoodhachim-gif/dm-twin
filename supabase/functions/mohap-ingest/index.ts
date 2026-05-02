import { createSupabaseAdminClient } from '../_shared/supabase-admin.ts'

type IngestResponse = {
  ok: boolean
  source: string
  dataset: string
  fetchedAt?: string
  snapshotId?: string
  error?: string
}

const SOURCE = 'mohap'
const DATASET = 'diabetes_indicators'
const DEFAULT_SOURCE_URL =
  'https://www.mohap.gov.ae/en/open-data'

function json(data: IngestResponse, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json(
      {
        ok: false,
        source: SOURCE,
        dataset: DATASET,
        error: 'Use POST to run ingestion',
      },
      405,
    )
  }

  const sourceUrl = Deno.env.get('MOHAP_DIABETES_SOURCE_URL') ?? DEFAULT_SOURCE_URL

  try {
    const upstream = await fetch(sourceUrl, {
      headers: { Accept: 'application/json,text/csv,text/plain,*/*' },
    })

    if (!upstream.ok) {
      return json(
        {
          ok: false,
          source: SOURCE,
          dataset: DATASET,
          error: `Upstream fetch failed (${upstream.status})`,
        },
        502,
      )
    }

    const contentType = upstream.headers.get('content-type') ?? ''
    const fetchedAt = new Date().toISOString()
    const bodyText = await upstream.text()

    const payload =
      contentType.includes('application/json')
        ? JSON.parse(bodyText)
        : {
            raw_text: bodyText,
            format: contentType.includes('csv') ? 'csv' : 'text',
          }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .schema('external')
      .from('dataset_snapshots')
      .insert({
        source: SOURCE,
        dataset: DATASET,
        fetched_at: fetchedAt,
        source_url: sourceUrl,
        payload,
        meta: {
          content_type: contentType,
          size_bytes: bodyText.length,
        },
      })
      .select('id')
      .single()

    if (error) {
      return json(
        {
          ok: false,
          source: SOURCE,
          dataset: DATASET,
          fetchedAt,
          error: error.message,
        },
        500,
      )
    }

    return json({
      ok: true,
      source: SOURCE,
      dataset: DATASET,
      fetchedAt,
      snapshotId: data.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return json(
      {
        ok: false,
        source: SOURCE,
        dataset: DATASET,
        error: message,
      },
      500,
    )
  }
})
