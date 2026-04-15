'use client'

import { useState } from 'react'
import { SparklesIcon, ClockIcon, CurrencyYenIcon } from '@heroicons/react/24/outline'
import StarInput from '@/components/StarInput'
import StarDisplay from '@/components/StarDisplay'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type Props = {
  recipeId: number
  isOwner: boolean
  initialTasteScore: number | null
  initialEaseScore: number | null
  initialCostScore: number | null
}

export default function ScoreSection({
  recipeId,
  isOwner,
  initialTasteScore,
  initialEaseScore,
  initialCostScore,
}: Props) {
  const [tasteScore, setTasteScore] = useState(initialTasteScore ?? 0)
  const [easeScore, setEaseScore] = useState(initialEaseScore ?? 0)
  const [costScore, setCostScore] = useState(initialCostScore ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await fetchWithAuthClient(`/api/recipes/${recipeId}/score`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taste_score: tasteScore,
        ease_score: easeScore,
        cost_score: costScore,
      }),
    })
    if (res.status === 401) {
      setSaving(false)
      return
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 全て0かつ自分のレシピでない場合は表示しない
  if (!isOwner && tasteScore === 0 && easeScore === 0 && costScore === 0) {
    return null
  }

  return (
    <div className="my-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <h2 className="text-sm font-bold text-gray-700 mb-3">投稿者評価</h2>
      <div className="space-y-3">
        {isOwner ? (
          <>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-orange-500" />
              <StarInput label="美味しさ" value={tasteScore} onChange={setTasteScore} />
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-blue-500" />
              <StarInput label="手軽さ" value={easeScore} onChange={setEaseScore} />
            </div>
            <div className="flex items-center gap-2">
              <CurrencyYenIcon className="w-4 h-4 text-green-600" />
              <StarInput label="コスパ" value={costScore} onChange={setCostScore} />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : saved ? '保存しました！' : '評価を保存'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-orange-500" />
              <StarDisplay label="美味しさ" value={tasteScore} />
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-blue-500" />
              <StarDisplay label="手軽さ" value={easeScore} />
            </div>
            <div className="flex items-center gap-2">
              <CurrencyYenIcon className="w-4 h-4 text-green-600" />
              <StarDisplay label="コスパ" value={costScore} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
