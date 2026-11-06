import { createContext, useContext } from 'react'
import type { LevelInfo } from '../domain/points'
import type { MetricsSummary } from '../domain/metrics'
import type { AppData, LogInput, Profile, WalkInput } from '../domain/types'
import type { StoreSnapshot } from './selectors'

export interface StoreValue extends StoreSnapshot {
  data: AppData
  date: string
  metrics: MetricsSummary
  streak: number
  total: number
  level: LevelInfo
  todayPoints: number
  storageError: string | null
  loadWarning: string | null
  saveLog: (input: LogInput) => { awarded: boolean; milestones: number[] }
  deleteLog: (date: string) => void
  recordWalk: (input: WalkInput) => number
  completeChecklistItem: (id: string) => boolean
  updateProfile: (profile: Profile) => void
  completeOnboarding: (profile: Profile | null) => void
  startSim: (seed?: number) => void
  endSim: () => void
  resetSim: () => void
  shuffleSim: () => void
  advanceSimDay: () => string | null
  setAutoWalk: (value: boolean) => void
  exportActive: () => void
  importActive: (text: string) => { ok: boolean; message: string }
  clearActive: () => void
  dismissWarning: () => void
}

export const StoreContext = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
