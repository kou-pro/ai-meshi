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
      <span className="text-xs text-gray-400">
        {value > 0 ? `${value}/5` : '未評価'}
      </span>
    </div>
  )
}
