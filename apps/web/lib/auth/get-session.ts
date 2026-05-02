import { createClient } from '@/lib/supabase/server'

export type UserProfile = {
  id: string
  role: 'patient' | 'clinician' | 'researcher' | 'admin'
  full_name: string | null
}

export async function getSessionWithProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null as UserProfile | null }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle<UserProfile>()

  return { user, profile: profile ?? null }
}
