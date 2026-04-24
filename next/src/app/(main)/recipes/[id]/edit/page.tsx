'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import StarInput from '@/components/StarInput'

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
  const [tasteScore, setTasteScore] = useState(0)
  const [easeScore, setEaseScore] = useState(0)
  const [costScore, setCostScore] = useState(0)

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
        setTasteScore(data.taste_score ?? 0)
        setEaseScore(data.ease_score ?? 0)
        setCostScore(data.cost_score ?? 0)
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

    // formDataとスコアを別々に送る
    // まずタイトル・手順・画像をformDataで送る
    const res = await fetch(`/api/recipes/${id}`, {
      method: 'PATCH',
      body: formData,
    })

    // スコアは別途JSONで送る
    await fetch(`/api/recipes/${id}/score`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taste_score: tasteScore,
        ease_score: easeScore,
        cost_score: costScore,
      }),
    })

    if (res.ok) {
      router.refresh()
      router.push(`/recipes/${id}`)
    } else {
      toast.error('更新に失敗しました')
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
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* 作り方（手順ごとに分割） */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作り方
        </label>
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2 mb-2 items-start">
            {/* 手順番号 */}
            <span className="shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-2">
              {index + 1}
            </span>

            {/* テキストエリア */}
            <textarea
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={`手順${index + 1}を入力`}
            />

            {/* 削除ボタン */}
            <button
              onClick={() => handleRemoveStep(index)}
              disabled={steps.length === 1}
              className="shrink-0 px-2 py-1 rounded border border-red-300 bg-red-50 text-red-500 mt-2 text-xs disabled:opacity-50"
            >
              削除
            </button>
          </div>
        ))}

        {/* 手順追加ボタン */}
        <button
          onClick={handleAddStep}
          className="mt-2 px-4 py-1.5 rounded border border-green-600 bg-green-50 text-green-600 text-[13px]"
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
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1.5">現在の画像</p>
            <img
              src={currentImageUrl.replace(
                'http://rails:3000',
                process.env.NEXT_PUBLIC_RAILS_URL,
              )}
              alt="現在の画像"
              className="w-full h-[200px] object-cover rounded-lg"
            />
          </div>
        )}

        <p className="text-xs text-gray-500 mb-1.5">
          新しい画像を選択すると差し替えられます
        </p>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* 投稿者評価 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="text-sm font-bold text-gray-700 mb-3">投稿者評価</h2>
        <div className="space-y-2">
          <StarInput
            label="美味しさ"
            value={tasteScore}
            onChange={setTasteScore}
          />
          <StarInput label="手軽さ" value={easeScore} onChange={setEaseScore} />
          <StarInput label="コスパ" value={costScore} onChange={setCostScore} />
        </div>
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '保存中...' : '保存する'}
      </button>
    </div>
  )
}
