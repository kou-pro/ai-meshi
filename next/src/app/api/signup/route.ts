import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const res = await fetch('http://rails:3000/auth', {
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
