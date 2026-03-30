import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const RAILS_URL = process.env.RAILS_API_URL

async function likeRequest(
  request: NextRequest,
  recipeId: string,
  method: 'POST' | 'DELETE',
) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(
    `${RAILS_URL}/api/v1/recipes/${recipeId}/likes`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        client: client,
        uid: uid,
      },
    },
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return likeRequest(request, id, 'POST')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return likeRequest(request, id, 'DELETE')
}
