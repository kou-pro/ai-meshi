// app/protected/page.tsx

import { redirect } from 'next/navigation'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function ProtectedPage() {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    throw new Error('Server configuration error')
  }

  // 認証ヘッダー / Cookie 欠落時の redirect / cache: 'no-store' は fetchWithAuth が処理する。
  const res = await fetchWithAuth(`${RAILS_URL}/api/v1/users/me`)

  // res.ok=false (401 等) のときは再ログインへ誘導
  if (!res.ok) {
    redirect('/login')
  }

  const data = await res.json()

  return (
    <div>
      <h1>Protected</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {/* ▼ LogoutButtonはClient Component。Server Componentの中に置いてOK */}
      <LogoutButton />
    </div>
  )
}
