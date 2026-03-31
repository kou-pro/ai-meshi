import Link from 'next/link'

type Props = {
  id: number
  title: string
  imageUrl: string | null
  userName: string
  userId: number
  createdAt: string
  likesCount: number
  isPublished?: boolean
  commentsCount?: number
}

export default function RecipeCard({
  id,
  title,
  imageUrl,
  userName,
  userId,
  createdAt,
  likesCount,
  isPublished,
  commentsCount,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* 画像 */}
      <Link href={`/recipes/${id}`}>
        <img
          src={
            imageUrl
              ? imageUrl.replace('http://rails:3000', 'http://localhost:3000')
              : '/default-recipe.jpg'
          }
          alt={title}
          className="w-full h-48 object-cover"
          style={{ objectFit: 'cover', height: '192px' }}
        />
      </Link>

      <div className="p-4">
        {/* 公開/未公開バッジ（isPublishedが渡された場合のみ表示） */}
        {isPublished !== undefined && (
          <span
            style={{
              display: 'inline-block',
              marginBottom: '8px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              backgroundColor: isPublished ? '#dcfce7' : '#f3f4f6',
              color: isPublished ? '#16a34a' : '#6b7280',
            }}
          >
            {isPublished ? '公開中' : '未公開'}
          </span>
        )}

        {/* タイトル */}
        <Link href={`/recipes/${id}`}>
          <h2 className="text-lg font-bold text-gray-800 hover:text-green-600 mb-2">
            {title}
          </h2>
        </Link>

        {/* フッター */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            <Link href={`/users/${userId}`} className="hover:text-green-600">
              {userName}
            </Link>
            <span className="mx-1">・</span>
            <span>{new Date(createdAt).toLocaleDateString('ja-JP')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>❤️</span>
              <span>{likesCount}</span>
            </div>
            {/* コメント数（commentsCountが渡された場合のみ表示） */}
            {commentsCount !== undefined && (
              <div className="flex items-center gap-1">
                <span>💬</span>
                <span>{commentsCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
