import type { Activity, AppData, Profile, Sex } from './types'

export interface BmiCategory {
  label: string
  tone: 'normal' | 'attention'
}

export interface MetricsSummary {
  latestWeight: number | null
  bmi: number | null
  bmiCategory: BmiCategory | null
  bmr: number | null
  tdee: number | null
  standardWeight: number | null
  age: number | null
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function round10(value: number): number {
  return Math.round(value / 10) * 10
}

export function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return { label: '低体重', tone: 'attention' }
  if (bmi < 25) return { label: '普通', tone: 'normal' }
  if (bmi < 30) return { label: '肥満1', tone: 'attention' }
  if (bmi < 35) return { label: '肥満2', tone: 'attention' }
  return { label: '肥満3', tone: 'attention' }
}

export function activityFactor(activity: Activity): number {
  if (activity === 'low') return 1.2
  if (activity === 'high') return 1.75
  return 1.55
}

export function ageFromBirthYear(birthYear: number | null, dateKey: string): number | null {
  if (birthYear === null) return null
  return Number(dateKey.slice(0, 4)) - birthYear
}

export function calcBmr(input: {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
}): number | null {
  if (input.sex === 'unspecified') return null
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age
  return input.sex === 'male' ? base + 5 : base - 161
}

export function calcStandardWeight(heightCm: number): number {
  const heightM = heightCm / 100
  return 22 * heightM * heightM
}

export function latestWeightUpTo(
  logs: AppData['logs'],
  dateKey: string,
): { date: string; weightKg: number } | null {
  let latest: { date: string; weightKg: number } | null = null
  for (const [date, log] of Object.entries(logs)) {
    if (date > dateKey) continue
    if (log.weightKg === null) continue
    if (!latest || date > latest.date) {
      latest = { date, weightKg: log.weightKg }
    }
  }
  return latest
}

export function metricsFor(data: AppData, dateKey: string): MetricsSummary {
  const profile: Profile = data.profile
  const latest = latestWeightUpTo(data.logs, dateKey)
  const weight = latest?.weightKg ?? null
  const age = ageFromBirthYear(profile.birthYear, dateKey)
  const rawBmi = weight !== null && profile.heightCm ? calcBmi(weight, profile.heightCm) : null
  const bmi = rawBmi !== null ? round1(rawBmi) : null
  const bmr =
    weight !== null && profile.heightCm && age !== null
      ? calcBmr({ weightKg: weight, heightCm: profile.heightCm, age, sex: profile.sex })
      : null
  const tdee = bmr !== null ? bmr * activityFactor(profile.activity) : null
  const standardWeight = profile.heightCm ? calcStandardWeight(profile.heightCm) : null

  return {
    latestWeight: weight,
    bmi,
    bmiCategory: bmi !== null ? bmiCategory(bmi) : null,
    bmr: bmr !== null ? round10(bmr) : null,
    tdee: tdee !== null ? round10(tdee) : null,
    standardWeight: standardWeight !== null ? round1(standardWeight) : null,
    age,
  }
}
