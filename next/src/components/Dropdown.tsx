'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

type Props = {
  /** 選択中の値（空文字なら未選択扱い） */
  value: string
  /** 値が変わったときに呼ばれる */
  onChange: (value: string) => void
  /** 選択肢リスト */
  options: string[]
  /** 未選択時に表示するプレースホルダ */
  placeholder: string
}

/**
 * シンプルなカスタムドロップダウン。
 * ネイティブ `<select>` と違い、選択肢パネルがトリガー直下にインラインで展開される。
 *
 * # 採用理由
 * - ネイティブ `<select>` はモバイルで OS の picker（iOS は画面下のホイール）を呼ぶため、
 *   位置が直感に反することがあるため独自実装にする。
 * - クリック外で閉じる挙動も実装済み。
 */
export default function Dropdown({
  value,
  onChange,
  options,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // クリック外で閉じる
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      {/* トリガー */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 選択肢パネル: 業界標準のオーバーレイ方式 (Material Design / Apple HIG 準拠)。
          absolute + top-full でトリガー直下にフロート表示し、下のコンテンツを
          押し下げない。Bootstrap / MUI / Carbon Design 等と同じパターン。 */}
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg max-h-60 overflow-y-auto"
        >
          {options.map((opt) => {
            const isSelected = value === opt
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
