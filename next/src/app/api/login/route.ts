import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  try {
    const body = await req.json()

    const res = await fetch(`${RAILS_URL}/auth/sign_in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Login failed' }, { status: 401 })
    }

    const accessToken = res.headers.get('access-token')
    const client = res.headers.get('client')
    const uid = res.headers.get('uid')
    const expiry = res.headers.get('expiry')

    if (!accessToken || !client || !uid || !expiry) {
      return NextResponse.json({ error: 'Token missing' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      // Rails 側 token_lifespan = 2.weeks に合わせて 14 日。
      // maxAge 未設定だとセッション Cookie となりブラウザを閉じた瞬間に消える。
      maxAge: 60 * 60 * 24 * 14,
    }

    response.cookies.set('access-token', accessToken, cookieOptions)
    response.cookies.set('client', client, cookieOptions)
    response.cookies.set('uid', uid, cookieOptions)
    response.cookies.set('expiry', expiry, cookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
