import { redirect } from 'next/navigation'

export default function HomePage() {
  const demoBypassAuth =
    process.env.DEMO_BYPASS_AUTH === 'true' || process.env.NEXT_PUBLIC_DEMO_BYPASS_AUTH === 'true'
  if (demoBypassAuth) {
    redirect('/me')
  }

  redirect('/login')
}
