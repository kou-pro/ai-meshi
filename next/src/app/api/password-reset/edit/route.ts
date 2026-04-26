import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  const body = await request.json()

  const res = await fetch(`${RAILS_URL}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: body.password,
      password_confirmation: body.password_confirmation,
      reset_password_token: body.reset_password_token,
      uid: body.uid,
    }),
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'パスワードの再設定に失敗しました' },
      { status: res.status },
    )
  }

  return NextResponse.json({ success: true })
}
