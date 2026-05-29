'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import RecipeCard from '@/components/RecipeCard'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

type SortOption = 'newest' | 'popular' | 'following'

type Recipe = {
  id: number
  title: string
  image_url: string | null
  created_at: string
  likes_count: number
  user: {
    id: number
    name: string
    image_url: string | null
  }
}

type Props = {
  initialRecipes: Recipe[]
  initialHasNextPage: boolean
  initialSort: SortOption
  initialQuery: string
  isLoggedIn: boolean
}

export default function HomeFeed({
  initialRecipes,
  initialHasNextPage,
  initialSort,
  initialQuery,
  isLoggedIn,
}: Props) {
  const searchParams = useSearchParams()

  // URL を sort/query/tag の真理値とする (initial 値は SSR 時の searchParams から)
  const sortRaw = searchParams.get('sort')
  const sort: SortOption =
    sortRaw === 'popular' || sortRaw === 'following' ? sortRaw : initialSort
  const query = searchParams.get('query') ?? ''
  const activeTag = searchParams.get('tag') ?? ''

  // 「もっと見る」累積、検索ボックスの入力値、loading は Client state
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [page, setPage] = useState(1)
  const [inputValue, setInputValue] = useState(initialQuery)
  const [loading, setLoading] = useState(false)

  // URL 更新ヘルパー (公式パターン: window.history.pushState)
  // Next.js が pushState を monkey patch するため useSearchParams が自動同期する。
  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const qs = params.toString()
    window.history.pushState(null, '', qs ? `?${qs}` : window.location.pathname)
  }

  const fetchFeed = async ({
    sort: s,
    query: q,
    tag: t,
    page: p,
  }: {
    sort: SortOption
    query: string
    tag: string
    page: number
  }) => {
    const params = new URLSearchParams({ sort: s, page: String(p) })
    if (q) params.set('query', q)
    if (t) params.set('tag', t)
    return fetchWithAuthClient(`/api/home-feed?${params.toString()}`)
  }

  // ソート切替: URL 更新 + 1 ページ目から再取得
  const handleSortChange = async (newSort: SortOption) => {
    if (newSort === sort) return

    // default の 'newest' は URL から消す (見た目のクリーンさ + Cookpad 等の慣習)
    updateUrl({ sort: newSort === 'newest' ? '' : newSort })

    setLoading(true)
    try {
      const res = await fetchFeed({
        sort: newSort,
        query,
        tag: activeTag,
        page: 1,
      })
      if (res.status === 401) return
      if (!res.ok) {
        toast.error('レシピの取得に失敗しました')
        return
      }
      const data = await res.json()
      setRecipes(data.items)
      setHasNextPage(data.has_next_page)
      setPage(1)
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 検索ボックス入力時にタグ絞り込みを解除する
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSearch = async () => {
    const trimmed = inputValue.trim()
    // 先頭 `#` + 1文字以上の本体があればハッシュタグ検索
    const isHashtagSearch = trimmed.startsWith('#') && trimmed.length > 1
    const newQuery = isHashtagSearch ? '' : trimmed
    const newTag = isHashtagSearch ? trimmed.slice(1) : ''

    // 検索時はタグとキーワードを排他的に扱う (既存挙動を維持)
    updateUrl({ query: newQuery, tag: newTag })

    setLoading(true)
    try {
      const res = await fetchFeed({
        sort,
        query: newQuery,
        tag: newTag,
        page: 1,
      })
      if (res.status === 401) return
      if (!res.ok) {
        toast.error('レシピの取得に失敗しました')
        return
      }
      const data = await res.json()
      setRecipes(data.items)
      setHasNextPage(data.has_next_page)
      setPage(1)
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // タグ絞り込み解除: URL から tag を削除して再取得
  const handleTagClear = async () => {
    updateUrl({ tag: '' })

    setLoading(true)
    try {
      const res = await fetchFeed({ sort, query, tag: '', page: 1 })
      if (res.status === 401) return
      if (!res.ok) {
        toast.error('レシピの取得に失敗しました')
        return
      }
      const data = await res.json()
      setRecipes(data.items)
      setHasNextPage(data.has_next_page)
      setPage(1)
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 検索リセット: query / tag を URL から削除
  const handleReset = async () => {
    setInputValue('')
    updateUrl({ query: '', tag: '' })

    setLoading(true)
    try {
      const res = await fetchFeed({ sort, query: '', tag: '', page: 1 })
      if (res.status === 401) return
      if (!res.ok) {
        toast.error('レシピの取得に失敗しました')
        return
      }
      const data = await res.json()
      setRecipes(data.items)
      setHasNextPage(data.has_next_page)
      setPage(1)
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 「もっと見る」: 累積ロード (URL は変えない、業界標準)
  const handleLoadMore = async () => {
    setLoading(true)
    const nextPage = page + 1
    try {
      const res = await fetchFeed({
        sort,
        query,
        tag: activeTag,
        page: nextPage,
      })
      if (res.status === 401) return
      if (!res.ok) {
        toast.error('レシピの取得に失敗しました')
        return
      }
      const data = await res.json()
      setRecipes([...recipes, ...data.items])
      setHasNextPage(data.has_next_page)
      setPage(nextPage)
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* タグバッジ */}
      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[13px] border border-green-200 flex items-center gap-1.5">
            🏷️ #{activeTag}
            <button
              onClick={handleTagClear}
              className="bg-transparent border-none cursor-pointer text-green-600 text-sm p-0 leading-none"
            >
              ✕
            </button>
          </span>
          <span className="text-[13px] text-gray-500">で絞り込み中</span>
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            検索
          </button>
          {(query || activeTag) && (
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
        {/* ログイン済みの場合のみフォロー中タブを表示 */}
        {isLoggedIn && (
          <button
            onClick={() => handleSortChange('following')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              sort === 'following'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            フォロー中
          </button>
        )}
      </div>

      {/* 検索結果表示 */}
      {query && (
        <p className="text-sm text-gray-500 mb-4">「{query}」の検索結果</p>
      )}

      {/* レシピ一覧 */}
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          {activeTag || query ? (
            <>
              <p className="text-gray-500 mb-4">
                該当するレシピが見つかりませんでした
              </p>
              <button
                onClick={handleReset}
                className="text-green-600 underline text-sm"
              >
                検索をリセットする
              </button>
            </>
          ) : (
            <p className="text-gray-500">まだ投稿がありません</p>
          )}
        </div>
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
              userImageUrl={recipe.user.image_url}
              createdAt={recipe.created_at}
              likesCount={recipe.likes_count}
            />
          ))}
        </div>
      )}

      {/* Load Moreボタン */}
      {hasNextPage && recipes.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '読み込み中...' : 'もっと見る'}
          </button>
        </div>
      )}
    </div>
  )
}
