'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'
import RecipeGenerationModal from '@/components/RecipeGenerationModal'
import Dropdown from '@/components/Dropdown'
import { SparklesIcon } from '@heroicons/react/24/outline'

const SERVINGS_OPTIONS = ['1人分', '2人分', '3人分', '4人分', '5人分']
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
  const [condition, setCondition] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  const router = useRouter()

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
        // API は配列を期待しているので互換のため配列で送る
        conditions: condition ? [condition] : [],
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
    <>
      <RecipeGenerationModal isOpen={loading} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* カード本体 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8">
          {/* タイトル */}
          <div className="flex items-center gap-2 mb-6">
            <SparklesIcon className="w-6 h-6 text-green-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              AIレシピ生成
            </h1>
          </div>

          {/* 食材入力 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作りたい料理や食材を入力してください
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="例：卵、玉ねぎ、醤油"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={5}
            />
          </div>

          {/* 人数 */}
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-800 mb-2">人数</p>
            <Dropdown
              value={servings ? `${servings}人分` : ''}
              onChange={(v) => setServings(parseInt(v, 10))}
              options={SERVINGS_OPTIONS}
              placeholder="人数を選択"
            />
          </div>

          {/* 料理ジャンル */}
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-800 mb-2">料理ジャンル</p>
            <Dropdown
              value={genre}
              onChange={setGenre}
              options={GENRE_OPTIONS}
              placeholder="料理ジャンルを選択"
            />
          </div>

          {/* シーン */}
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-800 mb-2">シーン</p>
            <Dropdown
              value={scene}
              onChange={setScene}
              options={SCENE_OPTIONS}
              placeholder="シーンを選択"
            />
          </div>

          {/* こだわり条件 */}
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-800 mb-2">こだわり条件</p>
            <Dropdown
              value={condition}
              onChange={setCondition}
              options={CONDITION_OPTIONS}
              placeholder="こだわり条件を選択"
            />
          </div>

          {/* 公開/非公開トグルスイッチ（スイッチ部分だけがクリック可能） */}
          <div className="mb-6 flex items-center justify-between text-sm font-bold text-gray-800 select-none">
            <span>生成後に投稿する</span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              aria-label="生成後に投稿する"
              onClick={() => setIsPublished(!isPublished)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                isPublished ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isPublished ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* エラーメッセージ */}
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

          {/* 生成ボタン */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '生成中...' : 'レシピを生成する'}
          </button>
        </div>
      </div>
    </>
  )
}
