import { describe, expect, it } from 'vitest'
import { encodeExport, parseExport } from './schema'
import { makeData, makeLog, makePoint, makeWalk, TEST_DATE } from '../test/fixtures'
import type { SimData } from '../domain/types'

const state = makeData({
  logs: { [TEST_DATE]: makeLog(TEST_DATE) },
  points: [makePoint(`log:${TEST_DATE}`, TEST_DATE, 10)],
  walks: [makeWalk(TEST_DATE)],
  checklist: { route: `${TEST_DATE}T08:00:00.000Z` },
})

describe('export schema', () => {
  it('round-trips real data', () => {
    const text = JSON.stringify(encodeExport('real', state, '2026-11-05T13:00:00.000Z'))
    const result = parseExport(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.mode).toBe('real')
    expect(result.state).toEqual(state)
  })

  it('round-trips simulation data', () => {
    const sim: SimData = {
      ...state,
      seed: 123,
      currentDate: TEST_DATE,
      startDate: '2026-10-23',
      autoWalk: true,
    }
    const text = JSON.stringify(encodeExport('sim', sim, '2026-11-05T13:00:00.000Z'))
    const result = parseExport(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.mode).toBe('sim')
    expect(result.state).toEqual(sim)
  })

  it('rejects invalid JSON', () => {
    const result = parseExport('{')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('JSON')
  })

  it('rejects a different app or schema version', () => {
    const wrongApp = JSON.stringify({
      app: 'other',
      schemaVersion: 1,
      mode: 'real',
      exportedAt: '',
      state,
    })
    expect(parseExport(wrongApp).ok).toBe(false)

    const wrongVersion = JSON.stringify({
      app: 'choshido',
      schemaVersion: 2,
      mode: 'real',
      exportedAt: '',
      state,
    })
    expect(parseExport(wrongVersion).ok).toBe(false)
  })

  it('rejects a broken state without touching anything', () => {
    const broken = JSON.stringify({
      app: 'choshido',
      schemaVersion: 1,
      mode: 'real',
      exportedAt: '',
      state: { ...state, profile: null },
    })
    const result = parseExport(broken)
    expect(result.ok).toBe(false)
  })

  it('rejects out-of-range values and malformed date keys', () => {
    const outOfRange = {
      ...state,
      logs: { [TEST_DATE]: makeLog(TEST_DATE, { weightKg: 500 }) },
    }
    expect(
      parseExport(JSON.stringify(encodeExport('real', outOfRange, '2026-11-05T13:00:00.000Z'))).ok,
    ).toBe(false)

    const badDate = {
      ...state,
      logs: { '11/05': makeLog('11/05') },
    }
    expect(
      parseExport(JSON.stringify(encodeExport('real', badDate, '2026-11-05T13:00:00.000Z'))).ok,
    ).toBe(false)
  })
})
