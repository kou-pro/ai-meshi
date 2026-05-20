import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import FollowButton from '@/components/FollowButton'
import { getCurrentUserId } from '@/lib/getCurrentUser'

type Recipe = {
  id: number
  title: string
  image_url: string | null
  is_published: boolean
  created_at: string
  likes_count: number
}

type UserRecipesResponse = {
  user: {
    id: number
    name: string
    following_count: number
    followers_count: number
  }
  is_following: boolean
  recipes: Recipe[]
}

export const dynamic = 'force-dynamic'

async function fetchUserRecipes(
  id: string,
): Promise<UserRecipesResponse | null> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return null
  }

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

  const res = await fetch(`${RAILS_URL}/api/v1/users/${id}/recipes`, {
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
  const [data, currentUserId] = await Promise.all([
    fetchUserRecipes(id),
    getCurrentUserId(),
  ])

  if (!data) return notFound()

  const isOwnPage = currentUserId === data.user.id

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{data.user.name} さんのレシピ</h1>
        {/* 未ログインまたは自分のページはフォローボタンを表示しない */}
        {currentUserId && !isOwnPage && (
          <FollowButton
            targetUserId={data.user.id}
            initialIsFollowing={data.is_following}
          />
        )}
      </div>

      <div className="flex gap-4 mb-6 text-sm">
        <Link
          href={`/users/${id}/follows?tab=following`}
          className="text-gray-600 hover:text-green-600"
        >
          <span className="font-bold">{data.user.following_count}</span>{' '}
          フォロー中
        </Link>
        <Link
          href={`/users/${id}/follows?tab=followers`}
          className="text-gray-600 hover:text-green-600"
        >
          <span className="font-bold">{data.user.followers_count}</span>{' '}
          フォロワー
        </Link>
      </div>

      {data.recipes.length === 0 ? (
        <p className="text-gray-500">まだレシピがありません</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              imageUrl={recipe.image_url ?? null}
              userName={data.user.name}
              userId={data.user.id}
              createdAt={recipe.created_at}
              likesCount={recipe.likes_count}
              isPublished={isOwnPage ? recipe.is_published : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
