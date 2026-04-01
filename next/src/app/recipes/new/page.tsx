'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

    const res = await fetch('/api/recipes/generate', {
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
          className="w-full p-3 border border-gray-300 rounded-lg"
          rows={4}
        />
      </div>

      {/* 人数 */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">人数</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SERVINGS_OPTIONS.map((num) => (
            <button
              key={num}
              onClick={() => setServings(servings === num ? null : num)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: servings === num ? '#16a34a' : '#d1d5db',
                backgroundColor: servings === num ? '#dcfce7' : '#ffffff',
                color: servings === num ? '#16a34a' : '#6b7280',
                fontWeight: servings === num ? '600' : '400',
                cursor: 'pointer',
              }}
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
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <span>料理ジャンル{genre && `：${genre}`}</span>
          <span>{openGenre ? '▲' : '▼'}</span>
        </button>
        {openGenre && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
            }}
          >
            {GENRE_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(genre === g ? '' : g)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '2px solid',
                  borderColor: genre === g ? '#16a34a' : '#d1d5db',
                  backgroundColor: genre === g ? '#dcfce7' : '#ffffff',
                  color: genre === g ? '#16a34a' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
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
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <span>シーン{scene && `：${scene}`}</span>
          <span>{openScene ? '▲' : '▼'}</span>
        </button>
        {openScene && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
            }}
          >
            {SCENE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setScene(scene === s ? '' : s)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '2px solid',
                  borderColor: scene === s ? '#16a34a' : '#d1d5db',
                  backgroundColor: scene === s ? '#dcfce7' : '#ffffff',
                  color: scene === s ? '#16a34a' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
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
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <span>
            こだわり条件{conditions.length > 0 && `：${conditions.join('・')}`}
          </span>
          <span>{openConditions ? '▲' : '▼'}</span>
        </button>
        {openConditions && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
            }}
          >
            {CONDITION_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => toggleCondition(c)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '2px solid',
                  borderColor: conditions.includes(c) ? '#16a34a' : '#d1d5db',
                  backgroundColor: conditions.includes(c)
                    ? '#dcfce7'
                    : '#ffffff',
                  color: conditions.includes(c) ? '#16a34a' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 公開/非公開チェックボックス  */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
          }}
        >
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          生成後に公開する
        </label>
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
