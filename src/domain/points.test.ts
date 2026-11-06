import { describe, expect, it } from 'vitest'
import { makeData, makeLog, TEST_DATE } from '../test/fixtures'
import {
  addPoint,
  awardStreakMilestones,
  hasPoint,
  levelInfo,
  pointsOnDate,
  totalPoints,
} from './points'
import { streakLength } from './streak'

describe('points', () => {
  it('sums points and filters by date', () => {
    const points = [
      {
        id: 'a',
        key: 'log:1',
        date: '2026-11-04',
        amount: 10,
        source: 'log' as const,
        label: '',
        createdAt: '',
      },
      {
        id: 'b',
        key: 'log:2',
        date: '2026-11-05',
        amount: 15,
        source: 'log' as const,
        label: '',
        createdAt: '',
      },
    ]
    expect(totalPoints(points)).toBe(25)
    expect(pointsOnDate(points, '2026-11-05')).toBe(15)
  })

  it('computes level thresholds and progress', () => {
    expect(levelInfo(0).current.name).toBe('入門')
    expect(levelInfo(99).current.name).toBe('入門')
    expect(levelInfo(100).current.name).toBe('初段')
    expect(levelInfo(249).current.name).toBe('初段')
    expect(levelInfo(250).current.name).toBe('二段')
    expect(levelInfo(1000).current.name).toBe('五段')
    expect(levelInfo(175).progress).toBeCloseTo(0.5)
    expect(levelInfo(1000).next).toBeNull()
  })

  it('does not add the same key twice', () => {
    const first = addPoint([], {
      key: 'log:2026-11-05',
      date: '2026-11-05',
      amount: 10,
      source: 'log',
      label: '日次記録',
      createdAt: '',
    })
    const second = addPoint(first.points, {
      key: 'log:2026-11-05',
      date: '2026-11-05',
      amount: 10,
      source: 'log',
      label: '日次記録',
      createdAt: '',
    })
    expect(first.added).toBe(true)
    expect(second.added).toBe(false)
    expect(second.points).toHaveLength(1)
    expect(hasPoint(second.points, 'log:2026-11-05')).toBe(true)
  })

  it('awards streak milestones once', () => {
    const first = awardStreakMilestones([], 14, TEST_DATE, '')
    expect(first.added).toEqual([3, 7, 14])
    expect(first.points.map((point) => point.amount)).toEqual([15, 30, 50])
    const second = awardStreakMilestones(first.points, 20, TEST_DATE, '')
    expect(second.added).toEqual([])
    expect(second.points).toHaveLength(3)
  })
})

describe('streak', () => {
  it('counts consecutive logs ending today', () => {
    const logs = {
      '2026-11-03': makeLog('2026-11-03'),
      '2026-11-04': makeLog('2026-11-04'),
      '2026-11-05': makeLog('2026-11-05'),
    }
    expect(streakLength(logs, '2026-11-05')).toBe(3)
  })

  it('keeps yesterday streak before today is logged', () => {
    const logs = {
      '2026-11-03': makeLog('2026-11-03'),
      '2026-11-04': makeLog('2026-11-04'),
    }
    expect(streakLength(logs, '2026-11-05')).toBe(2)
  })

  it('stops at a gap', () => {
    const logs = {
      '2026-11-02': makeLog('2026-11-02'),
      '2026-11-04': makeLog('2026-11-04'),
      '2026-11-05': makeLog('2026-11-05'),
    }
    expect(streakLength(logs, '2026-11-05')).toBe(2)
  })

  it('returns zero with no logs', () => {
    expect(streakLength(makeData().logs, '2026-11-05')).toBe(0)
  })
})
