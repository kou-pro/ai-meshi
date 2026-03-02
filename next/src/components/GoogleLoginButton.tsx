'use client'

export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    // ▼ RailsのOmniAuth認証エンドポイントへ直接リダイレクト
    // Next.jsを経由せずブラウザがRailsへ直接アクセスする
    // これによりRailsがGoogleの認証画面へリダイレクトしてくれる
    window.location.href = 'http://localhost:3000/omniauth/google_oauth2'
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
    >
      Googleでログイン
    </button>
  )
}
