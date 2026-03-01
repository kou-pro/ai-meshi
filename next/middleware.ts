import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ▼ 3つすべてのCookieが揃っているか確認する
  // devise_token_authは access-token / client / uid の3点セットで認証するため、
  // 1つでも欠けていれば認証済みとは言えない
  const accessToken = request.cookies.get('access-token')?.value
  const client = request.cookies.get('client')?.value
  const uid = request.cookies.get('uid')?.value

  if (!accessToken || !client || !uid) {
    // ▼ 未認証ならログインページへリダイレクト
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// ▼ matcher でガード対象のパスを指定する
// ここに書いたパスにアクセスがあるたびにmiddlewareが実行される
// middlewareはEdge Runtimeで動くため、Railsへの通信など重い処理はできない
// Cookie存在チェックのみここで行い、実際のトークン検証はRails側のAPIに任せる
export const config = {
  matcher: ['/protected/:path*'],
}
