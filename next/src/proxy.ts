import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('access-token')?.value
  const client = request.cookies.get('client')?.value
  const uid = request.cookies.get('uid')?.value

  const isLoggedIn = !!(accessToken && client && uid)
  const { pathname } = request.nextUrl
  const protectedRoutes = [
    '/saved-recipes',
    '/recipes/new',
    '/shopping-list',
    '/settings',
  ]

  // ログイン済みユーザーが /login や /signup にアクセスしたら /home へ
  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // 未ログインユーザーが認証必須ページにアクセスしたら /login へ
  if (
    !isLoggedIn &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/protected/:path*',
    '/recipes/new',
    '/saved-recipes',
    '/shopping-list',
    '/settings/:path*',
    '/settings',
    '/login',
    '/signup',
  ],
}
