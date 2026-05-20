'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'
import FollowButton from '@/components/FollowButton'

type UserItem = {
  id: number
  name: string
  image_url: string | null
}

type Props = {
  profileUserId: string
  currentUserId: number
  initialTab: 'following' | 'followers'
  initialUsers: UserItem[]
}

/**
 * フォロー/フォロワー一覧（Client Component）。
 *
 * # 設計
 * - 親 Server Component から props で初期データ（currentUserId / initialUsers）を受け取る。
 * - タブ切替時のみクライアントサイドで再 fetch（既に認証済みのため 401 リスク低）。
 *
 * # 認証データの取り扱い
 * `currentUserId` は Server で確実に取得済みなので、本コンポーネントは
 * 認証 API を叩かない。
 */
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

  // 初期ロードは Server から渡された initialUsers を使うので、
  // タブが initialTab と異なるときだけ fetch する。
  useEffect(() => {
    if (activeTab === initialTab) return

    const fetchUsers = async () => {
      setIsLoading(true)
      const res = await fetchWithAuthClient(
        `/api/users/${profileUserId}/${activeTab}`,
      )
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
      setIsLoading(false)
    }
    fetchUsers()
  }, [activeTab, initialTab, profileUserId])

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
                  // eslint-disable-next-line @next/next/no-img-element
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
