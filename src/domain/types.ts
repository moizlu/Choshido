export type Sex = 'male' | 'female' | 'unspecified'
export type Activity = 'low' | 'normal' | 'high'
export type Condition = 1 | 2 | 3 | 4 | 5
export type Mode = 'real' | 'sim'
export type ShelterId = 'A' | 'B' | 'C'
export type PointSource = 'log' | 'walk' | 'checklist' | 'streak'

export interface Profile {
  heightCm: number | null
  birthYear: number | null
  sex: Sex
  activity: Activity
}

export interface DailyLog {
  date: string
  weightKg: number | null
  sleepHours: number | null
  exerciseMinutes: number | null
  condition: Condition | null
  memo: string
  updatedAt: string
}

export interface PointEntry {
  id: string
  key: string
  date: string
  amount: number
  source: PointSource
  label: string
  createdAt: string
}

export interface WalkRecord {
  id: string
  date: string
  destinationId: ShelterId
  avoidHazard: boolean
  hazardCellsCrossed: number
  cells: number
  distanceM: number
  steps: number
  points: number
  createdAt: string
}

export interface AppData {
  schemaVersion: 1
  onboardingDone: boolean
  profile: Profile
  logs: Record<string, DailyLog>
  points: PointEntry[]
  walks: WalkRecord[]
  checklist: Record<string, string | null>
}

export interface SimData extends AppData {
  seed: number
  currentDate: string
  startDate: string
  autoWalk: boolean
}

export interface LogInput {
  date: string
  weightKg: number | null
  sleepHours: number | null
  exerciseMinutes: number | null
  condition: Condition | null
  memo: string
}

export interface WalkInput {
  date: string
  destinationId: ShelterId
  avoidHazard: boolean
  hazardCellsCrossed: number
  cells: number
  distanceM: number
  steps: number
}

export interface ChecklistItemDef {
  id: string
  label: string
}
