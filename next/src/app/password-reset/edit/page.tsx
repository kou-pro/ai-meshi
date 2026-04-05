'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PasswordResetEditPage() {
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
      router.push('/login')
    } else {
      setError('パスワードの再設定に失敗しました。再度お試しください。')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">新しいパスワードを設定</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          新しいパスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          新しいパスワード（確認）
        </label>
        <input
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '更新中...' : 'パスワードを更新する'}
      </button>
    </div>
  )
}
