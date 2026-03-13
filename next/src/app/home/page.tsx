import { cookies } from 'next/headers'
import RecipeCard from '@/components/RecipeCard'

type Recipe = {
  id: number
  title: string
  content: string | null
  created_at: string
  likes_count: number
  user: {
    id: number
    name: string
  }
}

async function fetchPublishedRecipes(): Promise<Recipe[]> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (accessToken && client && uid) {
    headers['access-token'] = accessToken
    headers['client'] = client
    headers['uid'] = uid
  }

  const res = await fetch('http://rails:3000/api/v1/recipes/published', {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  if (!res.ok) return []

  const data: Recipe[] = await res.json()
  return data
}

export default async function HomePage() {
  const recipes = await fetchPublishedRecipes()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">みんなのレシピ</h1>

      {recipes.length === 0 && (
        <p className="text-gray-500">まだ投稿がありません</p>
      )}

      <div className="space-y-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            title={recipe.title}
            content={recipe.content}
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
