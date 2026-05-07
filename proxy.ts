import { NextRequest, NextResponse } from 'next/server'
import createNextIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createNextIntlMiddleware(routing)

const DASHBOARD_PREFIX = '/dashboard'
const AUTH_PATHS = ['/sign-in', '/sign-up', '/verify', '/mfa']

async function getSession(request: NextRequest): Promise<{ user?: { id: string } } | null> {
  try {
    const res = await fetch(new URL('/api/auth/get-session', request.nextUrl.origin), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Root: always redirect to English (French is opt-in via toggle)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url))
  }

  // Invitation acceptance: public, no auth required
  if (pathname.startsWith('/accept-invitation')) {
    return NextResponse.next()
  }

  // Protect /dashboard and all sub-paths
  if (pathname === DASHBOARD_PREFIX || pathname.startsWith(DASHBOARD_PREFIX + '/')) {
    const session = await getSession(request)
    if (!session?.user) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  // Auth pages: redirect authenticated users to dashboard
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const session = await getSession(request)
    if (session?.user) {
      return NextResponse.redirect(new URL(DASHBOARD_PREFIX, request.url))
    }
    return NextResponse.next()
  }

  // Marketing pages: next-intl handles locale routing
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
