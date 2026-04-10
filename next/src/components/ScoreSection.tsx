'use client'

import { useState } from 'react'
import StarInput from '@/components/StarInput'
import StarDisplay from '@/components/StarDisplay'

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
    await fetch(`/api/recipes/${recipeId}/score`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taste_score: tasteScore,
        ease_score: easeScore,
        cost_score: costScore,
      }),
    })
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
      <div className="space-y-2">
        {isOwner ? (
          <>
            <StarInput
              label="美味しさ"
              value={tasteScore}
              onChange={setTasteScore}
            />
            <StarInput
              label="手軽さ"
              value={easeScore}
              onChange={setEaseScore}
            />
            <StarInput
              label="コスパ"
              value={costScore}
              onChange={setCostScore}
            />
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
            <StarDisplay label="美味しさ" value={tasteScore} />
            <StarDisplay label="手軽さ" value={easeScore} />
            <StarDisplay label="コスパ" value={costScore} />
          </>
        )}
      </div>
    </div>
  )
}
