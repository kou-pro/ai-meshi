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
 *
 * # 連打抑止
 * fetch 中に連打されると liked state が更新される前に次の handleClick が
 * 古い liked を見て同じ method を送ってしまう (実例: 4 連打で全 DELETE)。
 * SaveButton / AddToShoppingListButton と同じ isLoading ガードパターンを採用。
 * disabled で視覚的にも操作不能であることを伝える。
 */
export default function LikeButton({
  recipeId,
  initialLiked,
  isLoggedIn,
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!isLoggedIn) {
      toast.error('いいねするにはログインが必要です')
      return
    }
    if (isLoading) return // 連打抑止: fetch 完了前のクリックは無視

    setIsLoading(true)
    try {
      const method = liked ? 'DELETE' : 'POST'
      const res = await fetchWithAuthClient(`/api/likes/${recipeId}`, {
        method,
      })

      if (res.status === 401) return
      if (!res.ok) {
        // 4xx/5xx を silent failure させない
        toast.error('いいねの更新に失敗しました')
        return
      }

      const data = await res.json()
      setLiked(data.liked_by_current_user)
    } catch {
      // ネットワーク断時の uncaught promise rejection を捕捉
      toast.error('通信エラーが発生しました')
    } finally {
      // ネットワーク断などで throw された場合も isLoading を必ず戻す
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`w-11 h-11 rounded-full bg-white/90 backdrop-blur-md shadow-md hover:bg-white hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
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
