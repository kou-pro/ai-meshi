'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // 既存のレシピデータを取得
  useEffect(() => {
    const fetchRecipe = async () => {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'GET',
      })
      if (res.ok) {
        const data = await res.json()
        setTitle(data.title)
        setContent(data.content ?? '')
      }
      setFetching(false)
    }
    fetchRecipe()
  }, [id])

  // 編集を保存
  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)

    // FormDataを使って画像も一緒に送る
    const formData = new FormData()
    formData.append('recipe[title]', title)
    formData.append('recipe[content]', content)
    if (image) {
      formData.append('recipe[image]', image)
    }

    const res = await fetch(`/api/recipes/${id}`, {
      method: 'PATCH',
      body: formData,
      // Content-Typeはあえて指定しない
    })

    if (res.ok) {
      router.push('/recipes')
      router.refresh()
    } else {
      alert('更新に失敗しました')
    }
    setLoading(false)
  }

  if (fetching) return <p className="p-6">読み込み中...</p>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">レシピを編集</h1>

      {/* タイトル入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          タイトル
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* 内容入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          作り方
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* 画像アップロード */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          画像
        </label>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '保存中...' : '保存する'}
      </button>
    </div>
  )
}
