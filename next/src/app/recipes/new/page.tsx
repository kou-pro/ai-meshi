'use client'
// フォームのsubmitはブラウザで発生するのでClient Component

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRecipePage() {
  // 食材の入力値を管理
  const [ingredients, setIngredients] = useState('')
  // 生成中のローディング状態を管理
  const [loading, setLoading] = useState(false)
  // エラーメッセージを管理
  const [error, setError] = useState('')

  const router = useRouter()

  const handleSubmit = async () => {
    // 食材が空の場合は送信しない
    if (!ingredients.trim()) return

    setLoading(true)
    setError('')

    // Route Handlerにリクエスト
    const res = await fetch('/api/recipes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingredients }),
    })

    if (res.ok) {
      // 生成成功 → レシピ一覧に遷移
      router.push('/recipes')
      router.refresh() // 一覧を最新状態に更新
    } else {
      // エラーの場合はメッセージを表示
      const data = await res.json()
      setError(data.error || 'レシピの生成に失敗しました')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AIレシピ生成</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          食材を入力してください
        </label>
        {/* 食材の入力欄 */}
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="例：卵、玉ねぎ、醤油"
          className="w-full p-3 border border-gray-300 rounded-lg"
          rows={4}
        />
      </div>

      {/* エラーメッセージ */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* 生成ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? '生成中...' : 'レシピを生成する'}
      </button>
    </div>
  )
}
