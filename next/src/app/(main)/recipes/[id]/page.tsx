import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ListChecks,
  ChefHat,
  Tag as TagIcon,
  Star as StarIcon,
  MessageCircle,
  Users,
} from 'lucide-react'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import AddToShoppingListButton from '@/components/AddToShoppingListButton'
import SaveButton from '@/components/SaveButton'
import RecipeOwnerActions from '@/components/RecipeOwnerActions'
import ScoreSection from '@/components/ScoreSection'
import RecipeImageUploader from '@/components/RecipeImageUploader'
import { formatIngredientAmount } from '@/lib/formatIngredientAmount'

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
  servings: number | null
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

// dynamic = 'force-dynamic' を宣言すると Next.js が全 fetch を自動で
// cache: 'no-store' 相当として扱うため、各 fetch の cache 指定は不要 (重複)。
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
  })

  if (!res.ok) return null
  return res.json()
}

async function fetchComments(id: string): Promise<Comment[]> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) return []

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}/comments`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
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
  if (!RAILS_URL) return null

  const res = await fetch(`${RAILS_URL}/api/v1/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
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

  // 3 つの fetch を並列実行: 互いに依存しないため Promise.all で
  // 逐次 await の RTT 合算を解消 (推定 ~2 RTT 短縮)。
  const [recipe, comments, currentUserId] = await Promise.all([
    fetchRecipe(id),
    fetchComments(id),
    isLoggedIn
      ? fetchCurrentUserId(accessToken!, client!, uid!)
      : Promise.resolve(null),
  ])

  if (!recipe) return notFound()

  const isOwner = currentUserId === recipe.user.id

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* 1. ヒーロー画像 (全幅・16:9 で max-h 制約) + 右上にアクションアイコン群 */}
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            recipe.image_url
              ? recipe.image_url.replace(
                  'http://rails:3000',
                  process.env.NEXT_PUBLIC_RAILS_URL ?? '',
                )
              : '/default-recipe.jpg'
          }
          alt={recipe.image_url ? recipe.title : ''}
          className="w-full aspect-video rounded-2xl object-cover max-h-110"
        />
        {/* オーナー: カメラアイコンで画像追加・差し替え (左上または既定の RecipeImageUploader 配置) */}
        {isOwner && (
          <RecipeImageUploader
            recipeId={recipe.id}
            variant={recipe.image_url ? 'replace' : 'add'}
          />
        )}
        {/* アクション (画像右上隅)
            業界標準 (Cookpad / DELISH KITCHEN / NYT Cooking 等) に倣い、
            ヒーロー画像にはレシピ全体へのアクション (いいね・保存) のみを配置。
            買い物リスト追加は材料セクションに 1 箇所だけ置く方針。 */}
        <div className="absolute top-4 right-4 flex gap-2">
          <LikeButton
            recipeId={recipe.id}
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
      </div>

      {/* 2. タイトルブロック
          タイトル左 + オーナーなら「⋯ 管理」ドロップダウン右
          メタ情報 (アバター・名前・日付・人数) は title 下に配置 */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-3xl font-bold text-gray-800 flex-1 min-w-0">
            {recipe.title}
          </h1>
          {isOwner && (
            <div className="shrink-0">
              <RecipeOwnerActions
                recipeId={recipe.id}
                isPublished={recipe.is_published}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <span className="w-6 h-6 rounded-full bg-gray-200 inline-flex items-center justify-center text-xs">
            👤
          </span>
          <Link
            href={`/users/${recipe.user.id}`}
            className="hover:text-green-600"
          >
            {recipe.user.name}
          </Link>
          <span className="text-gray-300">·</span>
          <span>{new Date(recipe.created_at).toLocaleDateString('ja-JP')}</span>
          {recipe.servings && (
            <>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings}人分
              </span>
            </>
          )}
          {/* コメント数: 業界標準 (Cookpad / NYT Cooking 等) に倣い 0 件でも常に表示。
              CommentSection (Client Component) で投稿/削除した際は
              router.refresh() でこの Server Component を再取得して同期する。 */}
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {comments.length}件
          </span>
          {/* 公開状態バッジ: オーナーのみ表示 (閲覧者は公開済みしか見れないため) */}
          {isOwner && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                recipe.is_published
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {recipe.is_published ? '公開中' : '非公開'}
            </span>
          )}
        </div>
      </div>

      {/* 区切り線 */}
      <hr className="border-gray-200" />

      {/* 2 カラム: 左 (材料 + 作り方) / 右 (タグ + 評価 + コメント + オーナー操作) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* ─── 左カラム (2/3) ─── */}
        <div className="md:col-span-2 space-y-6">
          {recipe.ingredients && recipe.steps ? (
            <>
              {/* 材料 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                  <ListChecks className="w-5 h-5 text-green-600" />
                  材料
                  {recipe.servings && (
                    <span className="text-sm font-normal text-gray-500">
                      ({recipe.servings}人分)
                    </span>
                  )}
                </h2>
                <ul className="divide-y divide-gray-100 list-none p-0 mb-4">
                  {recipe.ingredients.map((ingredient, index) => {
                    // formatIngredientAmount: バックエンド (Rails の
                    // IngredientFormatter) と完全に同じロジック。
                    // 業界標準 (大さじ前置 / 適量・少々等の単位省略) に準拠。
                    const amount = formatIngredientAmount({
                      quantity: ingredient.quantity,
                      unit: ingredient.unit,
                    })
                    return (
                      <li
                        key={index}
                        className="flex justify-between py-2 text-sm"
                      >
                        <span className="text-gray-700">{ingredient.name}</span>
                        <span className="text-gray-500">{amount}</span>
                      </li>
                    )
                  })}
                </ul>
                {isLoggedIn && (
                  <AddToShoppingListButton
                    recipeId={recipe.id}
                    ingredients={recipe.ingredients}
                  />
                )}
              </div>

              {/* 作り方 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                  <ChefHat className="w-5 h-5 text-green-600" />
                  作り方
                </h2>
                <ol className="space-y-3 list-none p-0">
                  {recipe.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex gap-3 text-sm text-gray-700"
                    >
                      <span className="shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="whitespace-pre-wrap text-gray-700">
                {recipe.content}
              </p>
            </div>
          )}
        </div>

        {/* ─── 右カラム (1/3) ─── */}
        <div className="space-y-6">
          {/* タグ */}
          {recipe.hashtags && recipe.hashtags.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                <TagIcon className="w-5 h-5 text-green-600" />
                タグ
              </h2>
              <div className="flex flex-wrap gap-2">
                {recipe.hashtags.map((tag) => {
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
            </div>
          )}

          {/* 投稿者評価 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
              <StarIcon className="w-5 h-5 text-green-600" />
              投稿者評価
            </h2>
            <ScoreSection
              recipeId={recipe.id}
              isOwner={isOwner}
              initialTasteScore={recipe.taste_score}
              initialEaseScore={recipe.ease_score}
              initialCostScore={recipe.cost_score}
            />
          </div>

          {/* コメント */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
              <MessageCircle className="w-5 h-5 text-green-600" />
              コメント
            </h2>
            <CommentSection
              recipeId={recipe.id}
              initialComments={comments}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
