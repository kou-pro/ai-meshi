import Image from 'next/image'

type Size = 'sm' | 'md' | 'profile' | 'lg'

type Props = {
  imageUrl: string | null
  name: string
  size?: Size
  className?: string
}

const sizes: Record<Size, { px: number; cls: string }> = {
  sm: { px: 24, cls: 'w-6 h-6 text-xs' },
  md: { px: 36, cls: 'w-9 h-9 text-base' },
  profile: { px: 64, cls: 'w-16 h-16 text-2xl' },
  lg: { px: 96, cls: 'w-24 h-24 text-3xl' },
}

export default function UserAvatar({
  imageUrl,
  name,
  size = 'md',
  className = '',
}: Props) {
  const { px, cls } = sizes[size]

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={px}
        height={px}
        className={`${cls} shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      className={`${cls} shrink-0 rounded-full bg-gray-200 inline-flex items-center justify-center text-gray-500 ${className}`}
      aria-hidden="true"
    >
      👤
    </span>
  )
}
