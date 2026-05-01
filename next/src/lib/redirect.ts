/**
 * `?next=` クエリパラメータを「同一オリジンの内部パス」のみに制限する。
 *
 * Open Redirect 攻撃（任意の外部 URL へリダイレクトされる脆弱性）対策。
 * OWASP の推奨どおり、文字列操作（startsWith など）ではなく
 * URL コンストラクタで構築・検証する。
 *
 * 参考:
 * - OWASP Cheat Sheet (Unvalidated Redirects and Forwards)
 *   https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
 *
 * @param next 検証対象の値（searchParams から取得した文字列または null）
 * @returns 安全な内部パス。不正な値の場合は "/" を返す。
 */
export function getSafeNextPath(next: string | null): string {
  if (!next) return '/'

  try {
    // ダミーのオリジンを基準に URL として解釈する。
    // 入力が相対パス（例: "/home"）なら、url.origin はダミーのままになる。
    // 入力が絶対 URL（例: "https://evil.com"）なら、url.origin が変わるので拒否できる。
    const placeholderOrigin = 'http://placeholder.invalid'
    const url = new URL(next, placeholderOrigin)

    // オリジンが変わった = 入力に外部 URL や protocol-relative URL（//evil.com）が混入
    if (url.origin !== placeholderOrigin) return '/'

    // pathname + search + hash を組み立てて返す（クエリ・ハッシュも保持）
    return url.pathname + url.search + url.hash
  } catch {
    // URL として解釈できない不正な値
    return '/'
  }
}
