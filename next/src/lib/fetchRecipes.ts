import { cookies } from 'next/headers'

// Railsから返ってくるレシピの型定義
export type Recipe = {
  id: number
  title: string
  content: string | null // contentはnullの可能性がある
  is_published: boolean
  user_id: number
  created_at: string
  updated_at: string
}

export async function fetchRecipes(): Promise<Recipe[]> {
  // Server Component専用：HTTPOnly CookieをサーバーサイドでG読み取る
  const cookieStore = await cookies()

  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // トークンがなければ空配列を返す（middlewareが先にリダイレクトするので基本ここには来ない）
  if (!accessToken || !client || !uid) {
    return []
  }

  const res = await fetch('http://rails:3000/api/v1/recipes', {
    method: 'GET',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
    // Next.jsのキャッシュを無効化：常に最新データを取得する
    cache: 'no-store',
  })

  if (!res.ok) {
    // fetchに失敗した場合は空配列を返す
    return []
  }

  const data: Recipe[] = await res.json()
  return data
}
