import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const RAILS_URL = process.env.RAILS_API_URL

export async function GET() {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const railsRes = await fetch(
    `${RAILS_URL}/api/v1/users/me`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        client: client,
        uid: uid,
      },
      cache: 'no-store',
    },
  )

  if (!railsRes.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await railsRes.json()

  return NextResponse.json(data)
}
