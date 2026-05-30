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
 *
 * # アクセシビリティ (WAI-ARIA APG menu pattern 完全準拠)
 * - トリガー: aria-haspopup="menu" + aria-expanded
 * - メニュー: role="menu" + role="menuitem" + roving tabindex
 * - キー操作:
 *   - Enter / Space: トリガーで開く / メニュー項目で実行
 *   - ↓ (ArrowDown): 次の項目 (循環)
 *   - ↑ (ArrowUp): 前の項目 (循環)
 *   - Home: 最初の項目
 *   - End: 最後の項目
 *   - Escape: メニューを閉じてトリガーへ focus 復帰
 *   - 外側クリック: メニューを閉じる
 * - 開いた直後に最初の menuitem へ自動 focus
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 外側クリック / Escape で閉じる + Escape はトリガーに focus 復帰
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // メニューを開いた直後に最初の menuitem へ自動 focus (APG menu pattern)
  useEffect(() => {
    if (!open) return
    const firstItem = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]',
    )
    firstItem?.focus()
  }, [open])

  // メニュー内の矢印キー / Home / End ナビゲーション
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    )
    if (items.length === 0) return

    const currentIndex = items.findIndex((el) => el === document.activeElement)
    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowDown':
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
        nextIndex =
          currentIndex < 0
            ? items.length - 1
            : (currentIndex - 1 + items.length) % items.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = items.length - 1
        break
      default:
        return
    }
    e.preventDefault()
    items[nextIndex]?.focus()
  }

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
      {/* トリガー: レシピ管理メニュー */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 hover:text-gray-900 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="レシピ管理メニュー"
        title="管理メニュー"
      >
        <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* ドロップダウン (右上から下方向に展開)
          矢印キーナビゲーションは menu div で受ける */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          <Link
            href={`/recipes/${recipeId}/edit`}
            role="menuitem"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none no-underline"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
            編集
          </Link>

          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={handleTogglePublish}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:opacity-60"
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
            tabIndex={-1}
            onClick={handleDelete}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 focus:bg-red-50 focus:outline-none disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            削除
          </button>
        </div>
      )}
    </div>
  )
}
