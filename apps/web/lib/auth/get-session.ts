import { createClient } from '@/lib/supabase/server'

export type UserProfile = {
  id: string
  role: 'patient' | 'clinician' | 'researcher' | 'admin'
  full_name: string | null
}

export async function getSessionWithProfile() {
  const demoBypassAuth =
    process.env.DEMO_BYPASS_AUTH === 'true' || process.env.NEXT_PUBLIC_DEMO_BYPASS_AUTH === 'true'
  if (demoBypassAuth) {
    return {
      user: { id: 'demo-user' } as any,
      profile: {
        id: 'demo-user',
        role: 'patient',
        full_name: 'Demo Patient',
      } as UserProfile,
    }
  }

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
