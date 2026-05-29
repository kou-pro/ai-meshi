import { describe, expect, test, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommentSection from '@/components/CommentSection'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'
import { toast } from 'sonner'

// Next.js App Router の useRouter は AppRouterContext がないとエラーになるため、
// router.refresh() を no-op にした最小限のモックを差し込む。
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// 投稿/削除の fetch を直接コントロールするため、モジュール単位でモック。
vi.mock('@/lib/fetchWithAuthClient', () => ({
  fetchWithAuthClient: vi.fn(),
}))

// 削除失敗時の toast.error 呼び出しを検証するためモック。
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

const mockedFetch = vi.mocked(fetchWithAuthClient)
const mockedToastError = vi.mocked(toast.error)

const sampleComment = (
  overrides: Partial<{
    id: number
    body: string
    created_at: string
    user: { id: number; name: string; image_url: string | null }
  }> = {},
) => ({
  id: 1,
  body: 'おいしそうですね！',
  created_at: '2026-05-13T10:00:00Z',
  user: { id: 2, name: 'たろう', image_url: null },
  ...overrides,
})

// 最小限の Response 互換オブジェクト。RequestInit/Response 全体は不要なので
// 本テストで参照されるプロパティだけ持たせて Response として cast する。
const makeRes = (init: {
  ok: boolean
  status: number
  body?: unknown
}): Response =>
  ({
    ok: init.ok,
    status: init.status,
    json: async () => init.body,
  }) as unknown as Response

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CommentSection', () => {
  describe('初期表示', () => {
    test('未ログイン時はログイン誘導文が表示され、textarea は描画されない', () => {
      render(
        <CommentSection
          recipeId={1}
          initialComments={[]}
          isLoggedIn={false}
          currentUserId={null}
        />,
      )

      expect(screen.getByRole('link', { name: 'ログイン' })).toBeDefined()
      expect(screen.queryByRole('textbox')).toBeNull()
    })

    test('ログイン済みでコメント0件のときは「まだコメントはありません」が表示される', () => {
      render(
        <CommentSection
          recipeId={1}
          initialComments={[]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      expect(screen.getByText('まだコメントはありません')).toBeDefined()
      expect(screen.getByRole('textbox')).toBeDefined()
      expect(
        screen.getByRole('button', { name: 'コメントする' }),
      ).toBeDefined()
    })

    test('コメントがある場合は本文と投稿者名が表示される', () => {
      render(
        <CommentSection
          recipeId={1}
          initialComments={[sampleComment()]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      expect(screen.getByText('おいしそうですね！')).toBeDefined()
      expect(screen.getByText('たろう')).toBeDefined()
    })

    test('自分のコメントには「コメントを削除」ボタンが表示される', () => {
      render(
        <CommentSection
          recipeId={1}
          initialComments={[sampleComment({ user: { id: 1, name: '自分', image_url: null } })]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      expect(
        screen.getByRole('button', { name: 'コメントを削除' }),
      ).toBeDefined()
    })

    test('他人のコメントには削除ボタンが表示されない', () => {
      render(
        <CommentSection
          recipeId={1}
          initialComments={[sampleComment({ user: { id: 2, name: '他人', image_url: null } })]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      expect(screen.queryByRole('button', { name: 'コメントを削除' })).toBeNull()
    })
  })

  describe('コメント投稿', () => {
    test('成功時: 入力 → 送信で新コメントが一覧先頭に追加され textarea がクリアされる', async () => {
      mockedFetch.mockResolvedValueOnce(
        makeRes({
          ok: true,
          status: 201,
          body: sampleComment({ id: 99, body: '最高でした' }),
        }),
      )

      const user = userEvent.setup()
      render(
        <CommentSection
          recipeId={1}
          initialComments={[]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      await user.type(textarea, '最高でした')
      await user.click(screen.getByRole('button', { name: 'コメントする' }))

      // 新コメントが描画される
      expect(await screen.findByText('最高でした')).toBeDefined()
      // textarea はクリアされる
      expect(textarea.value).toBe('')
      // fetchWithAuthClient が正しい URL/method で呼ばれる
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/comments/1',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    test('失敗時 (res.ok=false): エラーメッセージが表示される', async () => {
      mockedFetch.mockResolvedValueOnce(
        makeRes({
          ok: false,
          status: 422,
          body: { errors: ['内容を入力してください'] },
        }),
      )

      const user = userEvent.setup()
      render(
        <CommentSection
          recipeId={1}
          initialComments={[]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      await user.type(screen.getByRole('textbox'), 'x')
      await user.click(screen.getByRole('button', { name: 'コメントする' }))

      expect(await screen.findByText('内容を入力してください')).toBeDefined()
    })

    test('ネットワークエラー時: 「通信エラーが発生しました」が表示される', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('network down'))

      const user = userEvent.setup()
      render(
        <CommentSection
          recipeId={1}
          initialComments={[]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      await user.type(screen.getByRole('textbox'), 'x')
      await user.click(screen.getByRole('button', { name: 'コメントする' }))

      expect(
        await screen.findByText('通信エラーが発生しました'),
      ).toBeDefined()
    })

    test('401 時: 一覧に変化なく、エラー文も表示されない（早期 return）', async () => {
      mockedFetch.mockResolvedValueOnce(
        makeRes({ ok: false, status: 401, body: null }),
      )

      const user = userEvent.setup()
      render(
        <CommentSection
          recipeId={1}
          initialComments={[]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      await user.type(screen.getByRole('textbox'), 'x')
      await user.click(screen.getByRole('button', { name: 'コメントする' }))

      // 「コメントの投稿に失敗しました」も「通信エラー」も出ない
      expect(screen.queryByText('コメントの投稿に失敗しました')).toBeNull()
      expect(screen.queryByText('通信エラーが発生しました')).toBeNull()
      // 一覧も空のまま
      expect(screen.getByText('まだコメントはありません')).toBeDefined()
    })
  })

  describe('コメント削除', () => {
    test('confirm=true で削除すると該当コメントが一覧から消える', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
      mockedFetch.mockResolvedValueOnce(
        makeRes({ ok: true, status: 200, body: null }),
      )

      const user = userEvent.setup()
      render(
        <CommentSection
          recipeId={1}
          initialComments={[
            sampleComment({
              id: 10,
              body: '消えるコメント',
              user: { id: 1, name: '自分', image_url: null },
            }),
          ]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      await user.click(
        screen.getByRole('button', { name: 'コメントを削除' }),
      )

      // 該当コメントが消える
      expect(screen.queryByText('消えるコメント')).toBeNull()
      // DELETE が正しい URL で呼ばれる
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/comments/1/10',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    test('削除失敗時 toast.error("削除に失敗しました") が呼ばれる', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
      mockedFetch.mockResolvedValueOnce(
        makeRes({ ok: false, status: 500, body: null }),
      )

      const user = userEvent.setup()
      render(
        <CommentSection
          recipeId={1}
          initialComments={[
            sampleComment({
              id: 10,
              body: '残るコメント',
              user: { id: 1, name: '自分', image_url: null },
            }),
          ]}
          isLoggedIn={true}
          currentUserId={1}
        />,
      )

      await user.click(
        screen.getByRole('button', { name: 'コメントを削除' }),
      )

      // toast.error が呼ばれ
      expect(mockedToastError).toHaveBeenCalledWith('削除に失敗しました')
      // コメントは消えない
      expect(screen.getByText('残るコメント')).toBeDefined()
    })
  })
})
