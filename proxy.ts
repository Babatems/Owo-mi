import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { headers } from 'next/headers'
import createNextIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createNextIntlMiddleware(routing)

const DASHBOARD_PREFIX = '/dashboard'
const AUTH_PATHS = ['/sign-in', '/sign-up', '/verify', '/mfa']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Root: redirect to locale
  if (pathname === '/') {
    const acceptLang = request.headers.get('accept-language') ?? ''
    const locale = acceptLang.toLowerCase().includes('fr') ? 'fr' : 'en'
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // Protect /dashboard and all sub-paths
  if (pathname === DASHBOARD_PREFIX || pathname.startsWith(DASHBOARD_PREFIX + '/')) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  // Auth pages: redirect authenticated users to dashboard
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const session = await auth.api.getSession({ headers: await headers() })
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
