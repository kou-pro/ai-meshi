import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/node'
import SaveButton from '@/components/SaveButton'

describe('SaveButton', () => {
  describe('初期表示', () => {
    test('initialBookmarked=false のとき aria-label は "保存する"', () => {
      render(<SaveButton recipeId={1} initialBookmarked={false} />)
      expect(screen.getByRole('button', { name: '保存する' })).toBeDefined()
    })

    test('initialBookmarked=true のとき aria-label は "保存を解除"', () => {
      render(<SaveButton recipeId={1} initialBookmarked={true} />)
      expect(screen.getByRole('button', { name: '保存を解除' })).toBeDefined()
    })
  })

  describe('クリック動作', () => {
    test('initialBookmarked=false でクリックすると aria-pressed が true になる', async () => {
      const user = userEvent.setup()
      render(<SaveButton recipeId={1} initialBookmarked={false} />)

      const button = screen.getByRole('button', { name: '保存する' })
      await user.click(button)

      const updatedButton = await screen.findByRole('button', {
        name: '保存を解除',
      })
      expect(updatedButton.getAttribute('aria-pressed')).toBe('true')
    })

    test('initialBookmarked=true でクリックすると aria-pressed が false になる', async () => {
      const user = userEvent.setup()
      render(<SaveButton recipeId={1} initialBookmarked={true} />)

      const button = screen.getByRole('button', { name: '保存を解除' })
      await user.click(button)

      const updatedButton = await screen.findByRole('button', {
        name: '保存する',
      })
      expect(updatedButton.getAttribute('aria-pressed')).toBe('false')
    })
  })

  describe('楽観的更新の rollback (API エラー時)', () => {
    test('POST が 500 を返したとき aria-pressed が元の false に rollback される', async () => {
      // POST だけ 500 に上書き
      server.use(
        http.post('/api/bookmarks', () => {
          return new HttpResponse(null, { status: 500 })
        }),
      )

      const user = userEvent.setup()
      render(<SaveButton recipeId={1} initialBookmarked={false} />)

      const button = screen.getByRole('button', { name: '保存する' })
      await user.click(button)

      // rollback されて "保存する" に戻る
      const rolledBackButton = await screen.findByRole('button', {
        name: '保存する',
      })
      expect(rolledBackButton.getAttribute('aria-pressed')).toBe('false')
    })

    test('DELETE が 500 を返したとき aria-pressed が元の true に rollback される', async () => {
      server.use(
        http.delete('/api/bookmarks/:recipeId', () => {
          return new HttpResponse(null, { status: 500 })
        }),
      )

      const user = userEvent.setup()
      render(<SaveButton recipeId={1} initialBookmarked={true} />)

      const button = screen.getByRole('button', { name: '保存を解除' })
      await user.click(button)

      const rolledBackButton = await screen.findByRole('button', {
        name: '保存を解除',
      })
      expect(rolledBackButton.getAttribute('aria-pressed')).toBe('true')
    })
  })
})
