'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  recipeId: number
  initialBookmarked: boolean
}

/**
 * 「保存」アクションアイコン (詳細ページのヒーロー画像オーバーレイ用)。
 *
 * # デザイン
 * ヒーロー画像の右上隅に並ぶ半透明白の円形アイコンボタン。
 * 状態に応じてアンバー (保存済み) で塗りつぶす。
 */
export default function SaveButton({ recipeId, initialBookmarked }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading) return
    setIsLoading(true)

    setBookmarked((prev) => !prev)

    try {
      if (bookmarked) {
        const res = await fetchWithAuthClient(`/api/bookmarks/${recipeId}`, {
          method: 'DELETE',
        })
        if (res.status === 401) {
          setIsLoading(false)
          return
        }
        if (!res.ok) setBookmarked(true)
      } else {
        const res = await fetchWithAuthClient('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id: recipeId }),
        })
        if (res.status === 401) {
          setIsLoading(false)
          return
        }
        if (!res.ok) setBookmarked(false)
      }
    } catch {
      setBookmarked((prev) => !prev)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`w-11 h-11 rounded-full bg-white/90 backdrop-blur-md shadow-md hover:bg-white hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-70 ${
        bookmarked ? 'text-amber-500' : 'text-gray-600 hover:text-amber-500'
      }`}
      aria-label={bookmarked ? '保存を解除' : '保存する'}
      aria-pressed={bookmarked}
    >
      <Bookmark
        className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`}
        strokeWidth={2}
      />
    </button>
  )
}
