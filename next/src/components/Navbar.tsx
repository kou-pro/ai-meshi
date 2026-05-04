import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import UserMenu from './UserMenu'
import { getCurrentUserId } from '@/lib/getCurrentUser'

/**
 * 共通ヘッダーナビゲーション。
 *
 * # ログアウトボタンについて
 * ログアウトはヘッダーには配置しない (Cookpad / DELISH KITCHEN /
 * クラシル等の日本系レシピアプリ標準パターンに準拠)。
 * /settings 画面の最下部に配置済みのため、そちらから操作する。
 *
 * # ナビリンクのデザイン
 * GitHub / Vercel / Notion / Linear / Stripe 等の業界標準に倣い、
 * - text-sm font-medium (14px / 500) で読みやすい中間の太さ
 * - text-gray-700 (#374151) で視認性確保
 * - hover:text-green-600 + transition-colors で滑らかな遷移
 */
export default async function Navbar() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const isLoggedIn = !!(accessToken && client && uid)
  // ログイン済みなら server-side でユーザー ID を取得し、UserMenu に props で渡す。
  // これにより Client Component 内で /api/auth/me を fetch する必要がなくなり、
  // 401 によるドロップダウンの欠落バグを根絶できる。
  const userId = isLoggedIn ? await getCurrentUserId() : null

  // ナビリンクの共通スタイル (DRY)
  const linkClass =
    'text-sm font-medium text-gray-700 hover:text-green-600 transition-colors'

  return (
    <nav className="hidden md:block bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/home" className="flex items-center">
          <Image
            src="/logo.png"
            alt="AI飯"
            width={800}
            height={436}
            className="w-auto h-32"
          />
        </Link>
        {/* ナビリンク */}
        <div className="flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <Link href="/home" className={linkClass}>
                ホーム
              </Link>
              <Link href="/recipes/new" className={linkClass}>
                作る
              </Link>
              <Link href="/saved-recipes" className={linkClass}>
                保存済み
              </Link>
              <Link href="/shopping-list" className={linkClass}>
                買い物リスト
              </Link>
              <UserMenu userId={userId} />
            </>
          ) : (
            <>
              <Link href="/home" className={linkClass}>
                みんなのレシピ
              </Link>
              <Link href="/login" className={linkClass}>
                ログイン
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 transition-colors"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
