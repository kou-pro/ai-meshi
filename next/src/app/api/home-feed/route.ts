import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') ?? 'newest'
  const page = searchParams.get('page') ?? '1'
  const query = searchParams.get('query') ?? ''
  const tag = searchParams.get('tag') ?? '' // 追加

  // queryがある場合だけURLに追加する
  const queryParam = query ? `&query=${encodeURIComponent(query)}` : ''

  // tagがある場合だけURLに追加する
  const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : ''

  const res = await fetch(
    `http://rails:3000/api/v1/recipes/published?sort=${sort}&page=${page}${queryParam}${tagParam}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
