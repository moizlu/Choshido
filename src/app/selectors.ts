import { CHECKLIST_ITEMS } from '../domain/checklist'
import { localDateKey } from '../domain/date'
import { metricsFor, type MetricsSummary } from '../domain/metrics'
import { levelInfo, pointsOnDate, totalPoints, type LevelInfo } from '../domain/points'
import { streakLength } from '../domain/streak'
import type { AppData, Mode, SimData, WalkRecord } from '../domain/types'

export interface StoreSnapshot {
  mode: Mode
  real: AppData
  sim: SimData | null
}

export function activeData(snapshot: StoreSnapshot): AppData {
  return snapshot.mode === 'sim' && snapshot.sim ? snapshot.sim : snapshot.real
}

export function activeDate(snapshot: StoreSnapshot): string {
  return snapshot.mode === 'sim' && snapshot.sim ? snapshot.sim.currentDate : localDateKey()
}

export function activeMetrics(snapshot: StoreSnapshot): MetricsSummary {
  return metricsFor(activeData(snapshot), activeDate(snapshot))
}

export function activeStreak(snapshot: StoreSnapshot): number {
  return streakLength(activeData(snapshot).logs, activeDate(snapshot))
}

export function activeTotalPoints(snapshot: StoreSnapshot): number {
  return totalPoints(activeData(snapshot).points)
}

export function activeLevel(snapshot: StoreSnapshot): LevelInfo {
  return levelInfo(activeTotalPoints(snapshot))
}

export function activeTodayPoints(snapshot: StoreSnapshot): number {
  return pointsOnDate(activeData(snapshot).points, activeDate(snapshot))
}

export function walkOnDate(data: AppData, date: string): WalkRecord | undefined {
  return data.walks.find((walk) => walk.date === date)
}

export interface ChecklistProgress {
  done: number
  total: number
  complete: boolean
}

export function checklistProgress(data: AppData): ChecklistProgress {
  const done = CHECKLIST_ITEMS.filter((item) => Boolean(data.checklist[item.id])).length
  return { done, total: CHECKLIST_ITEMS.length, complete: done === CHECKLIST_ITEMS.length }
}

export interface Badge {
  id: string
  label: string
  hint: string
  earned: boolean
}

export function badgesFor(data: AppData, date: string): Badge[] {
  const streak = streakLength(data.logs, date)
  const checklist = checklistProgress(data)
  return [
    {
      id: 'first-walk',
      label: '初散歩',
      hint: '防災さんぽを1回完了',
      earned: data.walks.length > 0,
    },
    {
      id: 'safe-walk',
      label: '避難路',
      hint: '危険区域を通らずに到着',
      earned: data.walks.some((walk) => walk.hazardCellsCrossed === 0),
    },
    {
      id: 'streak-7',
      label: '七継続',
      hint: '7日連続で記録',
      earned: streak >= 7,
    },
    {
      id: 'prepared',
      label: '備え完了',
      hint: '備えチェックを5項目完了',
      earned: checklist.complete,
    },
  ]
}
