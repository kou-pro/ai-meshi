import { cookies } from 'next/headers'

export default async function ProtectedPage() {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  console.log('accessToken:', accessToken)
  console.log('client:', client)
  console.log('uid:', uid)

  if (!accessToken || !client || !uid) {
    return <div>Cookieがありません</div>
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

  console.log('Rails response status:', res.status)

  if (!res.ok) {
    return <div>Unauthorized</div>
  }

  const data = await res.json()

  return (
    <div>
      <h1>Protected</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
