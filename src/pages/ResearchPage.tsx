import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Snapshot } from '../types'
import { DEMO_MODE } from '../lib/config'

export function ResearchPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [status, setStatus] = useState('Loading research datasets...')
  const [loading, setLoading] = useState(false)
  const [ingestStatus, setIngestStatus] = useState('Ready to run ingestion.')

  async function loadSnapshots() {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('dataset_snapshots_public')
      .select('id, source, dataset, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(12)

    if (error) {
      setStatus(`Unable to load datasets: ${error.message}`)
      setLoading(false)
      return
    }

    setSnapshots(data ?? [])
    setStatus(data && data.length > 0 ? 'Datasets loaded.' : 'No datasets ingested yet.')
    setLoading(false)
  }

  async function runIngest() {
    if (DEMO_MODE) {
      setIngestStatus('Demo mode: ingestion trigger is disabled.')
      return
    }
    if (!supabase) return
    setIngestStatus('Running MOHAP ingestion...')
    const { data, error } = await supabase.functions.invoke('mohap-ingest', { method: 'POST' })
    if (error) {
      setIngestStatus(`Ingestion failed: ${error.message}`)
      return
    }
    setIngestStatus(`Ingestion complete.${data?.snapshotId ? ` Snapshot: ${data.snapshotId}` : ''}`)
    await loadSnapshots()
  }

  useEffect(() => {
    void loadSnapshots()
  }, [])

  return (
    <section className="stack">
      <div className="card">
        <div className="row">
          <h2>Research Datasets</h2>
          <button type="button" onClick={() => void loadSnapshots()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="status">{status}</p>
        <ul className="list">
          {snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <strong>{snapshot.source}</strong> / {snapshot.dataset} -{' '}
              {new Date(snapshot.fetched_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Ingestion Control</h2>
        <p className="status">{ingestStatus}</p>
        <button type="button" onClick={() => void runIngest()}>
          Run MOHAP ingest now
        </button>
      </div>
    </section>
  )
}
