import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const res = await fetch('http://rails:3000/auth/sign_in', {
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
