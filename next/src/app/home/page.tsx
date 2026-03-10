import { cookies } from 'next/headers'
import Link from 'next/link'

type Recipe = {
  id: number
  title: string
  content: string | null
  user_id: number
  created_at: string
}

async function fetchPublishedRecipes(): Promise<Recipe[]> {
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

  const res = await fetch('http://rails:3000/api/v1/recipes/published', {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  if (!res.ok) return []

  const data: Recipe[] = await res.json()
  return data
}

export default async function HomePage() {
  const recipes = await fetchPublishedRecipes()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">みんなのレシピ</h1>

      {recipes.length === 0 && (
        <p className="text-gray-500">まだ投稿がありません</p>
      )}

      <ul className="space-y-4">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="p-4 border border-gray-200 rounded-lg">
            <Link href={`/recipes/${recipe.id}`}>
              <h2 className="text-lg font-semibold">{recipe.title}</h2>
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
