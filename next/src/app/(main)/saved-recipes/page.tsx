import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'

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
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // 未ログインならリダイレクト
  if (!accessToken || !client || !uid) {
    redirect('/login')
  }

  const res = await fetch('http://rails:3000/api/v1/bookmarks', {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">保存済みレシピ</h1>

      {recipes.length === 0 ? (
        <div className="text-center text-gray-500 mt-12">
          <p className="mb-4">保存したレシピはありません</p>
          <Link
            href="/home"
            className="text-green-600 underline"
          >
            レシピを探す
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  )
}
