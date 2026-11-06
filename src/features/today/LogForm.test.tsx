import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogForm } from './LogForm'
import { TEST_DATE } from '../../test/fixtures'

describe('LogForm', () => {
  it('requires at least one health field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogForm date={TEST_DATE} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: '記録する' }))
    expect(
      screen.getByText('体重・睡眠・運動・体調のいずれかを入力してください。'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits parsed numeric values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogForm date={TEST_DATE} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/体重/), '70')
    await user.type(screen.getByLabelText(/睡眠/), '7.5')
    await user.type(screen.getByLabelText(/運動/), '30')
    await user.click(screen.getByRole('button', { name: '記録する' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      date: TEST_DATE,
      weightKg: 70,
      sleepHours: 7.5,
      exerciseMinutes: 30,
      condition: null,
      memo: '',
    })
  })

  it('rejects out-of-range weight', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogForm date={TEST_DATE} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/体重/), '10')
    await user.click(screen.getByRole('button', { name: '記録する' }))

    expect(screen.getByText('20〜300kgの範囲で入力してください。')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('selects and clears a condition', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogForm date={TEST_DATE} onSubmit={onSubmit} />)

    const condition = screen.getByRole('button', { name: /4\s*良い/ })
    await user.click(condition)
    expect(condition).toHaveAttribute('aria-pressed', 'true')
    await user.click(condition)
    expect(condition).toHaveAttribute('aria-pressed', 'false')
  })
})
