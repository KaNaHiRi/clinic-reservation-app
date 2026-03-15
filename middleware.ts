import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  })

  const { pathname } = request.nextUrl

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
}