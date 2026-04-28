import HomeFeed from '@/components/HomeFeed'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

type SearchParams = {
  tag?: string
  welcome?: string
}

async function fetchInitialRecipes(tag?: string) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return { items: [], has_next_page: false }
  }

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
  const { tag, welcome } = await searchParams

  // ログイン状態を確認
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const isLoggedIn = !!accessToken

  const data = await fetchInitialRecipes(tag)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {welcome === 'true' && isLoggedIn && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800 leading-relaxed">
            🎉 <span className="font-medium">アカウントの有効化が完了しました!</span>
            <br />
            Ai-meshi へようこそ。気になるレシピを探したり、自分のレシピを投稿してみてください。
          </p>
        </div>
      )}
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
