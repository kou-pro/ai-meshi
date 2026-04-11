'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

const SERVINGS_OPTIONS = [1, 2, 3, 4, 5]
const GENRE_OPTIONS = ['和食', '洋食', '中華', '韓国風']
const SCENE_OPTIONS = [
  '朝ごはん',
  '昼ごはん',
  '晩ごはん',
  'お弁当',
  '作り置き',
  'おつまみ',
]
const CONDITION_OPTIONS = [
  '時短',
  '節約',
  'ヘルシー',
  '簡単',
  '洗い物少なめ',
  '10分以内',
]

export default function NewRecipePage() {
  const [ingredients, setIngredients] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [servings, setServings] = useState<number | null>(null)
  const [genre, setGenre] = useState('')
  const [scene, setScene] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [openGenre, setOpenGenre] = useState(false)
  const [openScene, setOpenScene] = useState(false)
  const [openConditions, setOpenConditions] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  const router = useRouter()

  const toggleCondition = (value: string) => {
    setConditions((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    )
  }

  const handleSubmit = async () => {
    if (!ingredients.trim()) return

    setLoading(true)
    setError('')

    const res = await fetchWithAuthClient('/api/recipes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients,
        servings,
        genre,
        scene,
        conditions,
        is_published: isPublished,
      }),
    })

    if (res.status === 401) {
      setLoading(false)
      return
    }

    const data = await res.json()

    if (res.ok) {
      router.push(`/recipes/${data.id}`)
    } else {
      setError(data.error || 'レシピの生成に失敗しました')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AIレシピ生成</h1>

      {/* 食材入力 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          食材を入力してください
        </label>
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="例：卵、玉ねぎ、醤油"
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={4}
        />
      </div>

      {/* 人数 */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">人数</p>
        <div className="flex gap-2 flex-wrap">
          {SERVINGS_OPTIONS.map((num) => (
            <button
              key={num}
              onClick={() => setServings(servings === num ? null : num)}
              className={`px-4 py-2 rounded-lg border-2 ${servings === num ? 'border-green-600 bg-green-50 text-green-600 font-semibold' : 'border-gray-300 bg-white text-gray-500'}`}
            >
              {num}人分
            </button>
          ))}
        </div>
      </div>

      {/* 料理ジャンル */}
      <div className="mb-4">
        <button
          onClick={() => setOpenGenre(!openGenre)}
          className="w-full flex justify-between p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-semibold"
        >
          <span>料理ジャンル{genre && `：${genre}`}</span>
          <span>{openGenre ? '▲' : '▼'}</span>
        </button>
        {openGenre && (
          <div className="flex gap-2 flex-wrap p-3 border border-gray-300 border-t-0 rounded-b-lg">
            {GENRE_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(genre === g ? '' : g)}
                className={`px-4 py-2 rounded-full border-2 text-[13px] ${genre === g ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-500'}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* シーン */}
      <div className="mb-4">
        <button
          onClick={() => setOpenScene(!openScene)}
          className="w-full flex justify-between p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-semibold"
        >
          <span>シーン{scene && `：${scene}`}</span>
          <span>{openScene ? '▲' : '▼'}</span>
        </button>
        {openScene && (
          <div className="flex gap-2 flex-wrap p-3 border border-gray-300 border-t-0 rounded-b-lg">
            {SCENE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setScene(scene === s ? '' : s)}
                className={`px-4 py-2 rounded-full border-2 text-[13px] ${scene === s ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* こだわり条件 */}
      <div className="mb-6">
        <button
          onClick={() => setOpenConditions(!openConditions)}
          className="w-full flex justify-between p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-semibold"
        >
          <span>
            こだわり条件{conditions.length > 0 && `：${conditions.join('・')}`}
          </span>
          <span>{openConditions ? '▲' : '▼'}</span>
        </button>
        {openConditions && (
          <div className="flex gap-2 flex-wrap p-3 border border-gray-300 border-t-0 rounded-b-lg">
            {CONDITION_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => toggleCondition(c)}
                className={`px-4 py-2 rounded-full border-2 text-[13px] ${conditions.includes(c) ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-500'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 公開/非公開チェックボックス  */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          生成後に公開する
        </label>
      </div>

      {/* エラーメッセージ */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* 生成ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? '生成中...' : 'レシピを生成する'}
      </button>
    </div>
  )
}
