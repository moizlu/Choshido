import type { AppData, SimData } from '../domain/types'
import { appDataSchema, encodeExport, simDataSchema } from './schema'

const REAL_KEY = 'choshido:v1:real'
const SIM_KEY = 'choshido:v1:sim'
const CORRUPT_PREFIX = 'choshido:corrupt:'

export interface LoadResult<T> {
  data: T | null
  error: string | null
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function backup(raw: string): void {
  const target = storage()
  if (!target) return
  try {
    target.setItem(`${CORRUPT_PREFIX}${Date.now()}`, raw)
  } catch {
    // Ignore backup failures; the warning still explains what happened.
  }
}

function load<T>(
  key: string,
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T } },
): LoadResult<T> {
  const target = storage()
  if (!target) {
    return { data: null, error: 'このブラウザでは保存領域を利用できません。' }
  }

  let raw: string | null = null
  try {
    raw = target.getItem(key)
  } catch {
    return { data: null, error: '保存データを読み込めませんでした。' }
  }
  if (!raw) return { data: null, error: null }

  try {
    const value: unknown = JSON.parse(raw)
    const result = schema.safeParse(value)
    if (!result.success || !result.data) {
      backup(raw)
      return {
        data: null,
        error: '保存データが破損していたため退避しました。新しい状態で続けます。',
      }
    }
    return { data: result.data, error: null }
  } catch {
    backup(raw)
    return {
      data: null,
      error: '保存データが破損していたため退避しました。新しい状態で続けます。',
    }
  }
}

export function loadReal(): LoadResult<AppData> {
  return load<AppData>(REAL_KEY, appDataSchema)
}

export function loadSim(): LoadResult<SimData> {
  return load<SimData>(SIM_KEY, simDataSchema)
}

function save(key: string, value: unknown): string | null {
  const target = storage()
  if (!target) return 'このブラウザでは保存領域を利用できません。'
  try {
    target.setItem(key, JSON.stringify(value))
    return null
  } catch {
    return '保存できませんでした。ブラウザの空き容量を確認してください。'
  }
}

export function saveReal(data: AppData): string | null {
  return save(REAL_KEY, data)
}

export function saveSim(data: SimData): string | null {
  return save(SIM_KEY, data)
}

export function removeSim(): void {
  const target = storage()
  if (!target) return
  try {
    target.removeItem(SIM_KEY)
  } catch {
    // Ignore removal failures.
  }
}

export function makeExport(mode: 'real' | 'sim', state: AppData | SimData): string {
  return JSON.stringify(encodeExport(mode, state), null, 2)
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
