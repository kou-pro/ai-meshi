'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function MobileUserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserId(data.id)
      }
    }
    fetchUser()
  }, [])

  // メニュー外タップで閉じる
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
        className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-1"
      >
        <span className="text-xl">👤</span>
        <span className="text-xs">マイページ</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          {userId && (
            <Link
              href={`/users/${userId}`}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
            >
              マイレシピ
            </Link>
          )}
          <Link
            href="/recipes"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
          >
            レシピ管理
          </Link>
          {userId && (
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
