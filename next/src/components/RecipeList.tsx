'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Recipe } from '@/lib/fetchRecipes'

type Props = {
  recipes: Recipe[]
}

export default function RecipeList({ recipes }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  // 削除
  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    setLoadingId(id)

    const res = await fetch(`/api/recipes/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      router.refresh()
    } else {
      alert('削除に失敗しました')
    }
    setLoadingId(null)
  }

  // 公開
  const handlePublish = async (id: number) => {
    if (!confirm('投稿しますか？')) return
    setLoadingId(id)

    const res = await fetch(`/api/recipes/${id}/publish`, {
      method: 'PATCH',
    })

    if (res.ok) {
      router.refresh()
    } else {
      alert('投稿に失敗しました')
    }
    setLoadingId(null)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">レシピ一覧</h1>

      {recipes.length === 0 && (
        <p className="text-gray-500">まだレシピがありません</p>
      )}

      <ul className="space-y-4">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-lg font-semibold">{recipe.title}</h2>

            {recipe.content && (
              <p className="text-gray-600 mt-1">{recipe.content}</p>
            )}

            {/* 公開状態の表示 */}
            <span
              className={`text-sm mt-2 inline-block ${recipe.is_published ? 'text-green-600' : 'text-gray-400'}`}
            >
              {recipe.is_published ? '公開中' : '未公開'}
            </span>

            {/* ボタン群 */}
            <div className="flex gap-2 mt-3">
              {/* 未公開のときだけ投稿ボタンを表示 */}
              {!recipe.is_published && (
                <button
                  onClick={() => handlePublish(recipe.id)}
                  disabled={loadingId === recipe.id}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  投稿する
                </button>
              )}

              {/* 編集ボタン */}
              <button
                onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
                disabled={loadingId === recipe.id}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                編集
              </button>

              {/* 削除ボタン */}
              <button
                onClick={() => handleDelete(recipe.id)}
                disabled={loadingId === recipe.id}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
