'use client'

import { useState } from 'react'
import RecipeCard from '@/components/RecipeCard'

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

type Props = {
  initialRecipes: Recipe[]
  initialHasNextPage: boolean
  initialTag?: string
}

export default function HomeFeed({
  initialRecipes,
  initialHasNextPage,
  initialTag = '',
}: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'newest' | 'popular'>('newest')
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [activeTag, setActiveTag] = useState(initialTag)

  const handleSearch = async () => {
    setLoading(true)
    setQuery(inputValue)

    const queryParam = inputValue
      ? `&query=${encodeURIComponent(inputValue)}`
      : ''
    const res = await fetch(`/api/home-feed?sort=${sort}&page=1${queryParam}`)
    const data = await res.json()

    setRecipes(data.items)
    setHasNextPage(data.has_next_page)
    setPage(1)
    setLoading(false)
  }

  // 検索窓入力時にタグを解除する
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (activeTag) {
      setActiveTag('') // タグ絞り込みを解除
    }
  }

  // タグ絞り込み解除
  const handleTagClear = async () => {
    setLoading(true)
    setActiveTag('')

    const res = await fetch(`/api/home-feed?sort=${sort}&page=1`)
    const data = await res.json()

    setRecipes(data.items)
    setHasNextPage(data.has_next_page)
    setPage(1)
    setLoading(false)
  }

  // 検索リセット
  const handleReset = async () => {
    setLoading(true)
    setQuery('')
    setInputValue('')
    setActiveTag('')

    const res = await fetch(`/api/home-feed?sort=${sort}&page=1`)
    const data = await res.json()

    setRecipes(data.items)
    setHasNextPage(data.has_next_page)
    setPage(1)
    setLoading(false)
  }

  // ソート切り替え
  const handleSortChange = async (newSort: 'newest' | 'popular') => {
    if (newSort === sort) return
    setSort(newSort)
    setLoading(true)

    const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ''
    const queryParam = query ? `&query=${encodeURIComponent(query)}` : ''
    const res = await fetch(
      `/api/home-feed?sort=${newSort}&page=1${tagParam}${queryParam}`,
    )
    const data = await res.json()

    setRecipes(data.items)
    setHasNextPage(data.has_next_page)
    setPage(1)
    setLoading(false)
  }

  // Load More
  const handleLoadMore = async () => {
    setLoading(true)
    const nextPage = page + 1

    const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ''
    const queryParam = query ? `&query=${encodeURIComponent(query)}` : ''
    const res = await fetch(
      `/api/home-feed?sort=${sort}&page=${nextPage}${tagParam}${queryParam}`,
    )
    const data = await res.json()

    setRecipes([...recipes, ...data.items])
    setHasNextPage(data.has_next_page)
    setPage(nextPage)
    setLoading(false)
  }

  return (
    <div>
      {/* タグバッジ */}
      {activeTag && (
        <div
          className="mb-4"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span
            style={{
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🏷️ #{activeTag}
            <button
              onClick={handleTagClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#16a34a',
                fontSize: '14px',
                padding: '0',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            で絞り込み中
          </span>
        </div>
      )}

      {/* 検索フォーム */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="料理名や #タグ で検索"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            検索
          </button>
          {query && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 text-sm"
            >
              リセット
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          複数語はスペース区切りで検索できます
        </p>
      </div>

      {/* ソート切り替え */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleSortChange('newest')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            sort === 'newest'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          新着順
        </button>
        <button
          onClick={() => handleSortChange('popular')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            sort === 'popular'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          人気順
        </button>
      </div>

      {/* 検索結果表示 */}
      {query && (
        <p className="text-sm text-gray-500 mb-4">「{query}」の検索結果</p>
      )}

      {/* レシピ一覧 */}
      {recipes.length === 0 ? (
        <p className="text-gray-500">
          {activeTag || query
            ? '該当するレシピが見つかりませんでした'
            : 'まだ投稿がありません'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              imageUrl={recipe.image_url}
              userName={recipe.user.name}
              userId={recipe.user.id}
              createdAt={recipe.created_at}
              likesCount={recipe.likes_count}
            />
          ))}
        </div>
      )}

      {/* Load Moreボタン */}
      {hasNextPage && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '読み込み中...' : 'もっと見る'}
          </button>
        </div>
      )}
    </div>
  )
}
