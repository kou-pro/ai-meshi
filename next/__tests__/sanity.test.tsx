import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

test('Vitest と React Testing Library が動作する', () => {
  render(<div>Hello, Vitest!</div>)
  expect(screen.getByText('Hello, Vitest!')).toBeDefined()
})
