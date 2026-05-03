import { NextResponse } from 'next/server'

// Next.js 公式推奨: Route Handler を明示的に動的にする
// これによりビルド時最適化が無効化され、process.env が実行時に評価される
// 参考: https://nextjs.org/docs/app/getting-started/route-handlers
export const dynamic = 'force-dynamic'

export async function POST() {
  // Next.js 公式推奨: 環境変数は関数内部で参照（実行時評価を保証）
  // トップレベルで参照するとビルド時に値が固定されるため避ける
  // 参考: https://nextjs.org/docs/pages/guides/environment-variables
  const RAILS_URL = process.env.RAILS_API_URL

  // 環境変数未設定時の明確なエラーログ（本番ログ追跡のため）
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  const res = await fetch(`${RAILS_URL}/api/v1/guest_sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'ゲストログインに失敗しました' },
      { status: res.status },
    )
  }

  // ボディからトークンを取得
  const data = await res.json()
  const accessToken = data.tokens['access-token']
  const client = data.tokens['client']
  const uid = data.tokens['uid']
  const expiry = data.tokens['expiry']

  if (!accessToken || !client || !uid || !expiry) {
    return NextResponse.json({ error: 'Token missing' }, { status: 500 })
  }

  const response = NextResponse.json({ success: true })
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
  response.cookies.set('expiry', expiry, cookieOptions)

  return response
}
