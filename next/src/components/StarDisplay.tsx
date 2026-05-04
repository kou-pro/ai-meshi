type Props = {
  value: number
  label: string
}

export default function StarDisplay({ value, label }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-20">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
      {/* 評価が付いていれば "X/5" を表示。未評価時は何も表示しない
          (「未評価」を 3 軸で並べると視覚ノイズが大きいため、空の星だけで状態を示す) */}
      {value > 0 && (
        <span className="text-xs text-gray-400">{value}/5</span>
      )}
    </div>
  )
}
