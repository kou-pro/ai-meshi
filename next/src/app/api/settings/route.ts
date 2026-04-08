import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const RAILS_URL = process.env.RAILS_API_URL

// ユーザー情報取得
export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const res = await fetch(`${RAILS_URL}/api/v1/users/me`, {
    headers: {
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: res.status },
    )
  }

  const data = await res.json()
  return NextResponse.json(data)
}

// ユーザー情報更新
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // multipart/form-data で受け取る（画像アップロードのため）
  const formData = await request.formData()

  const res = await fetch(`${RAILS_URL}/api/v1/users/me`, {
    method: 'PATCH',
    headers: {
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
    body: formData,
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: res.status },
    )
  }

  const data = await res.json()
  console.log('PATCH response data:', data) // ← PATCHの方に移動
  return NextResponse.json(data)
}
