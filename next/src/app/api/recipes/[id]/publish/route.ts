import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

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

  const { id } = await params
  const body = await request.json()

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}/publish`, {
    method: 'PATCH',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_published: body.is_published }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
