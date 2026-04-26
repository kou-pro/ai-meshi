import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
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

  const body = await req.json()

  const res = await fetch(`${RAILS_URL}/api/v1/recipes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
    body: JSON.stringify({ recipe: body }),
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
