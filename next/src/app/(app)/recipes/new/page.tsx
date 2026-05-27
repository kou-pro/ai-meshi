'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'
import RecipeGenerationModal from '@/components/RecipeGenerationModal'
import Dropdown from '@/components/Dropdown'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { Box, Heart, ArrowRight } from 'lucide-react'

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

const HOW_TO_STEPS = [
  {
    n: 1,
    title: '料理や食材を入力',
    desc: '冷蔵庫にある食材や、作りたい料理を自由に入力してください。',
  },
  {
    n: 2,
    title: '条件を選択',
    desc: '人数やジャンル、こだわり条件を選ぶと、より最適なレシピを提案します。',
  },
  {
    n: 3,
    title: 'レシピを生成',
    desc: 'AIがあなたにぴったりのレシピを提案します。',
  },
]

const POST_FLOW = [
  { Icon: SparklesIcon, label: 'レシピ生成' },
  { Icon: Box, label: '実際に作る' },
  { Icon: Heart, label: '写真・評価を追加' },
  { Icon: ArrowRight, label: '投稿して\nシェア' },
]

export default function NewRecipePage() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState('')
  const [servings, setServings] = useState<number | null>(null)
  const [genre, setGenre] = useState('')
  const [scene, setScene] = useState('')
  const [condition, setCondition] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

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
      setLoading(false)
      startTransition(() => {
        router.push(`/recipes/${data.id}`)
      })
      return
    }

    setError(data.error || 'レシピの生成に失敗しました')
    setLoading(false)
  }

  return (
    <>
      <RecipeGenerationModal isOpen={loading || isPending} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-2">
            <SparklesIcon className="w-7 h-7 text-green-600" />
            AIレシピ生成
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed px-4">
            食材や希望の条件を入力するだけで、
            {/* sm 未満 (モバイル) のみ改行を入れる: br を sm 以上で hidden に */}
            <br className="sm:hidden" />
            あなたにぴったりのレシピをご提案します。
          </p>
        </div>

        {/* Grid: 左メインフォーム + 右サイドバー (モバイルでは縦積み) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* ─── メインカード ─── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
            {/* 食材入力 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm font-semibold text-gray-800">
                  料理や食材を入力
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  必須
                </span>
              </div>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="例: キャベツ、豚バラ、卵"
                rows={5}
                className="w-full bg-white border-2 border-gray-200 focus:border-green-500 focus:outline-none rounded-lg px-4 py-3.5 text-sm placeholder:text-gray-400 resize-none transition-colors"
              />
            </div>

            {/* 2 列: 人数 + 料理ジャンル */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm font-semibold text-gray-800">
                    人数
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    任意
                  </span>
                </div>
                <Dropdown
                  value={servings ? `${servings}人分` : ''}
                  onChange={(v) => setServings(parseInt(v, 10))}
                  options={SERVINGS_OPTIONS}
                  placeholder="人数を選択"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm font-semibold text-gray-800">
                    料理ジャンル
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    任意
                  </span>
                </div>
                <Dropdown
                  value={genre}
                  onChange={setGenre}
                  options={GENRE_OPTIONS}
                  placeholder="指定なし"
                />
              </div>
            </div>

            {/* シーン (full width) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm font-semibold text-gray-800">
                  シーン
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  任意
                </span>
              </div>
              <Dropdown
                value={scene}
                onChange={setScene}
                options={SCENE_OPTIONS}
                placeholder="シーンを選択"
              />
            </div>

            {/* こだわり: チップ式 (単一選択、再タップで解除) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm font-semibold text-gray-800">
                  こだわり
                </span>
                <span className="ml-auto text-xs text-gray-400 font-medium">
                  1つ選択
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map((c) => {
                  const selected = condition === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(selected ? '' : c)}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium border-2 transition-all ${
                        selected
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 共有トグル: タイトル + 説明文付き */}
            <div
              className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg cursor-pointer mb-6 select-none"
              onClick={() => setIsPublished(!isPublished)}
            >
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">
                  完成したらみんなに共有する
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  作ったレシピがフィードに投稿されます
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublished}
                aria-label="完成したらみんなに共有する"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPublished(!isPublished)
                }}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
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

            {/* 送信ボタン + ヒント */}
            <div>
              <button
                onClick={handleSubmit}
                disabled={loading || !ingredients.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 transition-all disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-5 h-5" />
                {loading ? '生成中...' : 'レシピを作ってもらう'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2.5">
                通常 5〜10秒で生成されます
              </p>
            </div>
          </div>

          {/* ─── 右サイドバー (モバイルでは下に積み重なる) ─── */}
          <aside className="flex flex-col gap-5">
            {/* 使い方 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="flex items-center gap-2.5 text-sm font-bold text-gray-800 mb-3">
                <span className="w-1 h-3.5 bg-green-500 rounded" />
                使い方
              </h3>
              {HOW_TO_STEPS.map((s, i) => (
                <div key={s.n} className="flex gap-3 py-1.5 relative">
                  {i < HOW_TO_STEPS.length - 1 && (
                    <div className="absolute left-3.25 top-8 -bottom-0.5 border-l border-dashed border-gray-200" />
                  )}
                  <div className="shrink-0 w-6.5 h-6.5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold z-10">
                    {s.n}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[13px] font-bold text-gray-800 mb-1">
                      {s.title}
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 投稿までの流れ */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="flex items-center gap-2.5 text-sm font-bold text-gray-800 mb-3">
                <span className="w-1 h-3.5 bg-green-500 rounded" />
                投稿までの流れ
              </h3>
              <div className="flex items-start justify-between gap-1 mb-3">
                {POST_FLOW.map(({ Icon, label }, i) => (
                  <Fragment key={label}>
                    <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-[11px] text-gray-700 font-medium leading-relaxed whitespace-pre-line">
                        {label}
                      </div>
                    </div>
                    {i < POST_FLOW.length - 1 && (
                      <div className="text-gray-300 text-base pt-2.5">›</div>
                    )}
                  </Fragment>
                ))}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed m-0">
                作ったレシピをシェアして、他のユーザーとつながりましょう!
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
