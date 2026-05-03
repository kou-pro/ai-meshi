import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// devise_token_auth の確認メールリンク (Rails 側) からリダイレクトされる Route Handler。
// URL に乗ってくる access-token / client / uid を HTTPOnly Cookie に変換し、
// /home に遷移することでメール認証→自動ログイン→ホーム画面のフローを実現する。
// Google OAuth callback と同じパターン。
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get('access-token')
  const client = searchParams.get('client')
  const uid = searchParams.get('uid')
  const success = searchParams.get('account_confirmation_success')

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('NEXT_PUBLIC_APP_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  // 確認失敗 or 必須トークン欠損: ログイン画面でエラー表示
  if (success !== 'true' || !accessToken || !client || !uid) {
    return NextResponse.redirect(
      new URL('/login?confirmation_error=true', process.env.NEXT_PUBLIC_APP_URL),
    )
  }

  // 確認成功 → /home に直行(自動ログイン)
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

  response.cookies.set('access-token', accessToken, cookieOptions)
  response.cookies.set('client', client, cookieOptions)
  response.cookies.set('uid', uid, cookieOptions)

  return response
}
