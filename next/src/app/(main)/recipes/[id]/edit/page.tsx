import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import EditRecipeForm from './EditRecipeForm'

export const dynamic = 'force-dynamic'

type Recipe = {
  id: number
  title: string
  steps: string[]
  image_url: string | null
  taste_score: number
  ease_score: number
  cost_score: number
}

/** Rails API から特定レシピを取得（Server-side） */
async function fetchRecipe(id: string): Promise<Recipe | null> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) return null

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value
  if (!accessToken || !client || !uid) return null

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    cache: 'no-store',
  })

  if (!res.ok) return null
  return res.json()
}

/**
 * レシピ編集ページ（Server Component）。
 *
 * # 設計
 * - 編集対象のレシピを Server で取得し、Client Form に props で渡す。
 * - クライアントは初期値をすぐに表示できる（チラつきなし）。
 *
 * # 旧版の問題
 * `'use client'` の本ページが `useEffect` 内で `/api/recipes/[id]` を fetch していた。
 * 初期表示時に `fetching` ステートで「読み込み中...」が一瞬表示されるチラつきがあった。
 * Server-side 取得 + props 渡しに変更したことで初回 HTML から完全な状態で表示される。
 */
export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 認証必須
  const cookieStore = await cookies()
  if (!cookieStore.get('access-token')?.value) {
    redirect('/login')
  }

  const recipe = await fetchRecipe(id)
  if (!recipe) {
    notFound()
  }

  return (
    <EditRecipeForm
      id={id}
      initialTitle={recipe.title}
      initialSteps={
        Array.isArray(recipe.steps) && recipe.steps.length > 0
          ? recipe.steps
          : ['']
      }
      initialImageUrl={recipe.image_url}
      initialTasteScore={recipe.taste_score ?? 0}
      initialEaseScore={recipe.ease_score ?? 0}
      initialCostScore={recipe.cost_score ?? 0}
    />
  )
}
