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

  // ゲストログイン処理
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
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <hr />
      <GoogleLoginButton />
      {/* ゲストログインボタン ← 追加 */}
      <button onClick={handleGuestLogin} disabled={guestLoading}>
        {guestLoading ? 'ログイン中...' : 'ゲストとしてログイン'}
      </button>
    </div>
  )
}
