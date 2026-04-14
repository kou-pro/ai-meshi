'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'
import FollowButton from '@/components/FollowButton'

type UserItem = {
  id: number
  name: string
  image_url: string | null
}

export default function FollowsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params.id as string

  const initialTab = searchParams.get('tab') === 'followers' ? 'followers' : 'following'
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(initialTab)
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const res = await fetchWithAuthClient('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data.id)
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      const res = await fetchWithAuthClient(`/api/users/${userId}/${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
      setIsLoading(false)
    }
    fetchUsers()
  }, [userId, activeTab])

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 戻るリンク */}
      <Link
        href={`/users/${userId}`}
        className="text-sm text-gray-500 hover:text-green-600 mb-4 inline-block"
      >
        ← 戻る
      </Link>

      {/* タブ切り替え */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'following'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          フォロー中
        </button>
        <button
          onClick={() => setActiveTab('followers')}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'followers'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          フォロワー
        </button>
      </div>

      {/* ユーザー一覧 */}
      {isLoading ? (
        <p className="text-center text-gray-500">読み込み中...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-500">
          {activeTab === 'following' ? 'フォロー中のユーザーはいません' : 'フォロワーはいません'}
        </p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <Link
                href={`/users/${user.id}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                {user.image_url ? (
                  <img
                    src={user.image_url}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    👤
                  </div>
                )}
                <span className="text-sm font-medium">{user.name}</span>
              </Link>
              {currentUserId !== user.id && (
                <FollowButton
                  targetUserId={user.id}
                  initialIsFollowing={activeTab === 'following'}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
