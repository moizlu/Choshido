import { describe, expect, it } from 'vitest'
import { buildAdvice } from './advice'
import { addDays } from './date'
import { makeData, makeLog, makeWalk, TEST_DATE } from '../test/fixtures'

const NOON = new Date(2026, 10, 5, 12, 0, 0)
const EVENING = new Date(2026, 10, 5, 21, 0, 0)

function recentWalk(date = TEST_DATE) {
  return makeWalk(date)
}

describe('advice', () => {
  it('returns the three highest-priority rules in order', () => {
    const logs = {
      [addDays(TEST_DATE, -2)]: makeLog(addDays(TEST_DATE, -2), {
        sleepHours: 6.5,
        exerciseMinutes: 0,
        condition: 4,
      }),
      [addDays(TEST_DATE, -1)]: makeLog(addDays(TEST_DATE, -1), {
        sleepHours: 5,
        exerciseMinutes: 0,
        condition: 2,
      }),
      [TEST_DATE]: makeLog(TEST_DATE, {
        sleepHours: 5.5,
        exerciseMinutes: 0,
        condition: 2,
      }),
    }
    const advice = buildAdvice(makeData({ logs, walks: [recentWalk()] }), TEST_DATE, NOON)
    expect(advice).toHaveLength(3)
    expect(advice.map((item) => item.id)).toEqual(['condition', 'sleep', 'exercise'])
  })

  it('detects a one-kilogram weekly weight change', () => {
    const logs = {
      [addDays(TEST_DATE, -6)]: makeLog(addDays(TEST_DATE, -6), { weightKg: 70 }),
      [addDays(TEST_DATE, -3)]: makeLog(addDays(TEST_DATE, -3), { weightKg: 69 }),
      [TEST_DATE]: makeLog(TEST_DATE, { weightKg: 68.5 }),
    }
    const advice = buildAdvice(makeData({ logs, walks: [recentWalk()] }), TEST_DATE, NOON)
    expect(advice.map((item) => item.id)).toContain('weight')
  })

  it('suggests a BMI review above 25', () => {
    const logs = {
      [addDays(TEST_DATE, -1)]: makeLog(addDays(TEST_DATE, -1), { weightKg: 80 }),
      [TEST_DATE]: makeLog(TEST_DATE, { weightKg: 80 }),
    }
    const advice = buildAdvice(makeData({ logs, walks: [recentWalk()] }), TEST_DATE, NOON)
    expect(advice.map((item) => item.id)).toContain('bmi')
  })

  it('reminds the user to log after 20:00', () => {
    const logs = {
      [addDays(TEST_DATE, -1)]: makeLog(addDays(TEST_DATE, -1)),
      [addDays(TEST_DATE, -2)]: makeLog(addDays(TEST_DATE, -2)),
    }
    const advice = buildAdvice(makeData({ logs, walks: [recentWalk()] }), TEST_DATE, EVENING)
    expect(advice[0]?.id).toBe('no-log')
  })

  it('reminds the user to train when no walk exists in 14 days', () => {
    const logs = {
      [addDays(TEST_DATE, -2)]: makeLog(addDays(TEST_DATE, -2)),
      [addDays(TEST_DATE, -1)]: makeLog(addDays(TEST_DATE, -1)),
      [TEST_DATE]: makeLog(TEST_DATE),
    }
    const advice = buildAdvice(makeData({ logs }), TEST_DATE, NOON)
    expect(advice.map((item) => item.id)).toContain('training')
  })

  it('adds a data-insufficient note for new users', () => {
    const logs = { [TEST_DATE]: makeLog(TEST_DATE) }
    const advice = buildAdvice(makeData({ logs, walks: [recentWalk()] }), TEST_DATE, NOON)
    expect(advice.map((item) => item.id)).toContain('insufficient')
  })

  it('falls back to a steady message when nothing is wrong', () => {
    const logs = {
      [addDays(TEST_DATE, -2)]: makeLog(addDays(TEST_DATE, -2), {
        sleepHours: 7.5,
        exerciseMinutes: 30,
        condition: 4,
        weightKg: 68,
      }),
      [addDays(TEST_DATE, -1)]: makeLog(addDays(TEST_DATE, -1), {
        sleepHours: 7,
        exerciseMinutes: 30,
        condition: 4,
        weightKg: 68,
      }),
      [TEST_DATE]: makeLog(TEST_DATE, {
        sleepHours: 7,
        exerciseMinutes: 30,
        condition: 4,
        weightKg: 68,
      }),
    }
    const advice = buildAdvice(makeData({ logs, walks: [recentWalk()] }), TEST_DATE, NOON)
    expect(advice).toHaveLength(1)
    expect(advice[0]?.id).toBe('steady')
  })
})
