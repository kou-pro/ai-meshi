import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import RecipeCard from '@/components/RecipeCard'

type Recipe = {
  id: number
  title: string
  content: string | null
  created_at: string
  likes_count: number
}

type UserRecipesResponse = {
  user: {
    id: number
    name: string
  }
  recipes: Recipe[]
}

async function fetchUserRecipes(
  id: string,
): Promise<UserRecipesResponse | null> {
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

  const res = await fetch(`http://rails:3000/api/v1/users/${id}/recipes`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  if (!res.ok) return null

  return res.json()
}

export default async function UserRecipesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchUserRecipes(id)

  if (!data) return notFound()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{data.user.name} さんのレシピ</h1>

      {data.recipes.length === 0 && (
        <p className="text-gray-500">まだ公開レシピがありません</p>
      )}

      <div className="space-y-4">
        {data.recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            title={recipe.title}
            content={recipe.content}
            userName={data.user.name}
            userId={data.user.id}
            createdAt={recipe.created_at}
            likesCount={recipe.likes_count}
          />
        ))}
      </div>
    </div>
  )
}
