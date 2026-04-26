import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  // ① リクエストボディから食材・選択条件を取り出す
  const body = await request.json()
  const { ingredients, servings, genre, scene, conditions, is_published } = body // ← is_published を追加

  // ② HTTPOnly CookieからトークンG取得
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // ③ トークンがなければ401を返す
  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  // ④ RailsのAI生成エンドポイントにリクエスト
  const res = await fetch(`${RAILS_URL}/api/v1/recipes/generate`, {
    method: 'POST',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
    // is_published を追加してRailsに転送
    body: JSON.stringify({
      ingredients,
      servings,
      genre,
      scene,
      conditions,
      is_published,
    }),
  })

  // ⑤ Railsからのレスポンスをそのままフロントに返す
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
