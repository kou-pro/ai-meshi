'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  recipeId: number
  isPublished: boolean
}

export default function RecipeOwnerActions({ recipeId, isPublished }: Props) {
  const router = useRouter()
  const [published, setPublished] = useState(isPublished)
  const [loading, setLoading] = useState(false)

  // 削除処理
  const handleDelete = async () => {
    if (!confirm('削除しますか？')) return
    setLoading(true)

    const res = await fetchWithAuthClient(`/api/recipes/${recipeId}`, {
      method: 'DELETE',
    })

    if (res.status === 401) {
      setLoading(false)
      return
    }
    if (res.ok) {
      router.push('/recipes')
    } else {
      toast.error('削除に失敗しました')
    }
    setLoading(false)
  }

  // 公開/非公開切り替え処理
  const handleTogglePublish = async () => {
    setLoading(true)

    const res = await fetchWithAuthClient(`/api/recipes/${recipeId}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !published }),
    })

    if (res.status === 401) {
      setLoading(false)
      return
    }
    if (res.ok) {
      setPublished(!published)
    } else {
      toast.error('切り替えに失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
      <p className="text-xs text-gray-500 mb-3 font-semibold">管理メニュー</p>
      <div className="flex gap-2 flex-wrap">
        {/* 編集リンク */}
        <Link
          href={`/recipes/${recipeId}/edit`}
          className="px-4 py-1.5 rounded text-[13px] border border-gray-300 bg-white text-gray-700 no-underline"
        >
          編集
        </Link>

        {/* 公開/非公開切り替えボタン */}
        <button
          onClick={handleTogglePublish}
          disabled={loading}
          className={`px-4 py-1.5 rounded text-[13px] border ${published ? 'border-gray-300 bg-white text-gray-500' : 'border-green-600 bg-green-50 text-green-600'}`}
        >
          {published ? '非公開にする' : '公開する'}
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-1.5 rounded text-[13px] border border-red-300 bg-red-50 text-red-500"
        >
          削除
        </button>
      </div>
    </div>
  )
}
