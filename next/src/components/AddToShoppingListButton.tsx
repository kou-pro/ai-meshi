'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
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

  const handleAdd = async (force = false) => {
    setStatus('loading')

    const res = await fetchWithAuthClient('/api/shopping-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipe_id: recipeId,
        ingredients,
        force,
      }),
    })

    if (res.status === 401) {
      setStatus('idle')
      return
    }
    if (res.status === 409) {
      const confirmed = window.confirm(
        'このレシピはすでに買い物リストに追加されています。\nもう一度追加しますか？',
      )
      if (confirmed) {
        await handleAdd(true)
      } else {
        setStatus('idle')
      }
      return
    }

    if (res.ok) {
      setStatus('added')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('idle')
    }
  }

  const isAdded = status === 'added'
  const isLoading = status === 'loading'

  return (
    <button
      type="button"
      onClick={() => handleAdd(false)}
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
