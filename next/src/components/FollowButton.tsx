'use client'
import { useState } from 'react'
import { toast } from 'sonner'
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
    if (isLoading) return
    setIsLoading(true)

    try {
      const res = isFollowing
        ? await fetchWithAuthClient(`/api/follows/${targetUserId}`, {
            method: 'DELETE',
          })
        : await fetchWithAuthClient('/api/follows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ following_id: targetUserId }),
          })

      if (res.status === 401) return
      if (res.ok) {
        setIsFollowing(!isFollowing)
      } else {
        // 4xx/5xx を silent failure させない
        toast.error('フォロー状態の更新に失敗しました')
      }
    } catch {
      // ネットワーク断時の uncaught promise rejection を捕捉
      toast.error('通信エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
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
