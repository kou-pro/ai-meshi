'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PasswordResetEditPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // URLからトークン情報を取得
  const resetPasswordToken = searchParams.get('reset_password_token')
  const uid = searchParams.get('uid')

  const handleSubmit = async () => {
    if (!password.trim()) return
    if (password !== passwordConfirmation) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/password-reset/edit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        password_confirmation: passwordConfirmation,
        reset_password_token: resetPasswordToken,
        uid,
      }),
    })

    if (res.ok) {
      // ログイン画面側で「パスワードを更新しました」メッセージを表示するため
      // 成功フラグをクエリで付与する。
      router.push('/login?password_reset_success=true')
    } else {
      setError('パスワードの再設定に失敗しました。再度お試しください。')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          新しいパスワードを設定
        </h1>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード（確認）
            </label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {loading ? '更新中...' : 'パスワードを更新する'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <a href="/login" className="text-xs text-gray-500 hover:text-green-600">
            ログインに戻る
          </a>
        </div>
      </div>
    </div>
  )
}

export default function PasswordResetEditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PasswordResetEditPageContent />
    </Suspense>
  )
}
