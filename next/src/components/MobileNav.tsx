import { cookies } from 'next/headers'
import Link from 'next/link'
import { HomeIcon, SparklesIcon, ShoppingCartIcon, BookmarkIcon, UserIcon } from '@heroicons/react/24/outline'

const RAILS_URL = process.env.RAILS_API_URL

async function fetchCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) return null

  const res = await fetch(`${RAILS_URL}/api/v1/users/me`, {
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    cache: 'no-store',
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.id
}

export default async function MobileNav() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const isLoggedIn = !!(accessToken && client && uid)

  if (!isLoggedIn) return null

  const userId = await fetchCurrentUserId()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        <Link
          href="/home"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs">ホーム</span>
        </Link>

        <Link
          href="/recipes/new"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <SparklesIcon className="w-6 h-6" />
          <span className="text-xs">作る</span>
        </Link>

        <Link
          href="/shopping-list"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <ShoppingCartIcon className="w-6 h-6" />
          <span className="text-xs">買い物</span>
        </Link>

        <Link
          href="/saved-recipes"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <BookmarkIcon className="w-6 h-6" />
          <span className="text-xs">保存</span>
        </Link>

        <Link
          href={userId ? `/users/${userId}` : '/settings'}
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-xs">マイページ</span>
        </Link>
      </div>
    </nav>
  )
}
