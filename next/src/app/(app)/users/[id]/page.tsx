import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChefHat } from 'lucide-react'
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
    image_url: string | null
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
  const isEmpty = data.recipes.length === 0

  const followStats = (
    <div
      className={`flex gap-8 ${isEmpty ? 'justify-center' : ''} mb-6 text-sm`}
    >
      <Link
        href={`/users/${id}/follows?tab=following`}
        className="text-gray-600 hover:text-green-600 text-center"
      >
        <span className="block text-lg font-bold text-gray-800">
          {data.user.following_count}
        </span>
        フォロー中
      </Link>
      <Link
        href={`/users/${id}/follows?tab=followers`}
        className="text-gray-600 hover:text-green-600 text-center"
      >
        <span className="block text-lg font-bold text-gray-800">
          {data.user.followers_count}
        </span>
        フォロワー
      </Link>
    </div>
  )

  // 空状態: タイトル中央寄せ (自分のページ) or タイトル+フォローボタン (他人のページ)
  if (isEmpty) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        {isOwnPage ? (
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
            {data.user.name} さんのレシピ
          </h1>
        ) : (
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {data.user.name} さんのレシピ
            </h1>
            {currentUserId && (
              <FollowButton
                targetUserId={data.user.id}
                initialIsFollowing={data.is_following}
              />
            )}
          </div>
        )}

        {followStats}

        {/* アイコン + メッセージ + 導線ボタン */}
        <div className="flex flex-col items-center text-center pb-8">
          <ChefHat className="w-32 h-32 text-green-200" strokeWidth={1.5} />
          <p className="mt-6 text-gray-500 text-sm leading-relaxed">
            まだレシピがありません
          </p>
          <Link
            href={isOwnPage ? '/recipes/new' : '/home'}
            className="mt-8 inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            {isOwnPage ? 'レシピを作る' : 'みんなのレシピを見る'}
          </Link>
        </div>
      </div>
    )
  }

  // 通常表示
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

      {followStats}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            title={recipe.title}
            imageUrl={recipe.image_url ?? null}
            userName={data.user.name}
            userId={data.user.id}
            userImageUrl={data.user.image_url}
            createdAt={recipe.created_at}
            likesCount={recipe.likes_count}
            isPublished={isOwnPage ? recipe.is_published : undefined}
          />
        ))}
      </div>
    </div>
  )
}
