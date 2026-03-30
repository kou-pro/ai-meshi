import { NextRequest, NextResponse } from 'next/server'

const RAILS_URL = process.env.RAILS_API_URL

export async function POST(request: NextRequest) {
  const body = await request.json()

  const res = await fetch(`${RAILS_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: body.name,
      email: body.email,
      password: body.password,
      password_confirmation: body.passwordConfirmation,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    return NextResponse.json(error, { status: res.status })
  }

  return NextResponse.json({ message: 'ok' }, { status: 200 })
}
