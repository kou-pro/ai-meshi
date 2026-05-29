type Size = 'sm' | 'md' | 'lg'

type Props = {
  imageUrl: string | null
  name: string
  size?: Size
  className?: string
}

const sizeClasses: Record<Size, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-9 h-9 text-base',
  lg: 'w-24 h-24 text-3xl',
}

export default function UserAvatar({
  imageUrl,
  name,
  size = 'md',
  className = '',
}: Props) {
  const sizeClass = sizeClasses[size]

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      className={`${sizeClass} shrink-0 rounded-full bg-gray-200 inline-flex items-center justify-center text-gray-500 ${className}`}
      aria-hidden="true"
    >
      👤
    </span>
  )
}
