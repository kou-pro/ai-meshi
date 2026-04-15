import { toast } from 'sonner'

export async function fetchWithAuthClient(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, options)

  if (res.status === 401) {
    toast.error('セッションが切れました。再ログインしてください。')
    // Cookieを削除してからリダイレクト
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return res
}
