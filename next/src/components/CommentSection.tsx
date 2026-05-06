'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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

/**
 * コメントセクション。
 * 詳細ページ側で「コメント」見出しを表示するため、本コンポーネント内には
 * 見出し (h2) は持たず、入力フォームと一覧のみを描画する。
 */
export default function CommentSection({
  recipeId,
  initialComments,
  isLoggedIn,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!body.trim()) return
    setLoading(true)
    setError('')

    // fetchWithAuthClient 自体の throw (ネットワーク断) も含めて全体を try で囲む。
    // res.json() も応答が JSON でない場合 (500 HTML エラーページ等) に throw するため
    // 同じ try ブロックで捕捉する。
    try {
      const res = await fetchWithAuthClient(`/api/comments/${recipeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: { body } }),
      })

      if (res.status === 401) return

      if (res.ok) {
        const newComment = await res.json()
        setComments([newComment, ...comments])
        setBody('')
        // page.tsx メタ行のコメント件数バッジを更新するため Server Component を再取得
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.errors?.[0] || 'コメントの投稿に失敗しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('削除しますか？')) return

    try {
      const res = await fetchWithAuthClient(
        `/api/comments/${recipeId}/${commentId}`,
        {
          method: 'DELETE',
        },
      )

      if (res.status === 401) return
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
        // page.tsx メタ行のコメント件数バッジを更新するため Server Component を再取得
        router.refresh()
      } else {
        toast.error('削除に失敗しました')
      }
    } catch {
      // ネットワーク断時の uncaught promise rejection を捕捉
      toast.error('通信エラーが発生しました')
    }
  }

  return (
    <div>
      {/* 投稿フォーム */}
      {isLoggedIn ? (
        <div className="mb-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="コメントを入力してください（300文字以内）"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={3}
            maxLength={300}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !body.trim()}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '投稿中...' : 'コメントする'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          コメントするには
          <a href="/login" className="text-green-600 hover:underline mx-1">
            ログイン
          </a>
          してください
        </p>
      )}

      {/* コメント一覧
          - 左上: 丸アバター
          - アバターの右: 名前
          - 名前の下: コメント本文
          - 右上: 投稿日時 (日付 + 時刻)
          - 自分のコメントなら日時の右にゴミ箱アイコン */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">まだコメントはありません</p>
      ) : (
        <ul className="space-y-3 list-none p-0">
          {comments.map((comment) => {
            const isMine = currentUserId === comment.user.id
            const dateTimeLabel = new Date(comment.created_at).toLocaleString(
              'ja-JP',
              {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              },
            )
            return (
              <li
                key={comment.id}
                className="border border-gray-100 rounded-lg p-3"
              >
                <div className="flex items-start gap-2.5">
                  {/* 左上: 丸アバター */}
                  <div className="shrink-0 w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-base">
                    👤
                  </div>

                  {/* 右側コンテンツ */}
                  <div className="flex-1 min-w-0">
                    {/* ヘッダ行: 左に名前 / 右に日時 + (自分なら) 削除アイコン */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {comment.user.name}
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {dateTimeLabel}
                        </span>
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="コメントを削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 名前の下にコメント本文 */}
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {comment.body}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
