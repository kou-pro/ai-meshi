'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'
import { getSafeNextPath } from '@/lib/redirect'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmationError = searchParams.get('confirmation_error') === 'true'
  const passwordResetSuccess =
    searchParams.get('password_reset_success') === 'true'
  const nextPath = getSafeNextPath(searchParams.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative">
        {/* ×ボタン: ?next= が指定されていれば元のページに戻る */}
        <button
          onClick={() => router.push(nextPath)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          ログイン
        </h1>

        {confirmationError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-700 leading-relaxed">
              メールアドレスの認証に失敗しました。
              <br />
              リンクの有効期限が切れているか、すでに使用済みの可能性があります。
              <br />
              改めて新規登録 or 確認メールの再送をお試しください。
            </p>
          </div>
        )}

        {passwordResetSuccess && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
            <p className="text-sm text-green-700 leading-relaxed">
              パスワードを更新しました。
              <br />
              新しいパスワードでログインしてください。
            </p>
          </div>
        )}

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
            className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-full font-medium hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            {guestLoading ? 'ログイン中...' : 'ゲストとしてログイン'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          アカウントをお持ちでない方は
          <Link
            href={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="text-green-600 hover:underline ml-1"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
