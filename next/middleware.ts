import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access-token')?.value
  const client = request.cookies.get('client')?.value
  const uid = request.cookies.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/protected/:path*', '/recipes/new', '/recipes/:path*/edit'],
}
