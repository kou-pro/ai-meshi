import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  // 人気レシピと人気タグを並行取得
  const [popularRes, tagsRes] = await Promise.all([
    fetch(`${RAILS_URL}/api/v1/recipes/popular`, { cache: 'no-store' }),
    fetch(`${RAILS_URL}/api/v1/recipes/popular_tags`, { cache: 'no-store' }),
  ])

  const popularRecipes = popularRes.ok ? await popularRes.json() : []
  const popularTags = tagsRes.ok ? await tagsRes.json() : { tags: [] }

  return NextResponse.json({
    popularRecipes,
    popularTags: popularTags.tags ?? [],
  })
}
