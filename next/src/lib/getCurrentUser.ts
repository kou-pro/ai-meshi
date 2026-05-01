import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'

/**
 * 現在ログイン中のユーザー情報。
 * Cookie 内のトークンが無効な場合は null を返す。
 */
export type CurrentUser = {
  id: number
  name: string
  email: string
  image_url: string | null
}

/**
 * 現在ログイン中のユーザーを取得する Server-only ユーティリティ。
 *
 * # 設計意図
 * - Client Component で `/api/auth/me` を fetch する従来のパターンは、
 *   HttpOnly Cookie の伝搬タイミング問題で 401 になる不具合があった。
 * - 本ユーティリティは Server Component / Server Function 内で
 *   `cookies()` 経由で確実に取得する。
 * - `React.cache` で同一リクエスト内のメモ化（複数箇所から呼んでも 1 回だけ Rails に問い合わせる）。
 *
 * # 使い方
 * ```tsx
 * // Server Component
 * import { getCurrentUser, getCurrentUserId } from '@/lib/getCurrentUser'
 *
 * const user = await getCurrentUser()       // 全フィールド
 * const userId = await getCurrentUserId()   // ID のみ（よくある用途）
 * ```
 *
 * # 参考
 * - Next.js 公式: Server Components / cookies()
 *   https://nextjs.org/docs/app/getting-started/server-and-client-components
 *   https://nextjs.org/docs/app/api-reference/functions/cookies
 * - React 公式: cache() でリクエストスコープのメモ化
 *   https://react.dev/reference/react/cache
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return null
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // Cookie が揃っていない = 未ログイン
  if (!accessToken || !client || !uid) return null

  const res = await fetch(`${RAILS_URL}/api/v1/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    cache: 'no-store',
  })

  // Rails 側で認証失敗（トークン期限切れ等）
  if (!res.ok) return null

  return res.json()
})

/**
 * 現在ログイン中のユーザー ID のみ取得するヘルパー。
 * `getCurrentUser()` のラッパー。
 */
export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser()
  return user?.id ?? null
}
