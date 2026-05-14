/**
 * Navbar テスト
 *
 * # 公式サポート状況の注意
 * Navbar は async Server Component。Next.js 公式 Vitest ガイドは
 * https://nextjs.org/docs/app/guides/testing/vitest にて
 *   "Since async Server Components are new to the React ecosystem, Vitest
 *    currently does not support them. ... we recommend using E2E tests for
 *    async components."
 * と明記しており、`await Navbar()` + `render(ui)` は公式サポート外。
 *
 * 本ファイルは「現状の Navbar 実装（cookies / getCurrentUserId / UserMenu）
 * を unit レベルで素早く保証する」目的で、公式未サポートを承知の上で
 * このパターンを採用する。将来 E2E (Playwright) を導入した時点で
 * 本テストを置き換える方針。
 */

import { describe, expect, test, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { cookies } from 'next/headers'
import { getCurrentUserId } from '@/lib/getCurrentUser'
import Navbar from '@/components/Navbar'

// next/headers の cookies() は request context が必要なため必ずモック。
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// getCurrentUserId 内部で fetch を打つためモックして固定値を返す。
vi.mock('@/lib/getCurrentUser', () => ({
  getCurrentUserId: vi.fn(),
}))

// UserMenu は Client Component で副作用 (router など) を持つため、
// 描画されたことだけ検証できる薄いスタブに置換する。
vi.mock('@/components/UserMenu', () => ({
  default: ({ userId }: { userId: number | null }) => (
    <div data-testid="user-menu">UserMenu:{userId ?? 'guest'}</div>
  ),
}))

// next/image は test 環境で安定しないため alt 属性を保持した素の <img> に置換。
// Next.js 固有 props (priority / fill 等) は DOM に渡さず捨てる。
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

const mockedCookies = vi.mocked(cookies)
const mockedGetCurrentUserId = vi.mocked(getCurrentUserId)

// cookieMap で指定したキーだけ { name, value } を返す ReadonlyRequestCookies 互換オブジェクト。
const makeCookieStore = (cookieMap: Record<string, string>) =>
  ({
    get: (name: string) =>
      cookieMap[name] !== undefined ? { name, value: cookieMap[name] } : undefined,
  }) as unknown as Awaited<ReturnType<typeof cookies>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Navbar', () => {
  describe('未ログイン', () => {
    test('「みんなのレシピ」「ログイン」「新規登録」リンクが正しい href で描画される', async () => {
      mockedCookies.mockResolvedValue(makeCookieStore({}))

      const ui = await Navbar()
      render(ui)

      // accessible name + href の両方を検証
      const recipes = screen.getByRole('link', { name: 'みんなのレシピ' })
      expect(recipes.getAttribute('href')).toBe('/home')

      const login = screen.getByRole('link', { name: 'ログイン' })
      expect(login.getAttribute('href')).toBe('/login')

      const signup = screen.getByRole('link', { name: '新規登録' })
      expect(signup.getAttribute('href')).toBe('/signup')

      // ログイン後限定の要素は描画されない
      expect(screen.queryByRole('link', { name: '作る' })).toBeNull()
      expect(screen.queryByTestId('user-menu')).toBeNull()

      // 未ログイン時は getCurrentUserId を呼ばないこと（短絡評価）
      expect(mockedGetCurrentUserId).not.toHaveBeenCalled()
    })
  })

  describe('ログイン済み', () => {
    test('「ホーム」「作る」「保存済み」「買い物リスト」が正しい href で描画され UserMenu に userId が渡る', async () => {
      mockedCookies.mockResolvedValue(
        makeCookieStore({
          'access-token': 'token-abc',
          client: 'client-xyz',
          uid: 'user@example.com',
        }),
      )
      mockedGetCurrentUserId.mockResolvedValue(42)

      const ui = await Navbar()
      render(ui)

      const home = screen.getByRole('link', { name: 'ホーム' })
      expect(home.getAttribute('href')).toBe('/home')

      const create = screen.getByRole('link', { name: '作る' })
      expect(create.getAttribute('href')).toBe('/recipes/new')

      const saved = screen.getByRole('link', { name: '保存済み' })
      expect(saved.getAttribute('href')).toBe('/saved-recipes')

      const shopping = screen.getByRole('link', { name: '買い物リスト' })
      expect(shopping.getAttribute('href')).toBe('/shopping-list')

      // UserMenu に userId=42 が渡る
      expect(screen.getByTestId('user-menu').textContent).toBe('UserMenu:42')

      // 未ログイン限定のリンクは描画されない
      expect(screen.queryByRole('link', { name: '新規登録' })).toBeNull()

      // ログイン時は getCurrentUserId が 1 回だけ呼ばれること
      expect(mockedGetCurrentUserId).toHaveBeenCalledTimes(1)
    })
  })

  describe('共通', () => {
    test('ロゴ画像 (alt="AI飯") が /home リンクとして描画される', async () => {
      mockedCookies.mockResolvedValue(makeCookieStore({}))

      const ui = await Navbar()
      render(ui)

      const logoImg = screen.getByRole('img', { name: 'AI飯' })
      expect(logoImg).toBeDefined()

      // ロゴリンクは accessible name=alt="AI飯" を持つ Link
      const logoLink = screen.getByRole('link', { name: 'AI飯' })
      expect(logoLink.getAttribute('href')).toBe('/home')
    })
  })

  describe('Cookie 境界条件', () => {
    test.each<[Record<string, string>]>([
      [{ 'access-token': 't' }],
      [{ 'access-token': 't', client: 'c' }],
      [{ client: 'c', uid: 'u' }],
    ])(
      '3 Cookie のうち一部欠落 (%j) は未ログイン扱いになる',
      async (cookieMap) => {
        mockedCookies.mockResolvedValue(makeCookieStore(cookieMap))

        const ui = await Navbar()
        render(ui)

        // 未ログイン UI が出る
        expect(screen.getByRole('link', { name: 'ログイン' })).toBeDefined()
        // ログイン後 UI は出ない
        expect(screen.queryByTestId('user-menu')).toBeNull()
        // 短絡評価で getCurrentUserId は呼ばれない
        expect(mockedGetCurrentUserId).not.toHaveBeenCalled()
      },
    )
  })
})
