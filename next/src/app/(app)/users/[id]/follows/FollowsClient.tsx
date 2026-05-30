'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'
import FollowButton from '@/components/FollowButton'

type UserItem = {
  id: number
  name: string
  image_url: string | null
  is_followed_by_me: boolean
}

type Props = {
  profileUserId: string
  currentUserId: number
  initialTab: 'following' | 'followers'
  initialUsers: UserItem[]
}

export default function FollowsClient({
  profileUserId,
  currentUserId,
  initialTab,
  initialUsers,
}: Props) {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(
    initialTab,
  )
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [isLoading, setIsLoading] = useState(false)

  // 初回 render では Server から渡された initialUsers を使うため fetch しない。
  // 旧実装は `if (activeTab === initialTab) return` で初回判定していたが、
  // タブ往復 (initialTab → 別タブ → initialTab に戻る) で fetch が走らず、
  // 古い state がそのまま残るバグがあった。ref で「初回だけ」を厳密に判定する。
  //
  // 同時に React 公式の ignore flag パターンで race condition を回避する
  // (タブを高速切替したとき、古い fetch 結果が新しい表示を上書きしないように)。
  // 出典: https://react.dev/learn/synchronizing-with-effects#fetching-data
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    let ignore = false
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const res = await fetchWithAuthClient(
          `/api/users/${profileUserId}/${activeTab}`,
        )
        if (!ignore && res.ok) {
          const data = await res.json()
          setUsers(data)
        } else if (!ignore) {
          toast.error('ユーザー一覧の取得に失敗しました')
        }
      } catch {
        if (!ignore) toast.error('通信エラーが発生しました')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    fetchUsers()

    return () => {
      ignore = true
    }
  }, [activeTab, profileUserId])

  return (
    <div className="max-w-2xl mx-auto p-6">
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
          {activeTab === 'following'
            ? 'フォロー中のユーザーはいません'
            : 'フォロワーはいません'}
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
                  <Image
                    src={user.image_url}
                    alt={user.name}
                    width={40}
                    height={40}
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
                  initialIsFollowing={user.is_followed_by_me}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
