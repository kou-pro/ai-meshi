import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import EditRecipeForm from './EditRecipeForm'

export const dynamic = 'force-dynamic'

type Recipe = {
  id: number
  title: string
  steps: string[]
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
 * # スコープ
 * 編集対象は タイトル と 手順 のみ。
 * - 画像は詳細ページの RecipeImageUploader から追加・変更可能
 * - 投稿者評価 (taste / ease / cost) は詳細ページの ScoreSection から保存可能
 * 重複機能を排除して編集画面の責務を簡素化した。
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
    />
  )
}
