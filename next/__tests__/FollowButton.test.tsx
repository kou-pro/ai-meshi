import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/node'
import FollowButton from '@/components/FollowButton'

describe('FollowButton', () => {
  describe('初期表示', () => {
    test('initialIsFollowing=false のとき "フォローする" が表示される', () => {
      render(<FollowButton targetUserId={1} initialIsFollowing={false} />)
      expect(
        screen.getByRole('button', { name: 'フォローする' }),
      ).toBeDefined()
    })

    test('initialIsFollowing=true のとき "フォロー中" が表示される', () => {
      render(<FollowButton targetUserId={1} initialIsFollowing={true} />)
      expect(screen.getByRole('button', { name: 'フォロー中' })).toBeDefined()
    })
  })

  describe('クリック動作', () => {
    test('initialIsFollowing=false でクリックすると "フォロー中" に切替', async () => {
      const user = userEvent.setup()
      render(<FollowButton targetUserId={1} initialIsFollowing={false} />)

      const button = screen.getByRole('button', { name: 'フォローする' })
      await user.click(button)

      expect(
        await screen.findByRole('button', { name: 'フォロー中' }),
      ).toBeDefined()
    })

    test('initialIsFollowing=true でクリックすると "フォローする" に切替', async () => {
      const user = userEvent.setup()
      render(<FollowButton targetUserId={1} initialIsFollowing={true} />)

      const button = screen.getByRole('button', { name: 'フォロー中' })
      await user.click(button)

      expect(
        await screen.findByRole('button', { name: 'フォローする' }),
      ).toBeDefined()
    })
  })

  describe('API エラー時', () => {
    test('POST 500 エラー時に "フォローする" のまま変化しない', async () => {
      server.use(
        http.post('/api/follows', () => {
          return new HttpResponse(null, { status: 500 })
        }),
      )

      const user = userEvent.setup()
      render(<FollowButton targetUserId={1} initialIsFollowing={false} />)

      const button = screen.getByRole('button', { name: 'フォローする' })
      await user.click(button)

      // 楽観的更新なし & エラーで状態変化なし → "フォローする" のまま
      expect(
        screen.getByRole('button', { name: 'フォローする' }),
      ).toBeDefined()
    })

    test('DELETE 500 エラー時に "フォロー中" のまま変化しない', async () => {
      server.use(
        http.delete('/api/follows/:targetUserId', () => {
          return new HttpResponse(null, { status: 500 })
        }),
      )

      const user = userEvent.setup()
      render(<FollowButton targetUserId={1} initialIsFollowing={true} />)

      const button = screen.getByRole('button', { name: 'フォロー中' })
      await user.click(button)

      expect(screen.getByRole('button', { name: 'フォロー中' })).toBeDefined()
    })
  })
})
