'use client'
import { useState } from 'react'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  targetUserId: number
  initialIsFollowing: boolean
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)

    if (isFollowing) {
      // アンフォロー
      const res = await fetchWithAuthClient(`/api/follows/${targetUserId}`, {
        method: 'DELETE',
      })
      if (res.status === 401) {
        setIsLoading(false)
        return
      }
      if (res.ok) setIsFollowing(false)
    } else {
      // フォロー
      const res = await fetchWithAuthClient('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: targetUserId }),
      })
      if (res.status === 401) {
        setIsLoading(false)
        return
      }
      if (res.ok) setIsFollowing(true)
    }

    setIsLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        isFollowing
          ? 'border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-300'
          : 'border-green-600 bg-green-600 text-white hover:bg-green-700'
      } disabled:opacity-50`}
    >
      {isLoading ? '...' : isFollowing ? 'フォロー中' : 'フォローする'}
    </button>
  )
}
