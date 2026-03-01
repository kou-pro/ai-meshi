'use client'

// ▼ 'use client' が必要な理由：
// onClick などのイベントハンドラはブラウザ側でのみ動作するため
// Server ComponentではuseRouterもfetchも使えない

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      // ▼ Next.jsのRoute Handler（/api/logout）を経由してログアウト処理を行う
      // 直接Railsを叩かない理由：HTTPOnly CookieはブラウザのJSから読めないため、
      // サーバーサイドのRoute Handlerに中継させる必要がある
      const response = await fetch('/api/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      // ▼ router.refresh() でServer Componentのキャッシュをクリアする
      // これをしないとprotectedページのキャッシュが残り、
      // ログアウト後も認証済みの表示が残ることがある
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // ▼ エラー時もリダイレクトする（UX優先）
      // ログアウト失敗をユーザーに見せるより、ログイン画面に戻す方が安全
      router.push('/login')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
    >
      {isLoading ? 'ログアウト中...' : 'ログアウト'}
    </button>
  )
}
