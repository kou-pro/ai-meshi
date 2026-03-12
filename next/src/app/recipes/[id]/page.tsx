import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LikeButton from '@/components/LikeButton'

type RecipeDetail = {
  id: number
  title: string
  content: string | null
  created_at: string
  likes_count: number
  liked_by_current_user: boolean
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (accessToken && client && uid) {
    headers['access-token'] = accessToken
    headers['client'] = client
    headers['uid'] = uid
  }

  const res = await fetch(`http://rails:3000/api/v1/recipes/${id}`, {
    method: 'GET',
    headers,
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
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // ログイン済みかどうかを判定する
  const isLoggedIn = !!(accessToken && client && uid)

  const recipe = await fetchRecipe(id)
  if (!recipe) return notFound()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{recipe.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        投稿者:
        <Link
          href={`/users/${recipe.user.id}`}
          className="hover:text-blue-600 ml-1"
        >
          {recipe.user.name}
        </Link>
        ／ {new Date(recipe.created_at).toLocaleDateString('ja-JP')}
      </p>
      <div className="whitespace-pre-wrap text-gray-700 mb-6">
        {recipe.content}
      </div>
      <LikeButton
        recipeId={recipe.id}
        initialLikesCount={recipe.likes_count}
        initialLiked={recipe.liked_by_current_user}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
