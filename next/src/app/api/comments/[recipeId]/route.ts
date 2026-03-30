import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const RAILS_URL = process.env.RAILS_API_URL

// コメント一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> },
) {
  const { recipeId } = await params

  const res = await fetch(
    `${RAILS_URL}/api/v1/recipes/${recipeId}/comments`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// コメント投稿
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> },
) {
  const { recipeId } = await params

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const body = await request.json()

  const res = await fetch(
    `${RAILS_URL}/api/v1/recipes/${recipeId}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        client: client,
        uid: uid,
      },
      body: JSON.stringify(body),
    },
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
