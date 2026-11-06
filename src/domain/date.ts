const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0)
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return localDateKey(date)
}

export function daysBetween(from: string, to: string): number {
  const a = parseDateKey(from).getTime()
  const b = parseDateKey(to).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function dayNumber(key: string): number {
  return Math.floor(parseDateKey(key).getTime() / 86_400_000)
}

export function lastNDates(endKey: string, count: number): string[] {
  const dates: string[] = []
  for (let index = count - 1; index >= 0; index -= 1) {
    dates.push(addDays(endKey, -index))
  }
  return dates
}

export function formatDateJa(key: string): string {
  const date = parseDateKey(key)
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ${
    WEEKDAYS[date.getDay()]
  }`
}

export function formatDateNumeric(key: string): string {
  const date = parseDateKey(key)
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

export function formatMonthDay(key: string): string {
  const date = parseDateKey(key)
  return `${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

export function formatDateLongJa(key: string): string {
  const date = parseDateKey(key)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function minutesSinceMidnight(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}

export function isPastOrToday(key: string, today = localDateKey()): boolean {
  return key <= today
}
