import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function MobileNav() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const isLoggedIn = !!(accessToken && client && uid)

  if (!isLoggedIn) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        <Link
          href="/home"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <span className="text-xl">🏠</span>
          <span className="text-xs">ホーム</span>
        </Link>

        <Link
          href="/recipes/new"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <span className="text-xl">✨</span>
          <span className="text-xs">作る</span>
        </Link>

        <Link
          href="/shopping-list"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <span className="text-xl">🛒</span>
          <span className="text-xs">買い物</span>
        </Link>

        <Link
          href="/saved-recipes"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <span className="text-xl">🔖</span>
          <span className="text-xs">保存</span>
        </Link>

        <Link
          href="/settings"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <span className="text-xl">👤</span>
          <span className="text-xs">マイページ</span>
        </Link>
      </div>
    </nav>
  )
}
