import Navbar from '@/components/Navbar'
import MobileNav from '@/components/MobileNav'
import Image from 'next/image'
import Link from 'next/link'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <Link href="/settings" className="text-gray-500 hover:text-green-600">
          <Cog6ToothIcon className="w-6 h-6" />
        </Link>
      </header>
      {children}
      <MobileNav />
    </>
  )
}
