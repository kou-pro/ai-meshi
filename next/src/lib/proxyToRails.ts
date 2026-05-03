import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Cookie の共通オプション。
 * Rails 側 token_lifespan = 30.days に合わせて maxAge を 30 日に設定。
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

/**
 * Rails API へのリクエストを代行し、レスポンスを Next.js 用に整形して返す。
 *
 * # 役割
 * 1. 既存 Cookie から access-token / client / uid を取り出し Rails に転送
 * 2. ボディ + ステータスコードを Next.js のレスポンスとして返す
 * 3. Rails が新トークンを返した場合に限り Cookie を上書き
 *
 * # 現在の運用方針 (固定トークン)
 * Rails 側 change_headers_on_each_request = false のため、Rails は新トークンを
 * 返さない。よって本ヘルパーの Cookie 上書き分岐は事実上常にスキップされる。
 * Cookie の maxAge = 30日 でトークン寿命を統一している。
 *
 * # スライディングセッション再挑戦時の参考
 * change_headers_on_each_request = true にすると、認証成功した全レスポンスで
 * 新トークン (access-token / client / uid / expiry) が返る。本ヘルパーは
 * Route Handler から呼ばれた場合に限り Cookie 上書き可能 (NextResponse 経由)。
 * ただし Server Component から Rails を呼ぶ箇所 (例: getCurrentUser) では
 * Cookie 上書きが構造的にできず、Rails 側でローテーションされたトークンと
 * Cookie が乖離して 401 ループに陥る。proxy.ts を介した一元処理など、
 * 別途設計が必要。
 *
 * # 並列リクエスト時の挙動 (batch_request_buffer_throttle = 5.seconds)
 * 5 秒以内の同一トークンによる並列リクエストはバッチと判定され、
 * 1 番目のリクエストにだけ新トークンが返り、2 番目以降は新トークン無し。
 * 本ヘルパーは「新トークンが返ってきた時だけ Cookie 更新」の条件分岐で
 * バッチ後続レスポンスでは Cookie を変更しない (公式仕様に整合)。
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
