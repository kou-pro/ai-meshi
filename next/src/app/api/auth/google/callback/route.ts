import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get('access-token')
  const client = searchParams.get('client')
  const uid = searchParams.get('uid')

  if (!accessToken || !client || !uid) {
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', process.env.NEXT_PUBLIC_APP_URL),
    )
  }

  const response = NextResponse.redirect(
    new URL('/home', process.env.NEXT_PUBLIC_APP_URL),
  )

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    // Rails 側 token_lifespan = 2.weeks に合わせて 14 日。
    maxAge: 60 * 60 * 24 * 14,
  }

  response.cookies.set('access-token', accessToken, cookieOptions)
  response.cookies.set('client', client, cookieOptions)
  response.cookies.set('uid', uid, cookieOptions)

  return response
}
