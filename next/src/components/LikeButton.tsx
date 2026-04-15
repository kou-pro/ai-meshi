'use client'

import { useState } from 'react'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { toast } from 'sonner'
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
      toast.error('いいねするにはログインが必要です')
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
      {liked ? (
        <HeartSolid className="w-5 h-5 text-red-500" />
      ) : (
        <HeartOutline className="w-5 h-5" />
      )}
      <span>{likesCount}</span>
    </button>
  )
}
