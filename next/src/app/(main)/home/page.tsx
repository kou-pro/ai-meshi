import HomeFeed from '@/components/HomeFeed'
import { cookies } from 'next/headers'

const RAILS_URL = process.env.RAILS_API_URL

type SearchParams = {
  tag?: string
}

async function fetchInitialRecipes(tag?: string) {
  const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : ''
  const res = await fetch(
    `${RAILS_URL}/api/v1/recipes/published?sort=newest&page=1${tagParam}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    },
  )
  if (!res.ok) return { items: [], has_next_page: false }
  return res.json()
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { tag } = await searchParams

  // ログイン状態を確認
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const isLoggedIn = !!accessToken

  const data = await fetchInitialRecipes(tag)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">みんなのレシピ</h1>
      <HomeFeed
        initialRecipes={data.items}
        initialHasNextPage={data.has_next_page}
        initialTag={tag ?? ''}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
