import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: Request,
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

  const res = await fetch(`${RAILS_URL}/api/v1/bookmarks/${id}`, {
    method: 'DELETE',
    headers: {
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
