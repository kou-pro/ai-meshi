'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Comment = {
  id: number
  body: string
  created_at: string
  user: {
    id: number
    name: string
  }
}

type Props = {
  recipeId: number
  initialComments: Comment[]
  isLoggedIn: boolean
  currentUserId: number | null
}

export default function CommentSection({
  recipeId,
  initialComments,
  isLoggedIn,
  currentUserId,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // コメント投稿
  const handleSubmit = async () => {
    if (!body.trim()) return
    setLoading(true)
    setError('')

    const res = await fetchWithAuthClient(`/api/comments/${recipeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: { body } }),
    })

    if (res.status === 401) {
      setLoading(false)
      return
    }
    if (res.ok) {
      const newComment = await res.json()
      setComments([newComment, ...comments])
      setBody('')
    } else {
      const data = await res.json()
      setError(data.errors?.[0] || 'コメントの投稿に失敗しました')
    }
    setLoading(false)
  }

  // コメント削除
  const handleDelete = async (commentId: number) => {
    if (!confirm('削除しますか？')) return

    const res = await fetchWithAuthClient(`/api/comments/${recipeId}/${commentId}`, {
      method: 'DELETE',
    })

    if (res.status === 401) {
      return
    }
    if (res.ok) {
      setComments(comments.filter((c) => c.id !== commentId))
    } else {
      alert('削除に失敗しました')
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">コメント</h2>

      {/* 投稿フォーム */}
      {isLoggedIn ? (
        <div className="mb-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="コメントを入力してください（300文字以内）"
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={3}
            maxLength={300}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || !body.trim()}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '投稿中...' : 'コメントする'}
          </button>
        </div>
      ) : (
        <p className="text-gray-500 mb-6">
          コメントするには
          <a href="/login" className="text-green-600 hover:underline mx-1">
            ログイン
          </a>
          してください
        </p>
      )}

      {/* コメント一覧 */}
      {comments.length === 0 ? (
        <p className="text-gray-500">まだコメントはありません</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-sm">
                    {comment.user.name}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                {/* 削除ボタン（自分のコメントのみ表示） */}
                {currentUserId === comment.user.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-400 text-sm hover:text-red-600"
                  >
                    削除
                  </button>
                )}
              </div>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
