import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Cookie の共通オプション。
 * Rails 側 token_lifespan = 2.weeks に合わせて maxAge を 14 日に設定。
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 14,
}

/**
 * Rails API へのリクエストを代行し、レスポンスを Next.js 用に整形して返す。
 *
 * # 役割
 * 1. 既存 Cookie から access-token / client / uid を取り出し Rails に転送
 * 2. Rails レスポンスから新トークンを取り出し Cookie を上書き（スライディングセッション）
 * 3. ボディ + ステータスコードを Next.js のレスポンスとして返す
 *
 * # スライディングセッションの仕組み
 * devise_token_auth (change_headers_on_each_request = true) は
 * 認証成功した全レスポンスに新しい access-token / client / uid / expiry を返す。
 * 本ヘルパーがこれを毎回 Cookie に上書きすることで、操作するたびにトークン期限が
 * 14日後にリセットされ、アクティブな間は半永久的にログイン状態が維持される。
 *
 * # 並列リクエスト時の挙動 (batch_request_buffer_throttle = 5.seconds)
 * 5 秒以内の同一トークンによる並列リクエストはバッチと判定され、
 * 1 番目のリクエストにだけ新トークンが返り、2 番目以降は新トークン無し。
 * 本ヘルパーは「新トークンが返ってきた時だけ Cookie 更新」する条件分岐により、
 * バッチ後続レスポンスでは Cookie を変更しない（公式仕様に整合）。
 *
 * # 使い方
 * ```ts
 * // Before:
 * const res = await fetch(`${RAILS_URL}/api/v1/bookmarks`, { headers: { ... } })
 * return NextResponse.json(await res.json())
 *
 * // After:
 * return proxyToRails('/api/v1/bookmarks')
 * ```
 */
export async function proxyToRails(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // 認証ヘッダー（呼び出し側が独自ヘッダーを渡したい場合は init.headers でマージ）
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'access-token': accessToken ?? '',
    client: client ?? '',
    uid: uid ?? '',
    ...((init.headers as Record<string, string>) ?? {}),
  }

  const railsRes = await fetch(`${RAILS_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })

  // ボディの構築（空ボディや JSON 以外を許容するため try/catch）
  let body: unknown = null
  const contentType = railsRes.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    body = await railsRes.json().catch(() => null)
  }

  const response = NextResponse.json(body, { status: railsRes.status })

  // Rails が返した新トークン（バッチ 2 番目以降では null になる）
  const newAccessToken = railsRes.headers.get('access-token')
  const newClient = railsRes.headers.get('client')
  const newUid = railsRes.headers.get('uid')
  const newExpiry = railsRes.headers.get('expiry')

  // 新トークンが揃って返ってきた時だけ Cookie を上書き（スライディング）。
  // バッチ判定された後続リクエストでは何もしない（公式仕様）。
  if (newAccessToken && newClient && newUid) {
    response.cookies.set('access-token', newAccessToken, COOKIE_OPTIONS)
    response.cookies.set('client', newClient, COOKIE_OPTIONS)
    response.cookies.set('uid', newUid, COOKIE_OPTIONS)
    if (newExpiry) {
      response.cookies.set('expiry', newExpiry, COOKIE_OPTIONS)
    }
  }

  return response
}
