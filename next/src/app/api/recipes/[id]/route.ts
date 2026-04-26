import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// 取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  const { id } = await params

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}`, {
    method: 'GET',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// 編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  const { id } = await params // ← awaitを追加

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const formData = await request.formData() // FormDataを受け取る

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}`, {
    method: 'PATCH',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    body: formData,
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// 削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  const { id } = await params // ← awaitを追加

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}`, {
    method: 'DELETE',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
  })

  return NextResponse.json({ message: '削除しました' }, { status: res.status })
}
