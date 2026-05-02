import type { Session } from '@supabase/supabase-js'

export type AppRole = 'patient' | 'clinician' | 'researcher' | 'admin'

export type AuthState = {
  session: Session | null
  role: AppRole
  loading: boolean
  connectionStatus: string
  authStatus: string
}

export type Snapshot = {
  id: string
  source: string
  dataset: string
  fetched_at: string
}

export type CareTeamRow = {
  patient_id: string
  relationship: string
}

export type PatientProfileForm = {
  display_name: string
  birth_year: string
  sex: string
  diabetes_type: string
  diagnosis_date: string
}
