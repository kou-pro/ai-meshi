import { cookies } from 'next/headers'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'

export default async function Navbar() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const isLoggedIn = !!(accessToken && client && uid)

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/home" className="text-xl font-bold text-green-600">
          Ai-meshi
        </Link>

        {/* ナビリンク */}
        <div className="flex items-center gap-6">
          <Link
            href="/home"
            className="text-sm text-gray-600 hover:text-green-600"
          >
            Home
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/recipes/new"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                Generate
              </Link>
              <Link
                href="/recipes"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                My Recipes
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-green-600"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
