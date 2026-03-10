import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Recipe = {
  id: number
  title: string
  content: string | null
  created_at: string
}

type UserRecipesResponse = {
  user: {
    id: number
    name: string
  }
  recipes: Recipe[]
}

async function fetchUserRecipes(
  id: string,
): Promise<UserRecipesResponse | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // ヘッダーを組み立てる（未ログインでも空ヘッダーでリクエストする）
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // ログイン済みの場合だけ認証ヘッダーを追加する
  if (accessToken && client && uid) {
    headers['access-token'] = accessToken
    headers['client'] = client
    headers['uid'] = uid
  }

  const res = await fetch(`http://rails:3000/api/v1/users/${id}/recipes`, {
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
  const data = await fetchUserRecipes(id)

  if (!data) return notFound()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{data.user.name} さんのレシピ</h1>

      {data.recipes.length === 0 && (
        <p className="text-gray-500">まだ公開レシピがありません</p>
      )}

      <ul className="space-y-4">
        {data.recipes.map((recipe) => (
          <li key={recipe.id} className="p-4 border border-gray-200 rounded-lg">
            <Link href={`/recipes/${recipe.id}`}>
              <h2 className="text-lg font-semibold hover:text-blue-600">
                {recipe.title}
              </h2>
            </Link>
            {recipe.content && (
              <p className="text-gray-600 mt-1">{recipe.content}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
