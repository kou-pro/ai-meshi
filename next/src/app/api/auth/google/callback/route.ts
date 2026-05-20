import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Google OAuth 認証完了後、Rails からリダイレクトされる Route Handler。
// URL クエリには短命コード (RFC 6749 §4.1 Authorization Code) のみが乗っており、
// 本コードを Rails の Token Endpoint (POST /auth/exchange) と交換して
// 本物の access-token / client / uid を取得し、HttpOnly Cookie に変換する。
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('NEXT_PUBLIC_APP_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', process.env.NEXT_PUBLIC_APP_URL),
    )
  }

  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  // サーバー間 POST で短命コードを本物のトークンと交換
  const exchangeRes = await fetch(`${RAILS_URL}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    cache: 'no-store',
  })

  if (!exchangeRes.ok) {
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', process.env.NEXT_PUBLIC_APP_URL),
    )
  }

  const { access_token, client, uid, expiry } = await exchangeRes.json()

  const response = NextResponse.redirect(
    new URL('/home', process.env.NEXT_PUBLIC_APP_URL),
  )

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    // Rails 側 token_lifespan = 30.days に合わせて 30 日。
    maxAge: 60 * 60 * 24 * 30,
  }

  response.cookies.set('access-token', access_token, cookieOptions)
  response.cookies.set('client', client, cookieOptions)
  response.cookies.set('uid', uid, cookieOptions)
  if (expiry) {
    response.cookies.set('expiry', String(expiry), cookieOptions)
  }

  return response
}
