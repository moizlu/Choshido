import { describe, expect, it } from 'vitest'
import { buildAdvice } from './advice'
import { addDays, lastNDates } from './date'
import { streakLength } from './streak'
import { advanceSimDay, generateLogInput, generateSim } from './sim'
import { totalPoints } from './points'
import { TEST_DATE } from '../test/fixtures'

function normalizePoints(sim: ReturnType<typeof generateSim>) {
  return sim.points.map((point) => ({
    key: point.key,
    date: point.date,
    amount: point.amount,
    source: point.source,
  }))
}

function normalizeWalks(sim: ReturnType<typeof generateSim>) {
  return sim.walks.map((walk) => ({
    date: walk.date,
    destinationId: walk.destinationId,
    hazards: walk.hazardCellsCrossed,
    points: walk.points,
    cells: walk.cells,
  }))
}

describe('simulation', () => {
  it('generates a deterministic 14-day history', () => {
    const sim = generateSim(TEST_DATE, 20261105)
    expect(sim.currentDate).toBe(TEST_DATE)
    expect(sim.startDate).toBe(addDays(TEST_DATE, -13))
    expect(sim.seed).toBe(20261105)
    expect(sim.autoWalk).toBe(true)
    expect(Object.keys(sim.logs)).toHaveLength(14)
    expect(Object.keys(sim.logs).sort()).toEqual(lastNDates(TEST_DATE, 14))
    expect(streakLength(sim.logs, TEST_DATE)).toBe(14)
    expect(totalPoints(sim.points)).toBeGreaterThan(300)

    const again = generateSim(TEST_DATE, 20261105)
    expect(again.logs).toEqual(sim.logs)
    expect(normalizePoints(again)).toEqual(normalizePoints(sim))
    expect(normalizeWalks(again)).toEqual(normalizeWalks(sim))
  })

  it('starts with health advice for the demo', () => {
    const sim = generateSim(TEST_DATE, 20261105)
    const advice = buildAdvice(sim, TEST_DATE, new Date(2026, 10, 5, 12, 0, 0))
    expect(advice.map((item) => item.id)).toEqual(['condition', 'sleep', 'exercise'])
  })

  it('generates the same log for the same date and seed', () => {
    const first = generateLogInput(TEST_DATE, 13, 20261105)
    const second = generateLogInput(TEST_DATE, 13, 20261105)
    expect(first).toEqual(second)
  })

  it('advances one day and adds a log without mutating the previous state', () => {
    const sim = generateSim(TEST_DATE, 20261105)
    const originalLogs = Object.keys(sim.logs).length
    const originalPoints = totalPoints(sim.points)
    const originalWalks = sim.walks.length

    const next = advanceSimDay(sim)
    expect(next.currentDate).toBe(addDays(TEST_DATE, 1))
    expect(next.logs[next.currentDate]).toBeDefined()
    expect(Object.keys(next.logs)).toHaveLength(originalLogs + 1)
    expect(totalPoints(next.points)).toBeGreaterThan(originalPoints)
    expect(next.walks.length).toBe(originalWalks + 1)

    expect(Object.keys(sim.logs)).toHaveLength(originalLogs)
    expect(totalPoints(sim.points)).toBe(originalPoints)
    expect(sim.walks).toHaveLength(originalWalks)
  })
})
