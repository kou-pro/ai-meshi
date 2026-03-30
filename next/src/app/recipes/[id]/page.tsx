import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import AddToShoppingListButton from '@/components/AddToShoppingListButton'
import SaveButton from '@/components/SaveButton'

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
          style={{ objectFit: 'cover', height: '300px', width: '100%' }}
        />
      )}

      {/* 構造化データがある場合 → 食材一覧・手順を表示 */}
      {recipe.ingredients && recipe.steps ? (
        <>
          {/* 食材一覧 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">材料</h2>
            <ul
              className="border border-gray-200 rounded-lg divide-y divide-gray-200"
              style={{ listStyle: 'none', padding: 0 }}
            >
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
            {/* ← ここに追加 */}
            {isLoggedIn && (
              <div className="mt-4">
                <AddToShoppingListButton
                  recipeId={recipe.id}
                  ingredients={recipe.ingredients}
                />
              </div>
            )}
          </div>
          {/* 手順 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">作り方</h2>
            <ol className="space-y-3" style={{ listStyle: 'none', padding: 0 }}>
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm text-gray-700">
                  <span
                    style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          {/* タグ */}
          {(recipe.hashtags ?? []).map((tag) => {
            const tagWithoutHash = tag.replace(/^#/, '')
            return (
              <Link
                key={tag}
                href={`/home?tag=${encodeURIComponent(tagWithoutHash)}`}
                style={{
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  border: '1px solid #bbf7d0',
                  textDecoration: 'none',
                }}
              >
                {tag}
              </Link>
            )
          })}
        </>
      ) : (
        /* 構造化データがない場合 → 従来のcontentを表示 */
        <div className="whitespace-pre-wrap text-gray-700 mb-6">
          {recipe.content}
        </div>
      )}

      <LikeButton
        recipeId={recipe.id}
        initialLikesCount={recipe.likes_count}
        initialLiked={recipe.liked_by_current_user}
        isLoggedIn={isLoggedIn}
      />

      {isLoggedIn && (
        <div className="mt-3">
          <SaveButton
            recipeId={recipe.id}
            initialBookmarked={recipe.bookmarked_by_current_user}
          />
        </div>
      )}

      <CommentSection
        recipeId={recipe.id}
        initialComments={comments}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
      />
    </div>
  )
}
