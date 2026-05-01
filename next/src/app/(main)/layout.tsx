import { cookies } from 'next/headers'
import Navbar from '@/components/Navbar'
import MobileNav from '@/components/MobileNav'
import AuthLinks from '@/components/AuthLinks'
import Image from 'next/image'
import Link from 'next/link'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value
  const isLoggedIn = !!(accessToken && client && uid)

  return (
    <>
      <Navbar />
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <Link href="/home">
          <Image
            src="/logo.png"
            alt="AI飯"
            width={120}
            height={40}
            className="w-auto h-14"
          />
        </Link>
        {/* 認証済み: 設定アイコン / 未認証: ログイン + 新規登録（現在パスを ?next= で渡す） */}
        {isLoggedIn ? (
          <Link href="/settings" className="text-gray-500 hover:text-green-600">
            <Cog6ToothIcon className="w-6 h-6" />
          </Link>
        ) : (
          <AuthLinks />
        )}
      </header>
      <main className="pb-20 md:pb-0">{children}</main>
      <MobileNav />
    </>
  )
}
