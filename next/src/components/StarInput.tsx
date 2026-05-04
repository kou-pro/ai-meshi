'use client'

import { useId, useRef, useState } from 'react'

type Props = {
  value: number
  onChange: (value: number) => void
  label: string
}

/**
 * 5 段階の星評価入力 (オーナー専用)。
 *
 * # アクセシビリティ
 * WAI-ARIA APG (Authoring Practices Guide) の radiogroup pattern に準拠。
 * - 親 div に role="radiogroup" + aria-labelledby + aria-orientation
 * - 各星 button に role="radio" + aria-checked
 * - roving tabindex: 選択中の radio のみ tabbable (未選択時は ★1)
 * - 矢印キー (←→↑↓) で星間を移動、Home/End で先頭/末尾へ
 *
 * # id の安全性
 * useId() で React 19 の安定したユニーク ID を生成。
 * 同一ページ内で StarInput を複数並べても衝突せず、label 値に空白や
 * 特殊文字が含まれても aria-labelledby の token 解釈を破壊しない。
 *
 * # value の防御
 * 想定外の値 (負数 / 6 以上 / 小数) で「tabbable な radio が 1 つもない」
 * 状態にならないよう、内部で 0〜5 にクランプする。
 */
export default function StarInput({ value, onChange, label }: Props) {
  const [hovered, setHovered] = useState(0)
  const groupRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  // value の範囲を 0〜5 に強制 (型は number だが API 由来の異常値を防ぐ)
  const clampedValue = Math.max(0, Math.min(5, Math.floor(value)))

  // 矢印キー / Home / End で星間移動。WAI-ARIA APG の radio pattern に準拠。
  // Space / Enter は <button> のブラウザデフォルトで onClick が発火するため未ハンドル。
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    star: number,
  ) => {
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(5, star + 1)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(1, star - 1)
        break
      case 'Home':
        next = 1
        break
      case 'End':
        next = 5
        break
      default:
        return
    }
    e.preventDefault()
    onChange(next)

    // querySelector で role="radio" を持つ要素を取り直す。
    // children[index] 方式は DOM に隠し兄弟要素が混入した瞬間にずれるため避ける。
    const radios = groupRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    )
    radios?.[next - 1]?.focus()
  }

  return (
    <div className="flex items-center gap-2 flex-nowrap">
      <span
        id={labelId}
        className="text-sm text-gray-600 w-20 shrink-0"
      >
        {label}
      </span>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-orientation="horizontal"
        className="flex gap-1 shrink-0"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const checked = star === clampedValue
          // roving tabindex: 選択中の radio のみ tabbable。
          // 未選択 (clampedValue=0) 時は ★1 を tabbable にすることで
          // Tab 1 回でグループに入れるようにする。
          const tabIndex = (clampedValue === 0 ? star === 1 : checked) ? 0 : -1
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${star} 星`}
              tabIndex={tabIndex}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className={`text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded transition-colors ${
                star <= (hovered || clampedValue)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
            >
              ★
            </button>
          )
        })}
      </div>
      {/* 視覚補助テキスト。aria-checked + aria-label で SR には伝わるため aria-hidden */}
      <span
        className="text-xs text-gray-400 whitespace-nowrap shrink-0"
        aria-hidden="true"
      >
        {clampedValue > 0 ? `${clampedValue}/5` : '未評価'}
      </span>
    </div>
  )
}
