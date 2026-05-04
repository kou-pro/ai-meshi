'use client'

import { useState } from 'react'

type Props = {
  value: number
  onChange: (value: number) => void
  label: string
}

export default function StarInput({ value, onChange, label }: Props) {
  const [hovered, setHovered] = useState(0)

  // 右カラム (1/3 幅) に収めるため、星サイズは text-xl とし、
  // 末尾の値表示は whitespace-nowrap で必ず 1 行に固定する。
  return (
    <div className="flex items-center gap-2 flex-nowrap">
      <span className="text-sm text-gray-600 w-20 shrink-0">{label}</span>
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`text-xl focus:outline-none transition-colors ${star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
        {value > 0 ? `${value}/5` : '未評価'}
      </span>
    </div>
  )
}
