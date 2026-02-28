import { cookies } from 'next/headers'

export default async function ProtectedPage() {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  return (
    <div>
      <h1>Protected</h1>
      <pre>{JSON.stringify({ accessToken, client, uid }, null, 2)}</pre>
    </div>
  )
}
