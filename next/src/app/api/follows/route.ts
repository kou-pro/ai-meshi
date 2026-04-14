import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const RAILS_URL = process.env.RAILS_API_URL

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const body = await req.json()

  const res = await fetch(`${RAILS_URL}/api/v1/follows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
    body: JSON.stringify({ following_id: body.following_id }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
