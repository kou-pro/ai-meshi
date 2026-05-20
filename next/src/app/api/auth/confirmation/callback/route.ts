import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// devise_token_auth の確認メールリンク (Rails 側) からリダイレクトされる Route Handler。
// URL クエリには短命コード (RFC 6749 §4.1 Authorization Code) のみが乗っており、
// 本コードを Rails の Token Endpoint (POST /auth/exchange) と交換して
// 本物の access-token / client / uid を取得し、HttpOnly Cookie に変換する。
// Google OAuth callback と同じパターン。
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const success = request.nextUrl.searchParams.get('account_confirmation_success')

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('NEXT_PUBLIC_APP_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  // 確認失敗 or 必須コード欠損: ログイン画面でエラー表示
  if (success !== 'true' || !code) {
    return NextResponse.redirect(
      new URL('/login?confirmation_error=true', process.env.NEXT_PUBLIC_APP_URL),
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
      new URL('/login?confirmation_error=true', process.env.NEXT_PUBLIC_APP_URL),
    )
  }

  const { access_token, client, uid, expiry } = await exchangeRes.json()

  // 確認成功 → /home に直行 (自動ログイン)
  const response = NextResponse.redirect(
    new URL('/home?welcome=true', process.env.NEXT_PUBLIC_APP_URL),
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
  // proxy.ts での期限切れ事前検知に使う。Rails 側が乗せなかった場合は
  // セットしない (proxy.ts は expiry 欠如時に従来挙動にフォールバックする)。
  if (expiry) {
    response.cookies.set('expiry', String(expiry), cookieOptions)
  }

  return response
}
