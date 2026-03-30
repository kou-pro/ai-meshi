'use client'

import { useState } from 'react'

// コンポーネントが受け取るpropsの型定義
type Props = {
  recipeId: number
  initialBookmarked: boolean
}

export default function SaveButton({ recipeId, initialBookmarked }: Props) {
  // 保存済みかどうかの状態（楽観的UIのために使う）
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  // 通信中かどうか（連打防止のために使う）
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    // 通信中は何もしない（連打防止）
    if (isLoading) return

    setIsLoading(true)

    // 楽観的UI：APIの結果を待たずに先にUIを更新する
    setBookmarked((prev) => !prev)

    try {
      if (bookmarked) {
        // 保存済み → 解除する
        const res = await fetch(`/api/bookmarks/${recipeId}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          // 失敗したら元に戻す
          setBookmarked(true)
        }
      } else {
        // 未保存 → 保存する
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id: recipeId }),
        })
        if (!res.ok) {
          // 失敗したら元に戻す
          setBookmarked(false)
        }
      }
    } catch {
      // 通信エラーの場合も元に戻す
      setBookmarked((prev) => !prev)
    } finally {
      // 成功・失敗どちらでもローディングを解除する
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      style={{
        padding: '8px 16px',
        backgroundColor: bookmarked ? '#f59e0b' : '#e5e7eb',
        color: bookmarked ? '#ffffff' : '#374151',
        border: 'none',
        borderRadius: '8px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {bookmarked ? '★ 保存済み' : '☆ 保存する'}
    </button>
  )
}
