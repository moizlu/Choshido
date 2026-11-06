import { z } from 'zod'
import type { AppData, SimData } from '../domain/types'

const sexSchema = z.enum(['male', 'female', 'unspecified'])
const activitySchema = z.enum(['low', 'normal', 'high'])
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const conditionSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
const sourceSchema = z.enum(['log', 'walk', 'checklist', 'streak'])
const shelterSchema = z.enum(['A', 'B', 'C'])

const profileSchema = z.object({
  heightCm: z.number().min(100).max(250).nullable(),
  birthYear: z.number().int().min(1900).max(2100).nullable(),
  sex: sexSchema,
  activity: activitySchema,
})

const dailyLogSchema = z.object({
  date: dateKeySchema,
  weightKg: z.number().min(20).max(300).nullable(),
  sleepHours: z.number().min(0).max(24).nullable(),
  exerciseMinutes: z.number().min(0).max(600).nullable(),
  condition: conditionSchema.nullable(),
  memo: z.string().max(200),
  updatedAt: z.string(),
})

const pointSchema = z.object({
  id: z.string(),
  key: z.string(),
  date: dateKeySchema,
  amount: z.number().int().min(0).max(10000),
  source: sourceSchema,
  label: z.string(),
  createdAt: z.string(),
})

const walkSchema = z.object({
  id: z.string(),
  date: dateKeySchema,
  destinationId: shelterSchema,
  avoidHazard: z.boolean(),
  hazardCellsCrossed: z.number().int().min(0),
  cells: z.number().int().min(0),
  distanceM: z.number().min(0),
  steps: z.number().int().min(0),
  points: z.number().int().min(0),
  createdAt: z.string(),
})

export const appDataSchema = z.object({
  schemaVersion: z.literal(1),
  onboardingDone: z.boolean(),
  profile: profileSchema,
  logs: z.record(dateKeySchema, dailyLogSchema),
  points: z.array(pointSchema),
  walks: z.array(walkSchema),
  checklist: z.record(z.string(), z.string().nullable()),
})

export const simDataSchema = appDataSchema.extend({
  seed: z.number().int(),
  currentDate: dateKeySchema,
  startDate: dateKeySchema,
  autoWalk: z.boolean(),
})

export const exportSchema = z.discriminatedUnion('mode', [
  z.object({
    app: z.literal('choshido'),
    schemaVersion: z.literal(1),
    mode: z.literal('real'),
    exportedAt: z.string(),
    state: appDataSchema,
  }),
  z.object({
    app: z.literal('choshido'),
    schemaVersion: z.literal(1),
    mode: z.literal('sim'),
    exportedAt: z.string(),
    state: simDataSchema,
  }),
])

export function encodeExport(
  mode: 'real' | 'sim',
  state: AppData | SimData,
  exportedAt = new Date().toISOString(),
): unknown {
  return {
    app: 'choshido',
    schemaVersion: 1,
    mode,
    exportedAt,
    state,
  }
}

export type ImportResult =
  { ok: true; mode: 'real' | 'sim'; state: AppData | SimData } | { ok: false; error: string }

export function parseExport(text: string): ImportResult {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSONとして読み込めませんでした。' }
  }

  const result = exportSchema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    return {
      ok: false,
      error: `形式が一致しません${issue ? `（${issue.path.join('.')}: ${issue.message}）` : ''}。`,
    }
  }

  return {
    ok: true,
    mode: result.data.mode,
    state: result.data.state as AppData | SimData,
  }
}
