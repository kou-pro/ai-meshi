'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'
import UserAvatar from '@/components/UserAvatar'

type Comment = {
  id: number
  body: string
  created_at: string
  user: {
    id: number
    name: string
    image_url: string | null
  }
}

type Props = {
  recipeId: number
  initialComments: Comment[]
  isLoggedIn: boolean
  currentUserId: number | null
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('ja-JP', {
  numeric: 'auto',
})

const formatRelativeDateTime = (dateTime: string, now = Date.now()) => {
  const createdAt = new Date(dateTime).getTime()

  if (Number.isNaN(createdAt)) return ''

  const diffSeconds = Math.round((createdAt - now) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const toRelativeUnit = (secondsPerUnit: number) => {
    const value = Math.trunc(diffSeconds / secondsPerUnit)
    return value === 0 ? (diffSeconds < 0 ? -1 : 1) : value
  }

  if (absSeconds < 60) return 'たった今'
  if (absSeconds < 60 * 60) {
    return relativeTimeFormatter.format(toRelativeUnit(60), 'minute')
  }
  if (absSeconds < 60 * 60 * 24) {
    return relativeTimeFormatter.format(toRelativeUnit(3600), 'hour')
  }
  if (absSeconds < 60 * 60 * 24 * 7) {
    return relativeTimeFormatter.format(toRelativeUnit(86400), 'day')
  }

  return new Date(dateTime).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

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
            const relativeLabel = formatRelativeDateTime(comment.created_at)
            return (
              <li
                key={comment.id}
                className="border border-gray-100 rounded-lg p-3"
              >
                <div className="flex items-start gap-2.5">
                  <Link
                    href={`/users/${comment.user.id}`}
                    aria-label={`${comment.user.name}のプロフィール`}
                    className="shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <UserAvatar
                      imageUrl={comment.user.image_url}
                      name={comment.user.name}
                      size="md"
                    />
                  </Link>

                  {/* 右側コンテンツ */}
                  <div className="min-w-0 flex-1">
                    {/* ヘッダ行: 左に名前と日時 / 右に削除アイコン */}
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/users/${comment.user.id}`}
                          aria-label={`${comment.user.name}のプロフィール`}
                          className="block text-sm font-medium leading-5 text-gray-800 break-words transition-colors hover:text-green-600"
                        >
                          {comment.user.name}
                        </Link>
                        <time
                          dateTime={comment.created_at}
                          aria-label={dateTimeLabel}
                          className="mt-0.5 block text-xs leading-4 text-gray-400"
                        >
                          {relativeLabel || dateTimeLabel}
                        </time>
                      </div>
                      {isMine && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                          aria-label="コメントを削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
