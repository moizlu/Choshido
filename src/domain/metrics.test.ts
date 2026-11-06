import { describe, expect, it } from 'vitest'
import { addDays, formatDateJa, lastNDates, localDateKey } from '../domain/date'
import { makeData, makeLog, TEST_DATE } from '../test/fixtures'
import {
  ageFromBirthYear,
  bmiCategory,
  calcBmi,
  calcBmr,
  latestWeightUpTo,
  metricsFor,
  round1,
} from './metrics'

describe('metrics', () => {
  it('calculates BMI', () => {
    expect(round1(calcBmi(70, 170))).toBe(24.2)
  })

  it('classifies BMI boundaries', () => {
    expect(bmiCategory(18.4).label).toBe('低体重')
    expect(bmiCategory(18.5).label).toBe('普通')
    expect(bmiCategory(24.9).label).toBe('普通')
    expect(bmiCategory(25).label).toBe('肥満1')
    expect(bmiCategory(30).label).toBe('肥満2')
    expect(bmiCategory(35).label).toBe('肥満3')
  })

  it('calculates BMR by sex and returns null when unspecified', () => {
    expect(calcBmr({ weightKg: 70, heightCm: 170, age: 36, sex: 'male' })).toBeCloseTo(1587.5)
    expect(calcBmr({ weightKg: 70, heightCm: 170, age: 36, sex: 'female' })).toBeCloseTo(1421.5)
    expect(calcBmr({ weightKg: 70, heightCm: 170, age: 36, sex: 'unspecified' })).toBeNull()
  })

  it('uses the latest weight on or before the active date', () => {
    const logs = {
      '2026-11-01': makeLog('2026-11-01', { weightKg: 70 }),
      '2026-11-04': makeLog('2026-11-04', { weightKg: 68 }),
      '2026-11-06': makeLog('2026-11-06', { weightKg: 66 }),
    }
    expect(latestWeightUpTo(logs, '2026-11-05')?.weightKg).toBe(68)
    expect(latestWeightUpTo(logs, '2026-10-31')).toBeNull()
  })

  it('builds the dashboard metrics', () => {
    const data = makeData({
      logs: {
        [TEST_DATE]: makeLog(TEST_DATE, { weightKg: 70 }),
      },
    })
    const metrics = metricsFor(data, TEST_DATE)
    expect(metrics.latestWeight).toBe(70)
    expect(metrics.bmi).toBe(24.2)
    expect(metrics.bmr).toBe(1590)
    expect(metrics.standardWeight).toBe(63.6)
    expect(metrics.age).toBe(36)
  })
})

describe('date helpers', () => {
  it('keeps local date keys stable across day arithmetic', () => {
    expect(addDays('2026-11-05', 1)).toBe('2026-11-06')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(lastNDates('2026-11-05', 3)).toEqual(['2026-11-03', '2026-11-04', '2026-11-05'])
  })

  it('formats Japanese dates', () => {
    expect(formatDateJa('2026-11-05')).toBe('2026.11.05 木')
    expect(localDateKey(new Date(2026, 10, 5, 12, 0, 0))).toBe('2026-11-05')
  })

  it('derives age from birth year', () => {
    expect(ageFromBirthYear(1990, '2026-11-05')).toBe(36)
    expect(ageFromBirthYear(null, '2026-11-05')).toBeNull()
  })
})
