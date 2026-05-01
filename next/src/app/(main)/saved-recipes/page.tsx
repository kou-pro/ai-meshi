import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import { BookmarkCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Recipe = {
  id: number
  title: string
  created_at: string
  likes_count: number
  image_url: string | null
  user: {
    id: number
    name: string
  }
}

async function fetchSavedRecipes(): Promise<Recipe[]> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return []
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // 未ログインならリダイレクト
  if (!accessToken || !client || !uid) {
    redirect('/login')
  }

  const res = await fetch(`${RAILS_URL}/api/v1/bookmarks`, {
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    cache: 'no-store',
  })

  if (!res.ok) return []
  return res.json()
}

export default async function SavedRecipesPage() {
  const recipes = await fetchSavedRecipes()

  // 空状態: バスケット型レイアウト（買い物リストと統一）
  if (recipes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 min-h-[calc(100vh-160px)] flex flex-col justify-center md:min-h-0 md:py-8 md:block">
        {/* タイトル: 中央寄せ */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-12">
          保存済みレシピ
        </h1>

        {/* アイコン + メッセージ + ボタン: 縦中央 */}
        <div className="flex flex-col items-center text-center pb-8 md:pb-0">
          <BookmarkCheck
            className="w-32 h-32 text-green-200"
            strokeWidth={1.5}
          />
          <p className="mt-6 text-gray-500 text-sm leading-relaxed">
            保存したレシピは
            <br className="sm:hidden" />
            まだありません
          </p>
          <Link
            href="/home"
            className="mt-8 inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            レシピを探す
          </Link>
        </div>
      </div>
    )
  }

  // レシピ一覧表示
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookmarkCheck className="w-7 h-7 text-green-600" strokeWidth={1.75} />
        保存済みレシピ
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            title={recipe.title}
            imageUrl={recipe.image_url}
            userName={recipe.user.name}
            userId={recipe.user.id}
            createdAt={recipe.created_at}
            likesCount={recipe.likes_count}
          />
        ))}
      </div>
    </div>
  )
}
