import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'

type RecipeDetail = {
  id: number
  title: string
  content: string | null
  created_at: string
  likes_count: number
  liked_by_current_user: boolean
  image_url: string | null
  user: {
    id: number
    name: string
  }
}

type Comment = {
  id: number
  body: string
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

async function fetchComments(id: string): Promise<Comment[]> {
  const res = await fetch(`http://rails:3000/api/v1/recipes/${id}/comments`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchCurrentUserId(
  accessToken: string,
  client: string,
  uid: string,
): Promise<number | null> {
  const res = await fetch('http://rails:3000/api/v1/users/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.id
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

  const isLoggedIn = !!(accessToken && client && uid)

  const recipe = await fetchRecipe(id)
  if (!recipe) return notFound()

  const comments = await fetchComments(id)

  const currentUserId = isLoggedIn
    ? await fetchCurrentUserId(accessToken!, client!, uid!)
    : null

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
      {recipe.image_url && (
        <img
          src={recipe.image_url.replace(
            'http://rails:3000',
            'http://localhost:3000',
          )}
          alt={recipe.title}
          className="w-full rounded-lg mb-6"
        />
      )}
      <div className="whitespace-pre-wrap text-gray-700 mb-6">
        {recipe.content}
      </div>
      <LikeButton
        recipeId={recipe.id}
        initialLikesCount={recipe.likes_count}
        initialLiked={recipe.liked_by_current_user}
        isLoggedIn={isLoggedIn}
      />
      <CommentSection
        recipeId={recipe.id}
        initialComments={comments}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
      />
    </div>
  )
}
