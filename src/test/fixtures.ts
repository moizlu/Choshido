import type { AppData, DailyLog, PointEntry, WalkRecord } from '../domain/types'

export const TEST_DATE = '2026-11-05'

export function makeLog(date: string, overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    date,
    weightKg: 68,
    sleepHours: 7,
    exerciseMinutes: 20,
    condition: 3,
    memo: '',
    updatedAt: `${date}T12:00:00.000Z`,
    ...overrides,
  }
}

export function makePoint(
  key: string,
  date: string,
  amount = 10,
  overrides: Partial<PointEntry> = {},
): PointEntry {
  return {
    id: `point-${key}`,
    key,
    date,
    amount,
    source: 'log',
    label: 'テスト',
    createdAt: `${date}T12:00:00.000Z`,
    ...overrides,
  }
}

export function makeWalk(date: string, overrides: Partial<WalkRecord> = {}): WalkRecord {
  return {
    id: `walk-${date}`,
    date,
    destinationId: 'B',
    avoidHazard: true,
    hazardCellsCrossed: 0,
    cells: 20,
    distanceM: 600,
    steps: 800,
    points: 50,
    createdAt: `${date}T17:00:00.000Z`,
    ...overrides,
  }
}

export function makeData(overrides: Partial<AppData> = {}): AppData {
  return {
    schemaVersion: 1,
    onboardingDone: true,
    profile: {
      heightCm: 170,
      birthYear: 1990,
      sex: 'male',
      activity: 'normal',
    },
    logs: {},
    points: [],
    walks: [],
    checklist: {},
    ...overrides,
  }
}
