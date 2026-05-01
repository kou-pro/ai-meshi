'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Props = {
  /** 現在ログイン中のユーザー ID。null = 未ログイン */
  userId: number | null
}

/**
 * 「マイページ ▼」ドロップダウン。
 *
 * # 設計
 * - 認証情報の取得は Server Component (Navbar) 側で実行し、props で受け取る。
 * - 本コンポーネントは UI 状態（開閉）と外クリック検知だけを担う。
 *
 * # 旧バージョンの問題
 * 以前は `useEffect` 内で `/api/auth/me` を fetch していたため、
 * 新規登録直後の Cookie 伝搬タイミングによっては 401 となり、
 * userId が null のまま「マイレシピ / フォロー/フォロワー」が消えるバグがあった。
 * Server-side 取得 + props 受け渡しに変更したことでこの問題は解消。
 */
export default function UserMenu({ userId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-600 hover:text-green-600"
      >
        マイページ ▾
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          {userId !== null && (
            <Link
              href={`/users/${userId}`}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
            >
              マイレシピ
            </Link>
          )}
          {userId !== null && (
            <Link
              href={`/users/${userId}/follows`}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
            >
              フォロー/フォロワー
            </Link>
          )}
          <hr className="my-1 border-gray-100" />
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
          >
            設定
          </Link>
        </div>
      )}
    </div>
  )
}
