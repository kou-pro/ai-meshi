'use client'

import { useState } from 'react'

type Props = {
  value: number
  onChange: (value: number) => void
  label: string
}

export default function StarInput({ value, onChange, label }: Props) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-16">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl focus:outline-none transition-colors"
          >
            {star <= (hovered || value) ? '★' : '☆'}
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-400">
        {value > 0 ? `${value}/5` : '未評価'}
      </span>
    </div>
  )
}
