import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params // ← awaitを追加

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const body = await request.json()

  const res = await fetch(`http://rails:3000/api/v1/recipes/${id}`, {
    method: 'PATCH',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// 削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params // ← awaitを追加

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch(`http://rails:3000/api/v1/recipes/${id}`, {
    method: 'DELETE',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
  })

  return NextResponse.json({ message: '削除しました' }, { status: res.status })
}
