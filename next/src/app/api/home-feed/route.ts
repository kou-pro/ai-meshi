import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') ?? 'newest'
  const page = searchParams.get('page') ?? '1'

  const res = await fetch(
    `http://rails:3000/api/v1/recipes/published?sort=${sort}&page=${page}`,
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
