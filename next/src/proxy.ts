import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  console.log('🔥 PROXY RUNNING:', request.nextUrl.pathname)

  const token = request.cookies.get('access_token')

  console.log('🎟 TOKEN:', token)

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/protected/:path*'],
}
