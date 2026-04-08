'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'
import Image from 'next/image'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import { useSearchParams } from 'next/navigation'

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

export default function TopPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)
  const [error, setError] = useState('')
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([])
  const [popularTags, setPopularTags] = useState<Tag[]>([])

  // useState の初期値を変更する
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

  // モーダルを開いたときにスクロールを無効化
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
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローセクション */}
      <section className="bg-white py-16 px-6 text-center border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <Image
            src="/logo.png"
            alt="AI飯"
            width={200}
            height={67}
            className="mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            AIがあなたの食事をサポート
          </h1>
          <p className="text-gray-500 mb-8">
            食材を入力するだけで、AIが最適なレシピを提案します
          </p>

          {/* CTAボタン */}
          {/* CTAボタン */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="flex gap-3 w-full max-w-sm">
              <button
                onClick={() => router.push('/signup')}
                className="flex-1 bg-green-600 text-white py-3 rounded-full font-semibold hover:bg-green-700 text-sm shadow-sm"
              >
                新規登録
              </button>
              <button
                onClick={() => router.push('/login')}
                className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-full font-medium hover:bg-gray-50 text-sm shadow-sm"
              >
                ログイン
              </button>
            </div>
            <div className="w-full max-w-sm">
              <GoogleLoginButton />
            </div>
            <button
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="w-full max-w-sm border-2 border-gray-300 text-gray-600 py-3 rounded-full font-medium hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              {guestLoading ? 'ログイン中...' : 'ゲストとしてログイン'}
            </button>
          </div>

          {/* 機能3点カード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-5">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-bold text-gray-800 mb-1 text-sm">
                AIレシピ生成
              </h3>
              <p className="text-xs text-gray-500">
                食材を入力するだけで瞬時にレシピを提案
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-5">
              <div className="text-3xl mb-2">🛒</div>
              <h3 className="font-bold text-gray-800 mb-1 text-sm">
                買い物リスト
              </h3>
              <p className="text-xs text-gray-500">
                必要な食材を自動でリストアップ
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-5">
              <div className="text-3xl mb-2">🔖</div>
              <h3 className="font-bold text-gray-800 mb-1 text-sm">
                レシピ保存
              </h3>
              <p className="text-xs text-gray-500">
                お気に入りのレシピをいつでも確認
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 人気レシピ */}
      {popularRecipes.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">人気レシピ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {popularRecipes.map((recipe) => (
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
          </div>
        </section>
      )}

      {/* 人気タグ */}
      {popularTags.length > 0 && (
        <section className="py-8 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">人気タグ</h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((item) => (
                <Link
                  key={item.tag}
                  href={`/home?tag=${encodeURIComponent(item.tag.replace('#', ''))}`}
                  className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200 hover:bg-green-100"
                >
                  {item.tag}
                  <span className="ml-1 text-xs text-gray-400">
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* モーダル */}
      {modal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {modal === 'login' ? 'ログイン' : '新規登録'}
            </h2>

            {modal === 'login' ? (
              <>
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
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-6 text-sm">
                  アカウントを作成して、AIレシピを始めましょう
                </p>
                <div className="space-y-3">
                  <GoogleLoginButton />
                  <Link
                    href="/signup"
                    className="block w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium text-sm text-center"
                  >
                    メールで登録
                  </Link>
                </div>
                <p className="text-center text-sm text-gray-500 mt-6">
                  すでにアカウントをお持ちの方は
                  <button
                    onClick={() => setModal('login')}
                    className="text-green-600 hover:underline ml-1"
                  >
                    ログイン
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
