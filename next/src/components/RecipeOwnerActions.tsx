'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

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

    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      router.push('/recipes')
    } else {
      alert('削除に失敗しました')
    }
    setLoading(false)
  }

  // 公開/非公開切り替え処理
  const handleTogglePublish = async () => {
    setLoading(true)

    const res = await fetch(`/api/recipes/${recipeId}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !published }),
    })

    if (res.ok) {
      setPublished(!published)
    } else {
      alert('切り替えに失敗しました')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        backgroundColor: '#f9fafb',
      }}
    >
      <p
        style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '12px',
          fontWeight: '600',
        }}
      >
        管理メニュー
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {/* 編集リンク */}
        <Link
          href={`/recipes/${recipeId}/edit`}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            color: '#374151',
            textDecoration: 'none',
          }}
        >
          編集
        </Link>

        {/* 公開/非公開切り替えボタン */}
        <button
          onClick={handleTogglePublish}
          disabled={loading}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid',
            borderColor: published ? '#d1d5db' : '#16a34a',
            backgroundColor: published ? '#ffffff' : '#dcfce7',
            color: published ? '#6b7280' : '#16a34a',
            cursor: 'pointer',
          }}
        >
          {published ? '非公開にする' : '公開する'}
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid #fca5a5',
            backgroundColor: '#fff1f2',
            color: '#ef4444',
            cursor: 'pointer',
          }}
        >
          削除
        </button>
      </div>
    </div>
  )
}
