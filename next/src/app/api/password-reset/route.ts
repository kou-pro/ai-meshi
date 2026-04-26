import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: body.email,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/password-reset/edit`,
    }),
  })

  // メールアドレスの存在有無を露出しないため常に200を返す
  return NextResponse.json({ success: true }, { status: 200 })
}
