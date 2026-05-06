import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { headers } from 'next/headers'

const PROTECTED_PATHS = ['/accounts', '/transactions', '/budgets', '/goals', '/settings']
const AUTH_PATHS = ['/sign-in', '/sign-up', '/verify', '/mfa']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p)) || pathname === '/'
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (!isProtected && !isAuthPath) return NextResponse.next()

  const session = await auth.api.getSession({ headers: await headers() })

  if (isProtected && !session) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
