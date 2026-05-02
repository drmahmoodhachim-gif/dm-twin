import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  researcher: '/research',
  admin: '/research',
  clinician: '/clinic',
  patient: '/me',
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const publicPath = pathname.startsWith('/login') || pathname.startsWith('/api/auth/callback')

  if (!user && !publicPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<{ role: keyof typeof ROLE_HOME }>()

    const role = profile?.role ?? 'patient'
    const home = ROLE_HOME[role] ?? '/me'

    if (pathname === '/' || pathname === '/login') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = home
      return NextResponse.redirect(redirectUrl)
    }

    if (pathname.startsWith('/research') && !['researcher', 'admin'].includes(role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = home
      return NextResponse.redirect(redirectUrl)
    }

    if (pathname.startsWith('/clinic') && !['clinician', 'admin'].includes(role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = home
      return NextResponse.redirect(redirectUrl)
    }

    if (pathname.startsWith('/me') && !['patient', 'admin'].includes(role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = home
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/research/:path*', '/clinic/:path*', '/me/:path*', '/api/auth/callback'],
}
