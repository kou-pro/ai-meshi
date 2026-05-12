import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/node'
import LikeButton from '@/components/LikeButton'

describe('LikeButton', () => {
  describe('初期表示', () => {
    test('initialLiked=false のとき aria-label は "いいねする"', () => {
      render(
        <LikeButton recipeId={1} initialLiked={false} isLoggedIn={true} />,
      )
      expect(screen.getByRole('button', { name: 'いいねする' })).toBeDefined()
    })

    test('initialLiked=true のとき aria-label は "いいねを取り消す"', () => {
      render(<LikeButton recipeId={1} initialLiked={true} isLoggedIn={true} />)
      expect(
        screen.getByRole('button', { name: 'いいねを取り消す' }),
      ).toBeDefined()
    })
  })

  describe('認証済みクリック動作', () => {
    test('initialLiked=false でクリックすると aria-pressed が true になる', async () => {
      const user = userEvent.setup()
      render(
        <LikeButton recipeId={1} initialLiked={false} isLoggedIn={true} />,
      )

      const button = screen.getByRole('button', { name: 'いいねする' })
      await user.click(button)

      // クリック後、aria-label が "いいねを取り消す" に変わる
      const updatedButton = await screen.findByRole('button', {
        name: 'いいねを取り消す',
      })
      expect(updatedButton.getAttribute('aria-pressed')).toBe('true')
    })

    test('initialLiked=true でクリックすると aria-pressed が false になる', async () => {
      const user = userEvent.setup()
      render(<LikeButton recipeId={1} initialLiked={true} isLoggedIn={true} />)

      const button = screen.getByRole('button', { name: 'いいねを取り消す' })
      await user.click(button)

      const updatedButton = await screen.findByRole('button', {
        name: 'いいねする',
      })
      expect(updatedButton.getAttribute('aria-pressed')).toBe('false')
    })
  })

  describe('未認証時', () => {
    test('isLoggedIn=false でクリックしても aria-pressed は変化しない', async () => {
      const user = userEvent.setup()
      render(
        <LikeButton recipeId={1} initialLiked={false} isLoggedIn={false} />,
      )

      const button = screen.getByRole('button', { name: 'いいねする' })
      await user.click(button)

      // 状態が変化しないので、依然として "いいねする" のまま
      expect(button.getAttribute('aria-pressed')).toBe('false')
    })
  })

  describe('API エラー時', () => {
    test('500 エラー時に aria-pressed が変化しない', async () => {
      // この test のみ POST を 500 で返すように handler を上書き
      server.use(
        http.post('/api/likes/:recipeId', () => {
          return new HttpResponse(null, { status: 500 })
        }),
      )

      const user = userEvent.setup()
      render(
        <LikeButton recipeId={1} initialLiked={false} isLoggedIn={true} />,
      )

      const button = screen.getByRole('button', { name: 'いいねする' })
      await user.click(button)

      // エラーなので状態は変わらない
      expect(button.getAttribute('aria-pressed')).toBe('false')
    })
  })
})
