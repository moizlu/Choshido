import { beforeEach, describe, expect, it } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoreProvider } from './store'
import { useStore } from './storeContext'
import { encodeExport } from './schema'
import { totalPoints } from '../domain/points'
import { makeData, makeLog, makePoint, TEST_DATE } from '../test/fixtures'

const importedState = makeData({
  points: [makePoint('imported', TEST_DATE, 20)],
})

function Probe() {
  const store = useStore()
  const [message, setMessage] = useState('')
  return (
    <div>
      <span data-testid="mode">{store.mode}</span>
      <span data-testid="real-total">{totalPoints(store.real.points)}</span>
      <span data-testid="active-total">{store.total}</span>
      <span data-testid="import-message">{message}</span>
      <button type="button" onClick={() => store.startSim()}>
        start
      </button>
      <button type="button" onClick={() => store.advanceSimDay()}>
        advance
      </button>
      <button type="button" onClick={() => store.endSim()}>
        end
      </button>
      <button
        type="button"
        onClick={() =>
          setMessage(
            store.importActive(
              JSON.stringify(encodeExport('real', importedState, '2026-11-05T13:00:00.000Z')),
            ).message,
          )
        }
      >
        import
      </button>
      <button type="button" onClick={() => setMessage(store.importActive('{').message)}>
        bad import
      </button>
    </div>
  )
}

describe('store simulation isolation', () => {
  beforeEach(() => {
    window.localStorage.clear()
    const real = makeData({
      logs: { [TEST_DATE]: makeLog(TEST_DATE) },
      points: [makePoint(`log:${TEST_DATE}`, TEST_DATE, 10)],
    })
    window.localStorage.setItem('choshido:v1:real', JSON.stringify(real))
  })

  it('keeps real data unchanged while simulating', async () => {
    const user = userEvent.setup()
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('real')
    expect(screen.getByTestId('real-total')).toHaveTextContent('10')
    expect(screen.getByTestId('active-total')).toHaveTextContent('10')

    await user.click(screen.getByRole('button', { name: 'start' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('sim')
    expect(screen.getByTestId('real-total')).toHaveTextContent('10')
    const simTotal = Number(screen.getByTestId('active-total').textContent)
    expect(simTotal).toBeGreaterThan(10)

    await user.click(screen.getByRole('button', { name: 'advance' }))
    expect(Number(screen.getByTestId('active-total').textContent)).toBeGreaterThan(simTotal)
    expect(screen.getByTestId('real-total')).toHaveTextContent('10')

    await user.click(screen.getByRole('button', { name: 'end' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('real')
    expect(screen.getByTestId('real-total')).toHaveTextContent('10')
  })

  it('imports valid data and rejects broken data without touching the store', async () => {
    const user = userEvent.setup()
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'import' }))
    expect(screen.getByTestId('real-total')).toHaveTextContent('20')
    expect(screen.getByTestId('import-message')).toHaveTextContent('通常データを読み込みました')

    await user.click(screen.getByRole('button', { name: 'bad import' }))
    expect(screen.getByTestId('real-total')).toHaveTextContent('20')
    expect(screen.getByTestId('import-message')).toHaveTextContent('読み込めませんでした')
  })
})
