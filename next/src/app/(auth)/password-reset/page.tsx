'use client'

import { useState } from 'react'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)

    await fetch('/api/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            メールを送信しました
          </h1>
          <p className="text-sm text-gray-600 text-center">
            該当するメールアドレスが登録されていれば、
            パスワード再設定メールを送信しました。 メールをご確認ください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          パスワードをお忘れですか？
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="登録したメールアドレスを入力"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50"
        >
          {loading ? '送信中...' : '再設定メールを送信'}
        </button>

        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-xs text-gray-500 hover:text-green-600"
          >
            ログインに戻る
          </a>
        </div>
      </div>
    </div>
  )
}
