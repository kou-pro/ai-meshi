import { NextRequest, NextResponse } from 'next/server'

const RAILS_URL = process.env.RAILS_API_URL

export async function POST(request: NextRequest) {
  const body = await request.json()

  const res = await fetch(`${RAILS_URL}/auth/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: body.email,
      redirect_url: 'http://localhost:8000/password-reset/edit',
    }),
  })

  console.log('Rails response status:', res.status) // ← 追加

  // メールアドレスの存在有無を露出しないため常に200を返す
  return NextResponse.json({ success: true }, { status: 200 })
}
