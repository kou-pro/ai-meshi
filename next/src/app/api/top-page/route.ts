import { NextResponse } from 'next/server'

const RAILS_URL = process.env.RAILS_API_URL

export async function GET() {
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
