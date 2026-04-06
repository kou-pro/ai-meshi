'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    if (!response.ok) {
      console.error('login failed')
      return
    }
    router.refresh()
    router.push('/home')
  }

  const handleGuestLogin = async () => {
    setGuestLoading(true)
    const response = await fetch('/api/guest-login', {
      method: 'POST',
    })
    if (!response.ok) {
      alert('ゲストログインに失敗しました')
      setGuestLoading(false)
      return
    }
    router.refresh()
    router.push('/home')
    setGuestLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          ログイン
        </h1>

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
      </div>
    </div>
  )
}
