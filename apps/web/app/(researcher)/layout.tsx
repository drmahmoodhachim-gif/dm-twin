import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { TopBar } from '@/components/top-bar'
import { getSessionWithProfile } from '@/lib/auth/get-session'

export default async function ResearcherLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getSessionWithProfile()

  if (!user) redirect('/login')
  if (!profile || !['researcher', 'admin'].includes(profile.role)) redirect('/')

  return (
    <>
      <TopBar role={profile.role} />
      <main className="mx-auto w-full max-w-5xl p-6">{children}</main>
    </>
  )
}
