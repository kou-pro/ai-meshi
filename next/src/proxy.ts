import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 公式推奨の "Optimistic Check with Proxy" パターン。
 *
 * # 役割
 * 1. ログイン済みかどうかの簡易判定 (Cookie 読み取りのみ)
 * 2. Cookie の expiry タイムスタンプから期限切れを事前検知
 * 3. ログイン状態に応じた routes のリダイレクト振り分け
 *
 * # Stateless の原則
 * 本ファイルは Cookie の値を読み取って判定するだけで、Rails や DB への
 * 問い合わせは行わない。Next.js 公式が "avoid database checks to prevent
 * performance issues" と明示しているため。
 *
 * # 期限切れ事前検知の仕組み
 * Rails (devise_token_auth) はログイン時に access-token と一緒に expiry
 * (UNIX timestamp 文字列) を返してくる。これを Cookie に保存しておくことで、
 * Rails に問い合わせずとも「もう Rails 側でトークンが無効化される時刻」を
 * 知ることができる。proxy.ts でこの値と現在時刻を比較し、期限を過ぎていれば
 * 保護ページに進む前にログイン画面へリダイレクトする。
 *
 * これにより「期限切れ Cookie で /recipes/new に到達 → テキスト入力 →
 * 送信時に 401 → 入力消滅」というユーザー体験の最悪パターンを防ぐ。
 *
 * # セキュリティ層としては機能しない
 * 本チェックは「ユーザー体験向上のための先回り」であり、本当のセキュリティ
 * 防御線は Rails 側の認証ミドルウェア。Cookie はクライアント側で改竄可能
 * なので、proxy.ts での optimistic check だけでは保護にならない (公式も
 * "must always validate the session on your server for protected actions
 * or pages" と注意書きあり)。
 */
export default function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('access-token')?.value
  const client = request.cookies.get('client')?.value
  const uid = request.cookies.get('uid')?.value
  const expiry = request.cookies.get('expiry')?.value

  // Cookie 3 点セットが揃っているか
  const isLoggedIn = !!(accessToken && client && uid)

  // expiry が存在する場合のみ期限チェック (Google OAuth / メール確認フロー
  // など expiry を保存していない経路もあるため、欠如時は従来挙動にフォール
  // バック)。
  if (isLoggedIn && expiry) {
    const expiryUnix = Number.parseInt(expiry, 10)
    const nowUnix = Math.floor(Date.now() / 1000)
    if (Number.isFinite(expiryUnix) && nowUnix >= expiryUnix) {
      // 期限切れ確定 → 古い Cookie を消してログイン画面へ
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('access-token')
      response.cookies.delete('client')
      response.cookies.delete('uid')
      response.cookies.delete('expiry')
      return response
    }
  }

  const { pathname } = request.nextUrl
  const protectedRoutes = [
    '/saved-recipes',
    '/recipes/new',
    '/shopping-list',
    '/settings',
  ]

  // ログイン済みユーザーが /login や /signup にアクセスしたら /home へ
  if (
    isLoggedIn &&
    (pathname === '/' || pathname === '/login' || pathname === '/signup')
  ) {
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
    '/',
    '/login',
    '/signup',
    '/recipes/new',
    '/saved-recipes',
    '/shopping-list',
    '/settings/:path*',
    '/settings',
  ],
}
