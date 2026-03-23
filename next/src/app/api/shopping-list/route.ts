import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ① リクエストボディから必要な情報を取り出す
  const body = await request.json()
  const { recipe_id, ingredients, force } = body

  // ② HTTPOnly Cookieからトークン取得
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // ③ 未ログインなら401を返す
  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  // ④ RailsにPOSTリクエストを送る
  const res = await fetch('http://rails:3000/api/v1/shopping_list_items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    // recipe_id・ingredients・force をそのまま転送する
    body: JSON.stringify({ recipe_id, ingredients, force }),
  })

  // ⑤ Railsからのレスポンスをそのままフロントに返す
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function GET(request: NextRequest) {
  // 買い物リスト一覧を取得する
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch('http://rails:3000/api/v1/shopping_list_items', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
