import type { AppData, Profile } from './types'

export const DEFAULT_PROFILE: Profile = {
  heightCm: null,
  birthYear: null,
  sex: 'unspecified',
  activity: 'normal',
}

export const SIM_PROFILE: Profile = {
  heightCm: 170,
  birthYear: 1990,
  sex: 'male',
  activity: 'normal',
}

export function emptyAppData(): AppData {
  return {
    schemaVersion: 1,
    onboardingDone: false,
    profile: { ...DEFAULT_PROFILE },
    logs: {},
    points: [],
    walks: [],
    checklist: {},
  }
}
