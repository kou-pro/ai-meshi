'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  recipeId: number
  isPublished: boolean
}

/**
 * レシピオーナー専用の管理メニュー (詳細ページのタイトル右上)。
 *
 * # デザイン
 * Instagram / Twitter 等の「⋯」メニュー方式に準拠。
 * - 「⋯ 管理」ボタンをトリガー
 * - クリックで下方向にドロップダウンが展開
 * - 編集・公開/非公開切替・削除の 3 項目を縦並びで表示
 * - 外側クリックで閉じる
 *
 * # Server Component との同期
 * 公開状態の切替成功時は router.refresh() を呼ぶ。
 * 詳細ページ (page.tsx) は Server Component で recipe.is_published を
 * 描画しているため、Server 側を再取得しないと公開バッジ等の表示が
 * 古いままになる。Next.js 公式推奨の更新パターン。
 */
export default function RecipeOwnerActions({
  recipeId,
  isPublished,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // ネットワーク断時に fetch が throw すると loading=true が永続化するため、
  // 全 handler で try/finally で setLoading(false) を保証する。
  const handleDelete = async () => {
    setOpen(false)
    if (!confirm('削除しますか？')) return
    setLoading(true)

    try {
      const res = await fetchWithAuthClient(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      })

      if (res.status === 401) return
      if (res.ok) {
        router.push('/recipes')
      } else {
        toast.error('削除に失敗しました')
      }
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async () => {
    setOpen(false)
    setLoading(true)

    const next = !isPublished
    try {
      const res = await fetchWithAuthClient(`/api/recipes/${recipeId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: next }),
      })

      if (res.status === 401) return
      if (res.ok) {
        // Server Component (page.tsx) が描画する公開バッジ等を更新するため再取得
        router.refresh()
        toast.success(next ? '公開しました' : '非公開にしました')
      } else {
        toast.error('切り替えに失敗しました')
      }
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* トリガー: 「⋯ 管理」 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4" />
        管理
      </button>

      {/* ドロップダウン (右上から下方向に展開) */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          <Link
            href={`/recipes/${recipeId}/edit`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 no-underline"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
            編集
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleTogglePublish}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {isPublished ? (
              <EyeOff className="w-4 h-4 text-gray-500" />
            ) : (
              <Eye className="w-4 h-4 text-gray-500" />
            )}
            {isPublished ? '非公開にする' : '公開する'}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            削除
          </button>
        </div>
      )}
    </div>
  )
}
