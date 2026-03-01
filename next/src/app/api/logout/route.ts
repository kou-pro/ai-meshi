import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  // ▼ サーバーサイドでCookieを読み取る
  // Route HandlerはサーバーサイドなのでHTTPOnly Cookieにアクセスできる
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // ▼ トークンが存在する場合のみRailsにサインアウトを通知する
  // これをしないとRails側でトークンが有効なまま残り、
  // 古いトークンで不正アクセスされるリスクが残る
  if (accessToken && client && uid) {
    try {
      await fetch('http://rails:3000/auth/sign_out', {
        method: 'DELETE',
        headers: {
          'access-token': accessToken,
          client: client,
          uid: uid,
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      // ▼ Rails通信が失敗してもCookie削除は必ず実行する
      // ネットワーク障害やRailsダウン時でも、ユーザーをログアウトさせることを優先する
      console.error('Rails sign_out failed:', error)
    }
  }

  // ▼ HTTPOnly CookieはJavaScriptから触れないため、
  // サーバーサイド（Route Handler）でレスポンスに Set-Cookie ヘッダーを付与して削除する
  const response = NextResponse.json({ success: true })

  // ▼ maxAge: 0 で即時失効させる
  // sameSite: 'lax' はCSRF対策（外部サイトからのリクエストでCookieを送らない）
  // secure: true は本番環境でHTTPSのみCookieを送信する設定
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }

  response.cookies.set('access-token', '', cookieOptions)
  response.cookies.set('client', '', cookieOptions)
  response.cookies.set('uid', '', cookieOptions)

  return response
}
