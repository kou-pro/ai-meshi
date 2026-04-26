import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import AddToShoppingListButton from '@/components/AddToShoppingListButton'
import SaveButton from '@/components/SaveButton'
import RecipeOwnerActions from '@/components/RecipeOwnerActions'
import ScoreSection from '@/components/ScoreSection'

type Ingredient = {
  name: string
  quantity: string
  unit: string
  category: string
}

type RecipeDetail = {
  id: number
  title: string
  content: string | null
  ingredients: Ingredient[] | null
  steps: string[] | null
  hashtags: string[]
  created_at: string
  likes_count: number
  liked_by_current_user: boolean
  bookmarked_by_current_user: boolean
  is_published: boolean
  image_url: string | null
  taste_score: number | null
  ease_score: number | null
  cost_score: number | null
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

export const dynamic = 'force-dynamic'

async function fetchRecipe(id: string): Promise<RecipeDetail | null> {
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

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  if (!res.ok) return null
  return res.json()
}

async function fetchComments(id: string): Promise<Comment[]> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return []
  }

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}/comments`, {
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
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return null
  }

  const res = await fetch(`${RAILS_URL}/api/v1/users/me`, {
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

  const isOwner = currentUserId === recipe.user.id
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 1. 画像（視覚的インパクト） */}
      {recipe.image_url && (
        <img
          src={recipe.image_url.replace(
            'http://rails:3000',
            process.env.NEXT_PUBLIC_RAILS_URL,
          )}
          alt={recipe.title}
          className="w-full rounded-lg mb-6 object-cover h-[300px]"
        />
      )}

      {/* 2. タイトル */}
      <h1 className="text-2xl font-bold mb-2">{recipe.title}</h1>

      {/* 3. 投稿者情報 */}
      <p className="text-sm text-gray-500 mb-4">
        投稿者:
        <Link
          href={`/users/${recipe.user.id}`}
          className="hover:text-green-600 ml-1"
        >
          {recipe.user.name}
        </Link>
        ／ {new Date(recipe.created_at).toLocaleDateString('ja-JP')}
      </p>

      {/* 4. アクションボタン（いいね・保存） */}
      <div className="flex items-center gap-4 mb-6">
        <LikeButton
          recipeId={recipe.id}
          initialLikesCount={recipe.likes_count}
          initialLiked={recipe.liked_by_current_user}
          isLoggedIn={isLoggedIn}
        />
        {isLoggedIn && (
          <SaveButton
            recipeId={recipe.id}
            initialBookmarked={recipe.bookmarked_by_current_user}
          />
        )}
      </div>

      {/* 5. 投稿者評価（スコア） */}
      <ScoreSection
        recipeId={recipe.id}
        isOwner={isOwner}
        initialTasteScore={recipe.taste_score}
        initialEaseScore={recipe.ease_score}
        initialCostScore={recipe.cost_score}
      />

      {/* 6〜8. 材料・手順・タグ */}
      {recipe.ingredients && recipe.steps ? (
        <>
          {/* 6. 材料 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">材料</h2>
            <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 list-none p-0">
              {recipe.ingredients.map((ingredient, index) => {
                const isUnitFirst = ['大さじ', '小さじ', 'カップ'].includes(
                  ingredient.unit,
                )
                const amount =
                  ingredient.quantity === '適量'
                    ? '適量'
                    : isUnitFirst
                      ? `${ingredient.unit}${ingredient.quantity}`
                      : `${ingredient.quantity}${ingredient.unit}`
                return (
                  <li
                    key={index}
                    className="flex justify-between px-4 py-2 text-sm"
                  >
                    <span className="text-gray-700">{ingredient.name}</span>
                    <span className="text-gray-500">{amount}</span>
                  </li>
                )
              })}
            </ul>
            {isLoggedIn && (
              <div className="mt-4">
                <AddToShoppingListButton
                  recipeId={recipe.id}
                  ingredients={recipe.ingredients}
                />
              </div>
            )}
          </div>

          {/* 7. 手順 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">作り方</h2>
            <ol className="space-y-3 list-none p-0">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm text-gray-700">
                  <span className="shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 8. タグ */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(recipe.hashtags ?? []).map((tag) => {
              const tagWithoutHash = tag.replace(/^#/, '')
              return (
                <Link
                  key={tag}
                  href={`/home?tag=${encodeURIComponent(tagWithoutHash)}`}
                  className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[13px] border border-green-200 no-underline"
                >
                  {tag}
                </Link>
              )
            })}
          </div>
        </>
      ) : (
        <div className="whitespace-pre-wrap text-gray-700 mb-6">
          {recipe.content}
        </div>
      )}

      {/* 9. 管理者メニュー（オーナーのみ、控えめに下部） */}
      {isOwner && (
        <RecipeOwnerActions
          recipeId={recipe.id}
          isPublished={recipe.is_published}
        />
      )}

      {/* 10. コメント */}
      <CommentSection
        recipeId={recipe.id}
        initialComments={comments}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
      />
    </div>
  )
}
