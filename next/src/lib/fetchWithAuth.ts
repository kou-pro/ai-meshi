import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  // 3 Cookie のいずれかが欠落 = 未ログイン。公式 DAL パターンに従い再ログインへ誘導。
  if (!accessToken || !client || !uid) {
    redirect('/login')
  }

  return fetch(url, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'access-token': accessToken,
      client,
      uid,
    },
  })
}