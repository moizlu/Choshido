import { describe, expect, it } from 'vitest'
import {
  HOME,
  MAP_HEIGHT,
  MAP_ROWS,
  MAP_WIDTH,
  SHELTERS,
  cellAt,
  isHazardAt,
  isWalkableAt,
  type GridPoint,
} from './mapData'
import { countHazardCells, findPath, walkMetrics } from './pathfinding'

function expectContinuous(path: GridPoint[]) {
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1]
    const current = path[index]
    expect(previous).toBeDefined()
    expect(current).toBeDefined()
    if (!previous || !current) continue
    const distance = Math.abs(previous.x - current.x) + Math.abs(previous.y - current.y)
    expect(distance).toBe(1)
  }
}

describe('map definition', () => {
  it('has fixed 16x12 rows', () => {
    expect(MAP_ROWS).toHaveLength(MAP_HEIGHT)
    for (const row of MAP_ROWS) expect(row).toHaveLength(MAP_WIDTH)
  })

  it('places home and shelters on walkable cells', () => {
    expect(isWalkableAt(HOME.x, HOME.y, true)).toBe(true)
    for (const shelter of SHELTERS) {
      expect(isWalkableAt(shelter.point.x, shelter.point.y, true)).toBe(true)
    }
  })

  it('marks the demo hazard cells', () => {
    expect(isHazardAt(5, 4)).toBe(true)
    expect(isHazardAt(12, 4)).toBe(true)
    expect(isHazardAt(14, 9)).toBe(true)
    expect(cellAt(0, 0)).toBe('~')
  })
})

describe('pathfinding', () => {
  it('reaches every shelter while avoiding hazards', () => {
    for (const shelter of SHELTERS) {
      const path = findPath(shelter.point, true)
      expect(path).not.toBeNull()
      if (!path) continue
      expect(path[0]).toEqual(HOME)
      expect(path[path.length - 1]).toEqual(shelter.point)
      expectContinuous(path)
      expect(countHazardCells(path)).toBe(0)
    }
  })

  it('takes a shorter or equal route through a hazard when avoidance is off', () => {
    const comparisons: { id: string; safe: number; direct: number }[] = []
    for (const shelter of SHELTERS) {
      const safe = findPath(shelter.point, true)
      const direct = findPath(shelter.point, false)
      expect(safe).not.toBeNull()
      expect(direct).not.toBeNull()
      if (!safe || !direct) continue
      expect(countHazardCells(direct)).toBeGreaterThan(0)
      expect(direct.length).toBeLessThanOrEqual(safe.length)
      expectContinuous(direct)
      comparisons.push({ id: shelter.id, safe: safe.length, direct: direct.length })
    }
    expect(comparisons.some((item) => item.direct < item.safe)).toBe(true)
  })

  it('returns a single point when start equals goal', () => {
    expect(findPath(HOME, true, HOME)).toEqual([HOME])
  })

  it('returns null for an unwalkable destination', () => {
    expect(findPath({ x: 0, y: 0 }, false)).toBeNull()
  })

  it('computes walk metrics', () => {
    const path = findPath(SHELTERS[1]?.point ?? HOME, true)
    expect(path).not.toBeNull()
    if (!path) return
    const metrics = walkMetrics(path)
    expect(metrics.cells).toBe(path.length)
    expect(metrics.distanceM).toBe(path.length * 30)
    expect(metrics.steps).toBe(path.length * 40)
    expect(metrics.hazardCells).toBe(0)
  })
})
