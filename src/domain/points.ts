import { newId } from './id'
import type { PointEntry, PointSource } from './types'

export interface LevelStep {
  min: number
  name: string
}

export interface LevelInfo {
  total: number
  current: LevelStep
  next: LevelStep | null
  progress: number
  toNext: number
}

export const LEVELS: readonly LevelStep[] = [
  { min: 0, name: '入門' },
  { min: 100, name: '初段' },
  { min: 250, name: '二段' },
  { min: 450, name: '三段' },
  { min: 700, name: '四段' },
  { min: 1000, name: '五段' },
]

export const STREAK_MILESTONES: readonly { days: number; amount: number }[] = [
  { days: 3, amount: 15 },
  { days: 7, amount: 30 },
  { days: 14, amount: 50 },
  { days: 30, amount: 100 },
]

export function totalPoints(points: PointEntry[]): number {
  return points.reduce((sum, entry) => sum + entry.amount, 0)
}

export function pointsOnDate(points: PointEntry[], date: string): number {
  return points.reduce((sum, entry) => (entry.date === date ? sum + entry.amount : sum), 0)
}

export function levelInfo(total: number): LevelInfo {
  let currentIndex = 0
  for (let index = 0; index < LEVELS.length; index += 1) {
    const level = LEVELS[index]
    if (level && total >= level.min) currentIndex = index
  }
  const current = LEVELS[currentIndex] ?? LEVELS[0]
  const next = LEVELS[currentIndex + 1] ?? null
  const span = next ? next.min - current.min : 0
  const progress = next ? Math.min(1, Math.max(0, (total - current.min) / span)) : 1
  return {
    total,
    current,
    next,
    progress,
    toNext: next ? Math.max(0, next.min - total) : 0,
  }
}

export function hasPoint(points: PointEntry[], key: string): boolean {
  return points.some((entry) => entry.key === key)
}

export function makePoint(input: {
  key: string
  date: string
  amount: number
  source: PointSource
  label: string
  createdAt: string
}): PointEntry {
  return {
    id: newId(),
    ...input,
  }
}

export function addPoint(
  points: PointEntry[],
  input: {
    key: string
    date: string
    amount: number
    source: PointSource
    label: string
    createdAt: string
  },
): { points: PointEntry[]; added: boolean } {
  if (hasPoint(points, input.key)) return { points, added: false }
  return { points: [...points, makePoint(input)], added: true }
}

export function awardStreakMilestones(
  points: PointEntry[],
  streak: number,
  date: string,
  createdAt: string,
): { points: PointEntry[]; added: number[] } {
  let next = points
  const added: number[] = []
  for (const milestone of STREAK_MILESTONES) {
    if (streak < milestone.days) continue
    const key = `streak:${milestone.days}`
    if (hasPoint(next, key)) continue
    next = [
      ...next,
      makePoint({
        key,
        date,
        amount: milestone.amount,
        source: 'streak',
        label: `連続記録 ${milestone.days}日`,
        createdAt,
      }),
    ]
    added.push(milestone.days)
  }
  return { points: next, added }
}
