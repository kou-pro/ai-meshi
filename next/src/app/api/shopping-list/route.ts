import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 共通: Cookieからトークンを取得する
async function getAuthHeaders() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value
  return { accessToken, client, uid }
}

// 買い物リスト追加
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { recipe_id, ingredients, force } = body
  const { accessToken, client, uid } = await getAuthHeaders()

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch('http://rails:3000/api/v1/shopping_list_items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client,
      uid,
    },
    body: JSON.stringify({ recipe_id, ingredients, force }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// 買い物リスト取得
export async function GET() {
  const { accessToken, client, uid } = await getAuthHeaders()

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch('http://rails:3000/api/v1/shopping_list_items', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client,
      uid,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// チェック状態の更新
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, is_checked } = body
  const { accessToken, client, uid } = await getAuthHeaders()

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch(
    `http://rails:3000/api/v1/shopping_list_items/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        client,
        uid,
      },
      body: JSON.stringify({ is_checked }),
    },
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// 削除（1件・レシピごと・チェック済み）
export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { type, id, recipe_id } = body
  const { accessToken, client, uid } = await getAuthHeaders()

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  // typeによって叩くエンドポイントを変える
  let url = ''
  if (type === 'item') {
    // 1件削除
    url = `http://rails:3000/api/v1/shopping_list_items/${id}`
  } else if (type === 'recipe') {
    // レシピごと削除
    url = `http://rails:3000/api/v1/shopping_list_items/destroy_by_recipe?recipe_id=${recipe_id}`
  } else if (type === 'checked') {
    // チェック済み削除
    url = `http://rails:3000/api/v1/shopping_list_items/destroy_checked`
  }

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client,
      uid,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
