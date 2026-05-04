import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'

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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* 画像 */}
      <Link href={`/recipes/${id}`} className="block shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            imageUrl
              ? imageUrl.replace('http://rails:3000', process.env.NEXT_PUBLIC_RAILS_URL)
              : '/default-recipe.jpg'
          }
          alt={title}
          className="w-full h-48 object-cover"
        />
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {/* タイトル: 2行で固定（短い時も同じ高さ） */}
        <Link href={`/recipes/${id}`}>
          <h2 className="text-lg font-bold text-gray-800 hover:text-green-600 mb-2 line-clamp-2 min-h-[3.5rem]">
            {title}
          </h2>
        </Link>

        {/* 公開/未公開バッジ (タイトル下、文字幅にフィット)
            flex-col 親の中で w-fit を付けないと cross-axis に伸びてしまうため self-start で固定 */}
        {isPublished !== undefined && (
          <span
            className={`self-start mb-2 px-2 py-0.5 rounded-full text-xs ${isPublished ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
          >
            {isPublished ? '公開中' : '未公開'}
          </span>
        )}

        {/* フッター: mt-auto で下端に固定 */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
          <div>
            <Link href={`/users/${userId}`} className="hover:text-green-600">
              {userName}
            </Link>
            <span className="mx-1">・</span>
            <span>{new Date(createdAt).toLocaleDateString('ja-JP')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>{likesCount}</span>
            </div>
            {/* コメント数（commentsCountが渡された場合のみ表示） */}
            {commentsCount !== undefined && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{commentsCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
