import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

type RecipeDetail = {
  id: number
  title: string
  content: string | null
  created_at: string
  user: {
    id: number
    name: string
  }
}

async function fetchRecipe(id: string): Promise<RecipeDetail | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) return null

  const res = await fetch(`http://rails:3000/api/v1/recipes/${id}`, {
    method: 'GET',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) return null

  return res.json()
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const recipe = await fetchRecipe(id)

  if (!recipe) return notFound()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{recipe.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        投稿者: {recipe.user.name} ／{' '}
        {new Date(recipe.created_at).toLocaleDateString('ja-JP')}
      </p>
      <div className="whitespace-pre-wrap text-gray-700">{recipe.content}</div>
    </div>
  )
}
