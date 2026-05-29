import Link from 'next/link'
import Image from 'next/image'
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

/**
 * レシピカード。
 *
 * # カード全体クリック (Stretched Link Pattern)
 * 業界標準の "stretched link" パターンを採用。Bootstrap / Tailwind UI 等で
 * 一般的に使われる。
 * - 親 div に position: relative
 * - タイトルの <Link> に before: 疑似要素を絶対配置でカード全体に拡大
 * - クリックは any-area からタイトルリンクへ吸い込まれる
 * - ユーザー名の <Link> は z-10 で疑似要素より上に置き、独立リンクとして機能
 *
 * → カード上の余白・画像・バッジ等をクリックしてもレシピ詳細へ遷移、
 *   ユーザー名だけはユーザーページへ遷移、という直感的な挙動。
 */
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full relative">
      <div className="relative w-full h-48 shrink-0">
        <Image
          src={imageUrl ?? '/default-recipe.jpg'}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* タイトル (stretched link)
            before:absolute before:inset-0 でカード全体をクリック領域化。
            これによりタイトル / 画像 / 余白 / バッジ どこをクリックしても
            レシピ詳細ページに遷移する。 */}
        <Link
          href={`/recipes/${id}`}
          className="text-lg font-bold text-gray-800 hover:text-green-600 mb-2 line-clamp-2 min-h-[3.5rem] before:absolute before:inset-0 before:content-['']"
        >
          {title}
        </Link>

        {/* 公開/未公開バッジ (タイトル下、文字幅にフィット) */}
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
            {/* ユーザー名リンクは relative + z-10 で stretched link より上に配置。
                これだけ別リンクとして機能する。 */}
            <Link
              href={`/users/${userId}`}
              className="relative z-10 hover:text-green-600"
            >
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
