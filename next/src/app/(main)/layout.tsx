import Navbar from '@/components/Navbar'
import MobileNav from '@/components/MobileNav'
import Image from 'next/image'
import Link from 'next/link'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <Link href="/home">
          <Image
            src="/logo.png"
            alt="AI飯"
            width={120}
            height={40}
            className="w-auto h-14"
          />
        </Link>
      </header>
      {children}
      <MobileNav />
    </>
  )
}
