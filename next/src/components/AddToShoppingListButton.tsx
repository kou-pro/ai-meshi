'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  recipeId: number
  ingredients: {
    name: string
    quantity: string
    unit: string
    category: string
  }[]
}

/**
 * 「買い物リストに追加」ボタン。
 * 業界標準 (Cookpad / DELISH KITCHEN / NYT Cooking 等) に倣い、
 * 詳細ページの材料セクション下にだけ配置する。
 */
export default function AddToShoppingListButton({
  recipeId,
  ingredients,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'added'>('idle')

  // 「追加しました」表示を 3 秒後に idle へ戻すタイマー。
  // unmount 時に cleartTimeout してリーク警告を防ぐ。
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const handleAdd = async () => {
    setStatus('loading')

    // 集約モデル (Shopify Cart 等の業界標準) に移行したため、サーバ側で
    // 同一キーを upsert (quantity 加算) する。クライアントは「すでに追加済みです」
    // 409 を考慮する必要が無くなり、force パラメータ・confirm ダイアログを撤廃。
    // 再度ボタンを押せば自然に quantity が加算される設計。
    try {
      const res = await fetchWithAuthClient('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipeId,
          ingredients,
        }),
      })

      if (res.status === 401) return

      if (res.ok) {
        setStatus('added')
        // 既存タイマーがあればキャンセルしてから新規予約 (連打対策)
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
        resetTimerRef.current = setTimeout(() => setStatus('idle'), 3000)
        return
      }

      // 4xx/5xx は silent failure せず toast でユーザーに通知 (Next.js 公式: event handler 内エラーは UI で伝える)
      toast.error('買い物リストへの追加に失敗しました')
    } catch {
      // ネットワーク断時の uncaught promise rejection を捕捉
      toast.error('通信エラーが発生しました')
    } finally {
      // status が 'added' に遷移した場合は idle に戻さない (3 秒間「追加しました」表示が必要)
      setStatus((prev) => (prev === 'added' ? 'added' : 'idle'))
    }
  }

  const isAdded = status === 'added'
  const isLoading = status === 'loading'

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isLoading}
      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60 ${
        isAdded
          ? 'border-green-500 bg-green-50 text-green-600'
          : 'border-green-500 bg-white text-green-600 hover:bg-green-50'
      }`}
    >
      {isAdded ? (
        <Check className="w-4 h-4" />
      ) : (
        <ShoppingCart className="w-4 h-4" />
      )}
      {isLoading
        ? '追加中...'
        : isAdded
          ? '追加しました'
          : '買い物リストに追加'}
    </button>
  )
}
