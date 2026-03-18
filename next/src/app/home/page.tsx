import HomeFeed from '@/components/HomeFeed'

type Recipe = {
  id: number
  title: string
  image_url: string | null
  created_at: string
  likes_count: number
  user: {
    id: number
    name: string
  }
}

async function fetchInitialRecipes() {
  const res = await fetch(
    'http://rails:3000/api/v1/recipes/published?sort=newest&page=1',
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    },
  )
  if (!res.ok) return { items: [], has_next_page: false }
  return res.json()
}

export default async function HomePage() {
  const data = await fetchInitialRecipes()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">みんなのレシピ</h1>
      <HomeFeed
        initialRecipes={data.items}
        initialHasNextPage={data.has_next_page}
      />
    </div>
  )
}
