// app/protected/page.tsx

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'

export default async function ProtectedPage() {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    // ▼ Server Component内では redirect() を使う
    // return <div>...</div> より redirect() の方が正しい
    // middlewareで弾かれるケースがほとんどだが、二重チェックとして残す
    redirect('/login')
  }

  const res = await fetch('http://rails:3000/api/v1/users/me', {
    cache: 'no-store',
    headers: {
      'access-token': accessToken,
      client: client,
      uid: uid,
      'Content-Type': 'application/json',
    },
  })

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
