import { cookies } from 'next/headers'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'
import Image from 'next/image'
import UserMenu from './UserMenu'
import { getCurrentUserId } from '@/lib/getCurrentUser'

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
              <Link
                href="/home"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                ホーム
              </Link>
              <Link
                href="/recipes/new"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                作る
              </Link>
              <Link
                href="/saved-recipes"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                保存済み
              </Link>
              <Link
                href="/shopping-list"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                買い物リスト
              </Link>
              <UserMenu userId={userId} />
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/home"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                みんなのレシピ
              </Link>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700"
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
