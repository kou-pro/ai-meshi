import Link from 'next/link'

type Props = {
  id: number
  title: string
  content: string | null
  userName: string
  userId: number
  createdAt: string
  likesCount: number
}

export default function RecipeCard({
  id,
  title,
  content,
  userName,
  userId,
  createdAt,
  likesCount,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      {/* タイトル */}
      <Link href={`/recipes/${id}`}>
        <h2 className="text-lg font-bold text-gray-800 hover:text-green-600 mb-2">
          {title}
        </h2>
      </Link>

      {/* 内容プレビュー */}
      {content && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{content}</p>
      )}

      {/* フッター */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div>
          <Link href={`/users/${userId}`} className="hover:text-green-600">
            {userName}
          </Link>
          <span className="mx-1">・</span>
          <span>{new Date(createdAt).toLocaleDateString('ja-JP')}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>❤️</span>
          <span>{likesCount}</span>
        </div>
      </div>
    </div>
  )
}
