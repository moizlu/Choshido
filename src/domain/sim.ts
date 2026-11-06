import { completeChecklistInData, recordWalkInData, saveLogToData } from '../app/apply'
import { addDays, dayNumber, daysBetween, localDateKey } from './date'
import { SIM_PROFILE } from './factory'
import { round1 } from './metrics'
import type { AppData, Condition, LogInput, SimData } from './types'
import { findPath, walkMetrics } from '../features/map/pathfinding'
import { SHELTERS, shelterById } from '../features/map/mapData'

export const DEFAULT_SIM_SEED = 20261105

export function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

const EXERCISE_PATTERN = [20, 30, 15, 45, 0, 0, 0] as const
const SLEEP_PATTERN = [7.0, 6.5, 5.5, 5.0, 6.0, 5.0, 5.5] as const
const CONDITION_PATTERN: readonly Condition[] = [4, 4, 3, 3, 3, 2, 2]
const MEMO_PATTERN = ['', 'よく眠れた', '少しだるい', '散歩をした', ''] as const

export function generateLogInput(
  date: string,
  offset: number,
  seed: number,
  profile = SIM_PROFILE,
): LogInput {
  const rng = mulberry32((seed ^ (dayNumber(date) * 2_654_435_761)) >>> 0)
  const index = ((offset % 7) + 7) % 7
  const baseWeight = profile.heightCm === 170 ? 68.2 : 65.0
  const weight = round1(baseWeight - 0.06 * offset + (rng() - 0.5) * 0.3)
  const sleep = round1((SLEEP_PATTERN[index] ?? 6.5) + (rng() - 0.5) * 0.3)
  const exercise = EXERCISE_PATTERN[index] ?? 0
  const condition = CONDITION_PATTERN[index] ?? 3
  const memo = MEMO_PATTERN[Math.floor(rng() * MEMO_PATTERN.length)] ?? ''

  return {
    date,
    weightKg: weight,
    sleepHours: Math.min(9.5, Math.max(4.5, sleep)),
    exerciseMinutes: exercise,
    condition,
    memo,
  }
}

export function generateSim(today = localDateKey(), seed = DEFAULT_SIM_SEED): SimData {
  const startDate = addDays(today, -13)
  let data: AppData = {
    schemaVersion: 1,
    onboardingDone: true,
    profile: { ...SIM_PROFILE },
    logs: {},
    points: [],
    walks: [],
    checklist: {},
  }

  for (let offset = 0; offset < 14; offset += 1) {
    const date = addDays(startDate, offset)
    const createdAt = `${date}T12:00:00.000Z`
    data = saveLogToData(data, generateLogInput(date, offset, seed), date, createdAt).data
  }

  const walkDays: { offset: number; destination: 'A' | 'B' }[] = [
    { offset: 4, destination: 'B' },
    { offset: 9, destination: 'A' },
  ]

  for (const item of walkDays) {
    const date = addDays(startDate, item.offset)
    const createdAt = `${date}T17:00:00.000Z`
    const shelter = shelterById(item.destination)
    const path = findPath(shelter.point, true)
    if (!path) continue
    const metrics = walkMetrics(path)
    data = recordWalkInData(
      data,
      {
        date,
        destinationId: item.destination,
        avoidHazard: true,
        hazardCellsCrossed: metrics.hazardCells,
        cells: metrics.cells,
        distanceM: metrics.distanceM,
        steps: metrics.steps,
      },
      createdAt,
    ).data
  }

  const checklistAt = `${today}T08:30:00.000Z`
  data = completeChecklistInData(data, 'route', today, checklistAt).data
  data = completeChecklistInData(data, 'water', today, checklistAt).data

  return {
    ...data,
    seed,
    currentDate: today,
    startDate,
    autoWalk: true,
  }
}

export function advanceSimDay(sim: SimData): SimData {
  const nextDate = addDays(sim.currentDate, 1)
  const offset = daysBetween(sim.startDate, nextDate)
  const createdAt = `${nextDate}T12:00:00.000Z`
  const input = generateLogInput(nextDate, offset, sim.seed, sim.profile)
  let data: AppData = saveLogToData(sim, input, nextDate, createdAt).data

  if (sim.autoWalk) {
    const shelter = SHELTERS[offset % SHELTERS.length]
    if (shelter) {
      const path = findPath(shelter.point, true)
      if (path) {
        const metrics = walkMetrics(path)
        data = recordWalkInData(
          data,
          {
            date: nextDate,
            destinationId: shelter.id,
            avoidHazard: true,
            hazardCellsCrossed: metrics.hazardCells,
            cells: metrics.cells,
            distanceM: metrics.distanceM,
            steps: metrics.steps,
          },
          `${nextDate}T17:00:00.000Z`,
        ).data
      }
    }
  }

  return {
    ...data,
    seed: sim.seed,
    currentDate: nextDate,
    startDate: sim.startDate,
    autoWalk: sim.autoWalk,
  }
}

export function resetSim(seed = DEFAULT_SIM_SEED, today = localDateKey()): SimData {
  return generateSim(today, seed)
}

export function newSimSeed(): number {
  return Math.floor(Math.random() * 900_000_000) + 100_000_000
}
