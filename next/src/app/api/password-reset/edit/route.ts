import { NextRequest, NextResponse } from 'next/server'

const RAILS_URL = process.env.RAILS_API_URL

export async function PATCH(request: NextRequest) {
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
    const data = await res.json()
    console.log('Rails error:', data)
    return NextResponse.json(
      { error: 'パスワードの再設定に失敗しました' },
      { status: res.status },
    )
  }

  return NextResponse.json({ success: true })
}
