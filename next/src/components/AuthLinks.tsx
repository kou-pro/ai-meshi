'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 未ログイン時の「ログイン / 新規登録」リンク。
 * 現在のパスを `?next=` で渡し、ログイン/新規登録ページの ✕ ボタンで
 * 元のページに戻れるようにする。
 */
export default function AuthLinks() {
  const pathname = usePathname()
  const next = encodeURIComponent(pathname)

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/login?next=${next}`}
        className="text-sm text-gray-600 hover:text-green-600 px-2 py-1.5"
      >
        ログイン
      </Link>
      <Link
        href={`/signup?next=${next}`}
        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700"
      >
        新規登録
      </Link>
    </div>
  )
}
