import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecipeCard from '@/components/RecipeCard'

const baseProps = {
  id: 1,
  title: 'テストレシピ',
  imageUrl: 'http://example.com/image.jpg',
  userName: 'テストユーザー',
  userId: 42,
  createdAt: '2026-05-12T00:00:00Z',
  likesCount: 10,
}

describe('RecipeCard', () => {
  test('タイトルが表示される', () => {
    render(<RecipeCard {...baseProps} />)
    expect(screen.getByRole('link', { name: 'テストレシピ' })).toBeDefined()
  })

  test('ユーザー名が表示される', () => {
    render(<RecipeCard {...baseProps} />)
    expect(screen.getByRole('link', { name: 'テストユーザー' })).toBeDefined()
  })

  test('likes 数が表示される', () => {
    render(<RecipeCard {...baseProps} likesCount={42} />)
    expect(screen.getByText('42')).toBeDefined()
  })

  test('タイトルリンクが /recipes/:id を指す', () => {
    render(<RecipeCard {...baseProps} id={123} />)
    const titleLink = screen.getByRole('link', { name: 'テストレシピ' })
    expect(titleLink.getAttribute('href')).toBe('/recipes/123')
  })

  test('ユーザー名リンクが /users/:userId を指す', () => {
    render(<RecipeCard {...baseProps} userId={42} />)
    const userLink = screen.getByRole('link', { name: 'テストユーザー' })
    expect(userLink.getAttribute('href')).toBe('/users/42')
  })

  test('imageUrl が指定されたとき img の src に設定される', () => {
    render(
      <RecipeCard {...baseProps} imageUrl="https://example.com/recipe.jpg" />,
    )
    const img = screen.getByRole('img', { name: 'テストレシピ' })
    expect(img.getAttribute('src')).toBe('https://example.com/recipe.jpg')
  })

  test('imageUrl が null のとき /default-recipe.jpg にフォールバック', () => {
    render(<RecipeCard {...baseProps} imageUrl={null} />)
    const img = screen.getByRole('img', { name: 'テストレシピ' })
    expect(img.getAttribute('src')).toBe('/default-recipe.jpg')
  })

  test('createdAt が日本ロケールでフォーマットされて表示される', () => {
    render(<RecipeCard {...baseProps} createdAt="2026-05-12T00:00:00Z" />)
    // toLocaleDateString('ja-JP') の出力に近い形 (例: "2026/5/12")
    expect(screen.getByText(/2026/)).toBeDefined()
  })

  test('isPublished が true のとき "公開中" バッジが表示される', () => {
    render(<RecipeCard {...baseProps} isPublished={true} />)
    expect(screen.getByText('公開中')).toBeDefined()
  })

  test('isPublished が false のとき "未公開" バッジが表示される', () => {
    render(<RecipeCard {...baseProps} isPublished={false} />)
    expect(screen.getByText('未公開')).toBeDefined()
  })

  test('isPublished が未指定のときバッジは表示されない', () => {
    render(<RecipeCard {...baseProps} />)
    expect(screen.queryByText('公開中')).toBeNull()
    expect(screen.queryByText('未公開')).toBeNull()
  })

  test('commentsCount が指定されたとき数値が表示される', () => {
    render(<RecipeCard {...baseProps} commentsCount={7} />)
    expect(screen.getByText('7')).toBeDefined()
  })

  test('commentsCount が未指定のとき "コメント数" が表示されない', () => {
    // likesCount=10、commentsCount 未指定で render
    // 数字を表示する位置は (1) likesCount と (2) commentsCount のみ
    // commentsCount が未指定なら、likesCount の "10" 以外の数値表示はない
    render(<RecipeCard {...baseProps} likesCount={10} />)
    // 候補値 (0-99 などコメント数になりうる値) が画面に存在しないことを確認
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText('1')).toBeNull()
    expect(screen.queryByText('99')).toBeNull()
    // likesCount=10 は表示されている (前提確認)
    expect(screen.getByText('10')).toBeDefined()
  })
})
