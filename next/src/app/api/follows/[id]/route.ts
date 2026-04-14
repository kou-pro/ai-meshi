import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const RAILS_URL = process.env.RAILS_API_URL

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  const res = await fetch(`${RAILS_URL}/api/v1/follows/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
