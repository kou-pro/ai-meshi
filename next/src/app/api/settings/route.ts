import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// ユーザー情報取得
export async function GET() {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

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
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

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
  return NextResponse.json(data)
}
