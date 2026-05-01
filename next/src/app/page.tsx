'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'
import Image from 'next/image'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import { useSearchParams } from 'next/navigation'
import {
  ShoppingCartIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

type Recipe = {
  id: number
  title: string
  image_url: string | null
  created_at: string
  likes_count: number
  user: { id: number; name: string }
}

type Tag = {
  tag: string
  count: number
}

type ModalType = 'login' | null

function TopPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)
  const [error, setError] = useState('')
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([])
  const [popularTags, setPopularTags] = useState<Tag[]>([])

  const [modal, setModal] = useState<ModalType>(
    searchParams.get('modal') === 'login' ? 'login' : null,
  )

  useEffect(() => {
    const fetchTopPageData = async () => {
      const res = await fetch('/api/top-page')
      if (!res.ok) return
      const data = await res.json()
      setPopularRecipes(data.popularRecipes)
      setPopularTags(data.popularTags)
    }
    fetchTopPageData()
  }, [])

  useEffect(() => {
    if (modal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [modal])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    if (!response.ok) {
      setError('メールアドレスまたはパスワードが正しくありません')
      return
    }
    router.refresh()
    router.push('/home')
  }

  const handleGuestLogin = async () => {
    setGuestLoading(true)
    const response = await fetch('/api/guest-login', { method: 'POST' })
    if (!response.ok) {
      setError('ゲストログインに失敗しました')
      setGuestLoading(false)
      return
    }
    router.refresh()
    router.push('/home')
    setGuestLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─── デスクトップ用ヘッダー（ロゴのみ） ─── */}
      <header className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center px-6 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="AI飯"
              width={800}
              height={436}
              className="w-auto h-28"
              priority
            />
          </Link>
        </div>
      </header>

      {/* ─── モバイル用ヘッダー（ロゴのみ） ─── */}
      <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center px-4 py-2">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="AI飯"
              width={800}
              height={436}
              className="w-auto h-16"
              priority
            />
          </Link>
        </div>
      </header>

      {/* ─── ヒーローセクション (PC・モバイル共通の背景画像) ─── */}
      <section className="relative overflow-hidden">
        {/* 背景画像: モバイルは右寄せでお皿側を見せる、PCは中央 */}
        <div className="absolute inset-0">
          <Image
            src="/hero-salad.jpg"
            alt=""
            fill
            className="object-cover object-[80%_50%] md:object-center"
            priority
            sizes="100vw"
          />
        </div>

        {/* モバイル限定: 左から白グラデーションでテキスト読みやすく */}
        <div
          className="md:hidden absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 35%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0) 80%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-10 md:py-16 lg:py-20">
          <div className="max-w-[60%] md:max-w-md lg:max-w-lg">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-5 break-keep">
              <span className="text-green-600">AI</span>があなたの
              <br />
              食事をサポート
            </h1>
            <p className="text-sm sm:text-base text-gray-900 font-medium mb-6 md:mb-8 break-keep">
              食材を入力するだけで、
              <br className="md:hidden" />
              AIが最適なレシピを提案します
            </p>
            {/* CTA 群: Google ボタンと同じ最大幅 (max-w-sm) で揃える */}
            <div className="max-w-sm">
              {/* 新規登録 / ログイン: 横並びで 50-50 幅 */}
              <div className="flex gap-3">
                <Link
                  href="/signup"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 shadow-sm text-center transition-colors"
                >
                  新規登録
                </Link>
                <button
                  onClick={() => setModal('login')}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  ログイン
                </button>
              </div>

              {/* 区切り線 + Google ログイン + ゲストログイン */}
              <div className="mt-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px bg-gray-300 flex-1" />
                  <span className="text-xs text-gray-400">または</span>
                  <div className="h-px bg-gray-300 flex-1" />
                </div>
                <div className="space-y-3">
                  <GoogleLoginButton />
                  <button
                    onClick={handleGuestLogin}
                    disabled={guestLoading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                  >
                    {guestLoading ? 'ログイン中...' : 'ゲストとしてログイン'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 人気のレシピ ─── */}
      {popularRecipes.length > 0 && (
        <section className="py-10 md:py-12 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                人気のレシピ
              </h2>
              <Link
                href="/home"
                className="text-sm text-green-600 hover:underline font-medium whitespace-nowrap"
              >
                すべて見る ›
              </Link>
            </div>
            {/* PC・モバイル共通: 横スクロール */}
            <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
              {popularRecipes.slice(0, 5).map((recipe) => (
                <div
                  key={recipe.id}
                  className="shrink-0 w-44 sm:w-56 lg:w-64 snap-start"
                >
                  <RecipeCard
                    id={recipe.id}
                    title={recipe.title}
                    imageUrl={recipe.image_url}
                    userName={recipe.user.name}
                    userId={recipe.user.id}
                    createdAt={recipe.created_at}
                    likesCount={recipe.likes_count}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 人気のタグ ─── */}
      {popularTags.length > 0 && (
        <section className="py-8 md:py-10 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-5">
              人気のタグ
            </h2>
            {/* モバイル: 横スクロール / PC: 折り返し */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
              {popularTags.map((item) => (
                <Link
                  key={item.tag}
                  href={`/home?tag=${encodeURIComponent(item.tag.replace('#', ''))}`}
                  className="shrink-0 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm border border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap"
                >
                  {item.tag}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── AIレシピの使い方 ─── */}
      <section className="py-10 md:py-12 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            AIレシピの使い方
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mb-2 sm:mb-4 rounded-full bg-green-50 flex items-center justify-center">
                <ShoppingCartIcon className="w-5 h-5 sm:w-7 sm:h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1 sm:mb-2 text-xs sm:text-base">
                買い物リスト
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                レシピから買い物リストを作れる
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mb-2 sm:mb-4 rounded-full bg-green-50 flex items-center justify-center">
                <LightBulbIcon className="w-5 h-5 sm:w-7 sm:h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1 sm:mb-2 text-xs sm:text-base">
                AIが提案
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                AIが最適なレシピを提案します
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mb-2 sm:mb-4 rounded-full bg-green-50 flex items-center justify-center">
                <MagnifyingGlassIcon className="w-5 h-5 sm:w-7 sm:h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1 sm:mb-2 text-xs sm:text-base">
                レシピを探す
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                みんなのレシピを探せます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ログインモーダル（既存ロジック維持） ─── */}
      {modal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              ログイン
            </h2>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="パスワードを入力"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
              >
                ログイン
              </button>
              <div className="text-right">
                <a
                  href="/password-reset"
                  className="text-xs text-gray-500 hover:text-green-600"
                >
                  パスワードをお忘れですか？
                </a>
              </div>
            </form>

            <div className="my-6 flex items-center gap-4">
              <hr className="flex-1 border-gray-300" />
              <span className="text-xs text-gray-400">または</span>
              <hr className="flex-1 border-gray-300" />
            </div>

            <div className="space-y-3">
              <GoogleLoginButton />
              <button
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                {guestLoading ? 'ログイン中...' : 'ゲストとしてログイン'}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              アカウントをお持ちでない方は
              <button
                onClick={() => router.push('/signup')}
                className="text-green-600 hover:underline ml-1"
              >
                新規登録
              </button>
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

export default function TopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <TopPageContent />
    </Suspense>
  )
}
