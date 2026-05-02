import { Link, NavLink } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useAuth } from '../context/AuthContext'
import type { AppRole } from '../types'

const NAV_ITEMS: Array<{ to: string; label: string; roles: AppRole[] }> = [
  { to: '/research', label: 'Research', roles: ['researcher', 'admin'] },
  { to: '/clinic', label: 'Clinic', roles: ['clinician', 'admin'] },
  { to: '/me', label: 'Me', roles: ['patient', 'admin'] },
]

export function AppLayout({ children }: PropsWithChildren) {
  const { session, role, signOut } = useAuth()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="header">
        <div>
          <h1>DM Twin</h1>
          <p className="subtitle">Diabetes research and clinical platform</p>
        </div>
        <div className="header-actions">
          {session ? (
            <>
              <span className="chip">{role}</span>
              {session.user.email ? <span className="user-email">{session.user.email}</span> : null}
              <button type="button" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <span className="chip">guest</span>
          )}
        </div>
      </header>

      <nav className="nav" aria-label="Primary">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))
        ) : (
          <NavLink to="/auth" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Sign in
          </NavLink>
        )}
      </nav>

      <main id="content" className="content">
        {children}
      </main>

      <footer className="footer">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <span>Research use only - not medical advice.</span>
      </footer>
    </div>
  )
}
