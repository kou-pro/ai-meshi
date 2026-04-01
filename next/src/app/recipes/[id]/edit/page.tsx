'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const [title, setTitle] = useState('')
  const [steps, setSteps] = useState<string[]>([''])
  const [image, setImage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
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
        // stepsが配列で来た場合はそのまま・空なら1つ空欄を用意
        setSteps(
          Array.isArray(data.steps) && data.steps.length > 0
            ? data.steps
            : [''],
        )
        // 現在画像URLを保存
        setCurrentImageUrl(data.image_url ?? null)
      }
      setFetching(false)
    }
    fetchRecipe()
  }, [id])

  // 手順の変更
  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
  }

  // 手順を追加
  const handleAddStep = () => {
    setSteps([...steps, ''])
  }

  // 手順を削除
  const handleRemoveStep = (index: number) => {
    if (steps.length === 1) return
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps)
  }

  // 編集を保存
  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)

    const formData = new FormData()
    formData.append('recipe[title]', title)

    // 空の手順を除外してから送る
    const filteredSteps = steps.map((s) => s.trim()).filter((s) => s !== '')
    filteredSteps.forEach((step) => {
      formData.append('recipe[steps][]', step)
    })

    if (image) {
      formData.append('recipe[image]', image)
    }

    const res = await fetch(`/api/recipes/${id}`, {
      method: 'PATCH',
      body: formData,
    })

    if (res.ok) {
      router.refresh()
      router.push(`/recipes/${id}`)
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

      {/* 作り方（手順ごとに分割） */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作り方
        </label>
        {steps.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px',
              alignItems: 'flex-start',
            }}
          >
            {/* 手順番号 */}
            <span
              style={{
                flexShrink: 0,
                width: '24px',
                height: '24px',
                backgroundColor: '#22c55e',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                marginTop: '8px',
              }}
            >
              {index + 1}
            </span>

            {/* テキストエリア */}
            <textarea
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder={`手順${index + 1}を入力`}
            />

            {/* 削除ボタン */}
            <button
              onClick={() => handleRemoveStep(index)}
              disabled={steps.length === 1}
              style={{
                flexShrink: 0,
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #fca5a5',
                backgroundColor: '#fff1f2',
                color: '#ef4444',
                cursor: steps.length === 1 ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                fontSize: '12px',
              }}
            >
              削除
            </button>
          </div>
        ))}

        {/* 手順追加ボタン */}
        <button
          onClick={handleAddStep}
          style={{
            marginTop: '8px',
            padding: '6px 16px',
            borderRadius: '6px',
            border: '1px solid #16a34a',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          ＋ 手順を追加
        </button>
      </div>

      {/* 画像 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          画像
        </label>

        {/* 現在の画像を表示 */}
        {currentImageUrl && (
          <div style={{ marginBottom: '12px' }}>
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '6px',
              }}
            >
              現在の画像
            </p>
            <img
              src={currentImageUrl.replace(
                'http://rails:3000',
                'http://localhost:3000',
              )}
              alt="現在の画像"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
          </div>
        )}

        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
          新しい画像を選択すると差し替えられます
        </p>
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
