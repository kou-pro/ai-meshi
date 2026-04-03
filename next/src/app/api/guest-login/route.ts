import { NextResponse } from 'next/server'

const RAILS_URL = process.env.RAILS_API_URL

export async function POST() {
  const res = await fetch(`${RAILS_URL}/api/v1/guest_sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'ゲストログインに失敗しました' },
      { status: res.status },
    )
  }

  // ボディからトークンを取得
  const data = await res.json()
  const accessToken = data.tokens['access-token']
  const client = data.tokens['client']
  const uid = data.tokens['uid']
  const expiry = data.tokens['expiry']

  if (!accessToken || !client || !uid || !expiry) {
    return NextResponse.json({ error: 'Token missing' }, { status: 500 })
  }

  const response = NextResponse.json({ success: true })

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

  response.cookies.set('access-token', accessToken, cookieOptions)
  response.cookies.set('client', client, cookieOptions)
  response.cookies.set('uid', uid, cookieOptions)
  response.cookies.set('expiry', expiry, cookieOptions)

  return response
}
