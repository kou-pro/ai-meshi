import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getCurrentUser'
import SettingsForm from './SettingsForm'

export const dynamic = 'force-dynamic'

/**
 * 設定ページ（Server Component）。
 *
 * # 設計
 * - Server Component で `getCurrentUser()` を使い、HttpOnly Cookie 経由で
 *   ユーザー情報を確実に取得する。
 * - 取得した初期値を Client Component (SettingsForm) に props として渡す。
 *
 * # 旧版の問題
 * `'use client'` の本ページが `useEffect` 内で `/api/settings` を fetch して
 * 初期値を取得していた。新規登録直後のタイミングで 401 になり、
 * フォーム初期値が空のままになる不具合があった。
 */
export default async function SettingsPage() {
  const user = await getCurrentUser()

  // 未ログイン or 認証失敗時はログイン画面へ
  if (!user) {
    redirect('/login')
  }

  return (
    <SettingsForm
      initialName={user.name}
      initialEmail={user.email}
      initialImageUrl={user.image_url}
    />
  )
}
