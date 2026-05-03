'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TopBarProps = {
  role: 'patient' | 'clinician' | 'researcher' | 'admin'
}

export function TopBar({ role }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/research', label: 'Research', roles: ['researcher', 'admin'] },
    { href: '/clinic', label: 'Clinic', roles: ['clinician', 'admin'] },
    { href: '/me/start', label: 'Start', roles: ['patient', 'admin'] },
    { href: '/me', label: 'Me', roles: ['patient', 'admin'] },
  ].filter((item) => item.roles.includes(role))

  return (
    <header className="border-b border-black/10 p-4">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">DM Twin</span>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1 text-sm ${
                  pathname.startsWith(item.href) ? 'bg-black text-white' : 'bg-black/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          type="button"
          className="rounded border border-black/20 px-3 py-1 text-sm"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
