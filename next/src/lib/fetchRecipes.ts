import { cookies } from 'next/headers'

// Railsから返ってくるレシピの型定義
export type Recipe = {
  id: number
  title: string
  is_published: boolean
  created_at: string
  likes_count: number
  comments_count: number
  image_url: string | null
  user: {
    id: number
    name: string
  }
}

export async function fetchRecipes(): Promise<Recipe[]> {
  // Server Component専用：HTTPOnly CookieをサーバーサイドでG読み取る
  const cookieStore = await cookies()

  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // トークンがなければ空配列を返す
  if (!accessToken || !client || !uid) {
    return []
  }

  const RAILS_URL = process.env.RAILS_API_URL

  const res = await fetch(`${RAILS_URL}/api/v1/recipes`, {
    method: 'GET',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return []
  }

  const data: Recipe[] = await res.json()
  return data
}
