'use client'

import { useState } from 'react'

type Props = {
  recipeId: number
  ingredients: {
    name: string
    quantity: string
    unit: string
  }[]
}

export default function AddToShoppingListButton({
  recipeId,
  ingredients,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'added'>('idle')

  const handleAdd = async (force = false) => {
    setStatus('loading')

    const res = await fetch('/api/shopping-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipe_id: recipeId,
        ingredients,
        force,
      }),
    })

    if (res.status === 409) {
      // すでに追加済み → 確認ダイアログを出す
      const confirmed = window.confirm(
        'このレシピはすでに買い物リストに追加されています。\nもう一度追加しますか？',
      )
      if (confirmed) {
        // OKなら force: true で再リクエスト
        await handleAdd(true)
      } else {
        // キャンセルなら idle に戻す
        setStatus('idle')
      }
      return
    }

    if (res.ok) {
      setStatus('added')
      // 3秒後に idle に戻す（再追加できるように）
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('idle')
    }
  }

  const buttonConfig = {
    idle: {
      label: '🛒 買い物リストに追加',
      bg: '#ffffff',
      color: '#374151',
      border: '#d1d5db',
    },
    loading: {
      label: '追加中...',
      bg: '#f9fafb',
      color: '#9ca3af',
      border: '#d1d5db',
    },
    added: {
      label: '✓ 追加しました',
      bg: '#dcfce7',
      color: '#16a34a',
      border: '#16a34a',
    },
  }[status]

  return (
    <button
      onClick={() => handleAdd(false)}
      disabled={status === 'loading'}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: `1px solid ${buttonConfig.border}`,
        backgroundColor: buttonConfig.bg,
        color: buttonConfig.color,
        fontSize: '14px',
        fontWeight: '600',
        cursor: status === 'loading' ? 'default' : 'pointer',
      }}
    >
      {buttonConfig.label}
    </button>
  )
}
