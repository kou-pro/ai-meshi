'use client'

import { useState } from 'react'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  recipeId: number
  initialLikesCount: number
  initialLiked: boolean
  isLoggedIn: boolean
}

export default function LikeButton({
  recipeId,
  initialLikesCount,
  initialLiked,
  isLoggedIn,
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)

  const handleClick = async () => {
    // 未ログインの場合はログインページへ誘導
    if (!isLoggedIn) {
      alert('いいねするにはログインが必要です')
      return
    }

    const method = liked ? 'DELETE' : 'POST'

    const res = await fetchWithAuthClient(`/api/likes/${recipeId}`, {
      method,
    })

    if (res.status === 401) {
      return
    }
    if (!res.ok) return

    const data = await res.json()
    setLiked(data.liked_by_current_user)
    setLikesCount(data.likes_count)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500"
    >
      <span>{liked ? '❤️' : '🤍'}</span>
      <span>{likesCount}</span>
    </button>
  )
}
