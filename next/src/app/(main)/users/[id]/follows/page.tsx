import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/getCurrentUser'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import FollowsClient from './FollowsClient'

export const dynamic = 'force-dynamic'

type UserItem = {
  id: number
  name: string
  image_url: string | null
}

/** Rails API から指定タブのユーザーリストを取得（Server-side） */
async function fetchUsersByTab(
  userId: string,
  tab: 'following' | 'followers',
): Promise<UserItem[]> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) return []

  // 認証ヘッダー / Cookie 欠落時の redirect / cache: 'no-store' は fetchWithAuth が処理する。
  const res = await fetchWithAuth(`${RAILS_URL}/api/v1/users/${userId}/${tab}`)

  if (!res.ok) return []
  return res.json()
}

/**
 * フォロー/フォロワー一覧ページ（Server Component）。
 *
 * # 設計
 * - 現在ログイン中のユーザー ID と初期タブのユーザーリストを Server で取得。
 * - クライアント (FollowsClient) には props として渡す。
 *
 * # 旧版の問題
 * `'use client'` の本ページが `useEffect` 内で `/api/auth/me` を fetch して
 * `currentUserId` を取得していた。新規登録直後の Cookie 伝搬タイミングで
 * 401 になり「自分自身に対するフォローボタン非表示」のロジックが崩れる
 * 不具合があった。
 */
export default async function FollowsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id: userId } = await params
  const { tab } = await searchParams

  const initialTab: 'following' | 'followers' =
    tab === 'followers' ? 'followers' : 'following'

  // ログイン必須ページ
  const currentUserId = await getCurrentUserId()
  if (currentUserId === null) {
    redirect('/login')
  }

  // 初期表示分のユーザーリストを Server で取得（チラつき防止）
  const initialUsers = await fetchUsersByTab(userId, initialTab)

  return (
    <FollowsClient
      profileUserId={userId}
      currentUserId={currentUserId}
      initialTab={initialTab}
      initialUsers={initialUsers}
    />
  )
}
