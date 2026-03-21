import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ① リクエストボディから食材・選択条件を取り出す
  const body = await request.json()
  const { ingredients, servings, genre, scene, conditions } = body

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
  const res = await fetch('http://rails:3000/api/v1/recipes/generate', {
    method: 'POST',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
    // 全パラメータをRailsに転送する
    body: JSON.stringify({ ingredients, servings, genre, scene, conditions }),
  })

  // ⑤ Railsからのレスポンスをそのままフロントに返す
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
