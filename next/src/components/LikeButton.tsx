'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  recipeId: number
  initialLiked: boolean
  isLoggedIn: boolean
}

/**
 * 「いいね」アクションアイコン (詳細ページのヒーロー画像オーバーレイ用)。
 *
 * # デザイン
 * Instagram / Pinterest 等の業界標準パターンに準拠した、
 * ヒーロー画像の右上隅に置く半透明白の円形アイコンボタン。
 * 状態に応じてハートが赤く塗られる。
 */
export default function LikeButton({
  recipeId,
  initialLiked,
  isLoggedIn,
}: Props) {
  const [liked, setLiked] = useState(initialLiked)

  const handleClick = async () => {
    if (!isLoggedIn) {
      toast.error('いいねするにはログインが必要です')
      return
    }

    const method = liked ? 'DELETE' : 'POST'
    const res = await fetchWithAuthClient(`/api/likes/${recipeId}`, {
      method,
    })

    if (res.status === 401) return
    if (!res.ok) return

    const data = await res.json()
    setLiked(data.liked_by_current_user)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-11 h-11 rounded-full bg-white/90 backdrop-blur-md shadow-md hover:bg-white hover:shadow-lg transition-all flex items-center justify-center ${
        liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
      }`}
      aria-label={liked ? 'いいねを取り消す' : 'いいねする'}
      aria-pressed={liked}
    >
      <Heart
        className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
        strokeWidth={2}
      />
    </button>
  )
}
