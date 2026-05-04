'use client'

import { useEffect, useRef, useState } from 'react'
import {
  SparklesIcon,
  ClockIcon,
  CurrencyYenIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
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

/**
 * 投稿者評価の星 3 軸セクション。
 *
 * # オートセーブ方針
 * 業界標準 (NN/g, ui-patterns) に倣い、星クリックで即保存。
 * 「single widget では autosave が intuitive」という UX 原則に従い、
 * 「評価を保存」ボタンは廃止。星をクリックする = 評価する = 即保存、
 * という直感的な体験を提供する。
 *
 * # フィードバック
 * 連続クリック (3 軸を立て続けに変える) で API を連打しないよう、
 * 600ms のデバウンスをかけて最後のクリック後にまとめて保存する。
 * 保存完了時に sonner のトーストでユーザーに通知する。
 */
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

  // 連続クリック対策: 最後のクリックから 600ms 経過後に保存実行
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // アンマウント時にデバウンスタイマーを片付ける。
  // 600ms 以内に画面遷移した場合、消えたコンポーネントの中で setTimeout が
  // 発火するのを防ぐため (将来 saveScores 内で setState を行うようになった
  // 場合の "Can't perform a React state update on an unmounted component"
  // 警告を未然に防止)。
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const saveScores = async (taste: number, ease: number, cost: number) => {
    const res = await fetchWithAuthClient(`/api/recipes/${recipeId}/score`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taste_score: taste,
        ease_score: ease,
        cost_score: cost,
      }),
    })
    if (res.status === 401) return
    // 成功時はサイレント (Google Docs / Figma / Notion 等の業界標準)
    // 星の色変化自体が視覚的フィードバックになるため、
    // クリックの度にトーストを出すと過剰で邪魔になる。
    // エラー時のみユーザーに気付かせるためトーストを出す。
    if (!res.ok) {
      toast.error('評価の保存に失敗しました')
    }
  }

  const scheduleSave = (taste: number, ease: number, cost: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveScores(taste, ease, cost)
    }, 600)
  }

  const handleTaste = (v: number) => {
    setTasteScore(v)
    scheduleSave(v, easeScore, costScore)
  }
  const handleEase = (v: number) => {
    setEaseScore(v)
    scheduleSave(tasteScore, v, costScore)
  }
  const handleCost = (v: number) => {
    setCostScore(v)
    scheduleSave(tasteScore, easeScore, v)
  }

  // 非オーナー & 全スコア 0 でも、空の星 (0/5) で項目を表示する。
  // 旧版は section ごと非表示にしていたが、評価軸 (美味しさ・手軽さ・コスパ)
  // の存在自体を見せた方が UX が分かりやすいため、常に StarDisplay を出す。
  //
  // # カードラッパーは持たない
  // page.tsx 側でセクション全体をカード化するため、本コンポーネントは
  // 内部の星ロジックだけを担当する (二重カードを避ける)。
  return (
    <div className="space-y-3">
      {isOwner ? (
          <>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-orange-500" />
              <StarInput
                label="美味しさ"
                value={tasteScore}
                onChange={handleTaste}
              />
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-blue-500" />
              <StarInput
                label="手軽さ"
                value={easeScore}
                onChange={handleEase}
              />
            </div>
            <div className="flex items-center gap-2">
              <CurrencyYenIcon className="w-4 h-4 text-green-600" />
              <StarInput
                label="コスパ"
                value={costScore}
                onChange={handleCost}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              星をクリックすると自動的に保存されます
            </p>
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
  )
}
