import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import StarDisplay from '@/components/StarDisplay'

describe('StarDisplay', () => {
  test('label が表示される', () => {
    render(<StarDisplay value={3} label="味" />)
    expect(screen.getByText('味')).toBeDefined()
  })

  test('value が 1 以上のとき "X/5" 表示が出る', () => {
    render(<StarDisplay value={3} label="味" />)
    expect(screen.getByText('3/5')).toBeDefined()
  })

  test('value が 0 のとき "X/5" 表示は出ない', () => {
    render(<StarDisplay value={0} label="味" />)
    expect(screen.queryByText('0/5')).toBeNull()
  })

  test('星が常に 5 つ表示される', () => {
    render(<StarDisplay value={3} label="味" />)
    expect(screen.getAllByText('★')).toHaveLength(5)
  })
})
