'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'

export default function SettingsPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) return
      const data = await res.json()
      setName(data.name ?? '')
      setEmail(data.email ?? '')
      setImageUrl(data.image_url ?? null)
    }
    fetchUser()
  }, [])

  // 名前・画像を更新
  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')

    const formData = new FormData()
    if (name) formData.append('name', name)
    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0])
    }

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      setName(data.name ?? '')
      setImageUrl(data.image_url ?? null)
      setMessage('更新しました')
      router.refresh()
    } else {
      setMessage('更新に失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">マイページ</h1>

        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

        {/* ユーザー画像 */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="プロフィール画像"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                👤
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-green-600 hover:text-green-700"
          >
            画像を変更
          </button>
          <input
            type="file"
            accept="image/png,image/jpeg"
            ref={fileInputRef}
            className="hidden"
          />
        </div>

        {/* 名前 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* メール（表示のみ） */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <p className="text-sm text-gray-600">{email}</p>
        </div>

        {/* 更新ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium disabled:opacity-50 mb-6"
        >
          {loading ? '更新中...' : '変更を保存'}
        </button>

        <hr className="border-gray-200 mb-6" />

        {/* ログアウト */}
        <LogoutButton />
      </div>
    </div>
  )
}
