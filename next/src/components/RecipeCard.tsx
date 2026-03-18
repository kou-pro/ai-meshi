import Link from 'next/link'

type Props = {
  id: number
  title: string
  imageUrl: string | null // 追加
  userName: string
  userId: number
  createdAt: string
  likesCount: number
}

export default function RecipeCard({
  id,
  title,
  imageUrl, // 追加
  userName,
  userId,
  createdAt,
  likesCount,
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
          <div className="flex items-center gap-1">
            <span>❤️</span>
            <span>{likesCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
