import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') ?? 'newest'
  const page = searchParams.get('page') ?? '1'
  const query = searchParams.get('query') ?? ''
  const tag = searchParams.get('tag') ?? ''

  const queryParam = query ? `&query=${encodeURIComponent(query)}` : ''
  const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : ''

  // Cookieからトークンを取得
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // トークンがある場合のみヘッダーに追加
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (accessToken && client && uid) {
    headers['access-token'] = accessToken
    headers['client'] = client
    headers['uid'] = uid
  }

  const res = await fetch(
    `${RAILS_URL}/api/v1/recipes/published?sort=${sort}&page=${page}${queryParam}${tagParam}`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    },
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
