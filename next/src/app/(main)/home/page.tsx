import HomeFeed from '@/components/HomeFeed'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

type SortOption = 'newest' | 'popular' | 'following'

type SearchParams = {
  sort?: string
  query?: string
  tag?: string
  welcome?: string
}

// sort パラメータの値を type-safe に正規化する
// 不正な値 (?sort=foo 等) が来た場合は default の 'newest' に倒す
function normalizeSort(raw: string | undefined): SortOption {
  if (raw === 'popular' || raw === 'following') return raw
  return 'newest'
}

async function fetchInitialRecipes({
  sort,
  query,
  tag,
}: {
  sort: SortOption
  query: string
  tag: string
}) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return { items: [], has_next_page: false }
  }

  const params = new URLSearchParams({ sort, page: '1' })
  if (query) params.set('query', query)
  if (tag) params.set('tag', tag)

  const res = await fetch(
    `${RAILS_URL}/api/v1/recipes/published?${params.toString()}`,
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
  const raw = await searchParams
  const sort = normalizeSort(raw.sort)
  const query = raw.query ?? ''
  const tag = raw.tag ?? ''
  const welcome = raw.welcome

  // ログイン状態を確認
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const isLoggedIn = !!accessToken

  const data = await fetchInitialRecipes({ sort, query, tag })

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
      {/* key で sort/query/tag が変わったら HomeFeed をリマウント。
          こうすることで「もっと見る」累積 state (recipes/page) も初期化される。
          リロード時や URL 直アクセス時に initialRecipes と整合性が保たれる。 */}
      <HomeFeed
        key={`${sort}-${query}-${tag}`}
        initialRecipes={data.items}
        initialHasNextPage={data.has_next_page}
        initialSort={sort}
        initialQuery={query}
        initialTag={tag}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
