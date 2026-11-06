import { addDays } from './date'
import type { AppData } from './types'

export function streakLength(logs: AppData['logs'], dateKey: string): number {
  let cursor = dateKey
  if (!logs[cursor]) cursor = addDays(cursor, -1)

  let length = 0
  while (logs[cursor]) {
    length += 1
    cursor = addDays(cursor, -1)
  }
  return length
}

export function loggedDayCount(logs: AppData['logs'], upTo: string): number {
  return Object.keys(logs).filter((date) => date <= upTo).length
}
