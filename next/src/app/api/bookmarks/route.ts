import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const RAILS_URL = process.env.NEXT_PUBLIC_RAILS_API_URL

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const res = await fetch(`${RAILS_URL}/api/v1/bookmarks`, {
    headers: {
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const body = await request.json()

  const res = await fetch(`${RAILS_URL}/api/v1/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
    body: JSON.stringify({ recipe_id: body.recipe_id }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
