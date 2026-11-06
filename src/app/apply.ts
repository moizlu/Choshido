import { CHECKLIST_POINTS } from '../domain/checklist'
import { addPoint, awardStreakMilestones, hasPoint, makePoint } from '../domain/points'
import { streakLength } from '../domain/streak'
import type { AppData, DailyLog, LogInput, Profile, WalkInput, WalkRecord } from '../domain/types'
import { newId } from '../domain/id'

export interface SaveLogResult {
  data: AppData
  awarded: boolean
  milestones: number[]
}

export function saveLogToData(
  data: AppData,
  input: LogInput,
  activeDate: string,
  createdAt: string,
): SaveLogResult {
  const log: DailyLog = {
    ...input,
    updatedAt: createdAt,
  }
  const logs = { ...data.logs, [input.date]: log }
  const logPoints = addPoint(data.points, {
    key: `log:${input.date}`,
    date: input.date,
    amount: 10,
    source: 'log',
    label: '日次記録',
    createdAt,
  })
  const streak = streakLength(logs, activeDate)
  const milestones = awardStreakMilestones(logPoints.points, streak, activeDate, createdAt)

  return {
    data: {
      ...data,
      logs,
      points: milestones.points,
    },
    awarded: logPoints.added,
    milestones: milestones.added,
  }
}

export function deleteLogFromData(data: AppData, date: string): AppData {
  const logs = { ...data.logs }
  delete logs[date]
  return { ...data, logs }
}

export function recordWalkInData(
  data: AppData,
  input: WalkInput,
  createdAt: string,
): { data: AppData; awarded: number } {
  const key = `walk:${input.date}:${input.destinationId}`
  const points = hasPoint(data.points, key) ? 0 : 30 + (input.hazardCellsCrossed === 0 ? 20 : 0)

  const record: WalkRecord = {
    id: newId(),
    ...input,
    points,
    createdAt,
  }

  let pointsList = data.points
  if (points > 0) {
    pointsList = [
      ...pointsList,
      makePoint({
        key,
        date: input.date,
        amount: points,
        source: 'walk',
        label: `散歩 ${input.destinationId}`,
        createdAt,
      }),
    ]
  }

  return {
    data: {
      ...data,
      walks: [...data.walks, record],
      points: pointsList,
    },
    awarded: points,
  }
}

export function completeChecklistInData(
  data: AppData,
  itemId: string,
  date: string,
  createdAt: string,
): { data: AppData; awarded: boolean } {
  if (data.checklist[itemId]) return { data, awarded: false }

  const checklist = { ...data.checklist, [itemId]: createdAt }
  const points = addPoint(data.points, {
    key: `checklist:${itemId}`,
    date,
    amount: CHECKLIST_POINTS,
    source: 'checklist',
    label: '防災の備え',
    createdAt,
  })

  return {
    data: { ...data, checklist, points: points.points },
    awarded: points.added,
  }
}

export function updateProfileInData(data: AppData, profile: Profile): AppData {
  return { ...data, profile }
}

export function completeOnboardingInData(data: AppData, profile: Profile | null): AppData {
  return {
    ...data,
    onboardingDone: true,
    profile: profile ? { ...profile } : { ...data.profile },
  }
}
