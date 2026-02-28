import { cookies } from 'next/headers'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get('access_token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'access-token': accessToken ?? '',
      client: client ?? '',
      uid: uid ?? '',
    },
  })
}
