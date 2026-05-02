import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { CareTeamRow } from '../types'

export function ClinicPage() {
  const { session } = useAuth()
  const [rows, setRows] = useState<CareTeamRow[]>([])
  const [status, setStatus] = useState('Loading care team...')

  useEffect(() => {
    async function loadRows() {
      if (!supabase || !session?.user?.id) return

      const { data, error } = await supabase
        .schema('clinical')
        .from('care_team')
        .select('patient_id, relationship')
        .eq('clinician_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setStatus(`Unable to load care team: ${error.message}`)
        return
      }

      setRows(data ?? [])
      setStatus(data && data.length > 0 ? 'Care team loaded.' : 'No patients assigned yet.')
    }

    void loadRows()
  }, [session?.user?.id])

  return (
    <section className="card">
      <h2>Clinician Panel</h2>
      <p className="status">{status}</p>
      <ul className="list">
        {rows.map((row, index) => (
          <li key={`${row.patient_id}-${index}`}>
            {row.patient_id} ({row.relationship})
          </li>
        ))}
      </ul>
    </section>
  )
}
