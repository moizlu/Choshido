import { useCallback, useRef, useState, type ReactNode } from 'react'
import { localDateKey } from '../domain/date'
import { emptyAppData } from '../domain/factory'
import {
  advanceSimDay as advanceSimDayPure,
  DEFAULT_SIM_SEED,
  generateSim,
  newSimSeed,
} from '../domain/sim'
import type { AppData, LogInput, Mode, Profile, SimData, WalkInput } from '../domain/types'
import {
  completeChecklistInData,
  completeOnboardingInData,
  deleteLogFromData,
  recordWalkInData,
  saveLogToData,
  updateProfileInData,
} from './apply'
import {
  downloadText,
  loadReal,
  loadSim,
  makeExport,
  removeSim,
  saveReal,
  saveSim,
} from './persistence'
import { parseExport } from './schema'
import {
  activeDate,
  activeLevel,
  activeMetrics,
  activeStreak,
  activeTodayPoints,
  activeTotalPoints,
  type StoreSnapshot,
} from './selectors'
import { StoreContext, type StoreValue } from './storeContext'

interface StoreState extends StoreSnapshot {
  storageError: string | null
  loadWarning: string | null
}

function loadInitial(): StoreState {
  const real = loadReal()
  const sim = loadSim()
  const warnings = [real.error, sim.error].filter((value): value is string => Boolean(value))
  return {
    mode: 'real',
    real: real.data ?? emptyAppData(),
    sim: sim.data ?? null,
    storageError: null,
    loadWarning: warnings.length > 0 ? warnings.join(' ') : null,
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadInitial)
  const stateRef = useRef(state)

  const commit = useCallback((updater: (current: StoreState) => StoreState) => {
    const next = updater(stateRef.current)
    const realError = saveReal(next.real)
    const simError = next.sim ? saveSim(next.sim) : null
    if (!next.sim) removeSim()
    const finalState: StoreState = {
      ...next,
      storageError: realError ?? simError ?? null,
    }
    stateRef.current = finalState
    setState(finalState)
  }, [])

  const saveLog = useCallback(
    (input: LogInput) => {
      const current = stateRef.current
      const now = new Date().toISOString()

      if (current.mode === 'sim' && current.sim) {
        if (input.date > current.sim.currentDate) {
          return { awarded: false, milestones: [] }
        }
        const result = saveLogToData(current.sim, input, current.sim.currentDate, now)
        const sim: SimData = { ...current.sim, ...result.data }
        commit((value) => ({ ...value, sim }))
        return { awarded: result.awarded, milestones: result.milestones }
      }

      const date = localDateKey()
      if (input.date > date) {
        return { awarded: false, milestones: [] }
      }
      const result = saveLogToData(current.real, input, date, now)
      commit((value) => ({ ...value, real: result.data }))
      return { awarded: result.awarded, milestones: result.milestones }
    },
    [commit],
  )

  const deleteLog = useCallback(
    (date: string) => {
      const current = stateRef.current
      if (current.mode === 'sim' && current.sim) {
        const sim: SimData = { ...current.sim, ...deleteLogFromData(current.sim, date) }
        commit((value) => ({ ...value, sim }))
        return
      }
      commit((value) => ({ ...value, real: deleteLogFromData(value.real, date) }))
    },
    [commit],
  )

  const recordWalk = useCallback(
    (input: WalkInput) => {
      const current = stateRef.current
      const now = new Date().toISOString()
      if (current.mode === 'sim' && current.sim) {
        const result = recordWalkInData(current.sim, input, now)
        const sim: SimData = { ...current.sim, ...result.data }
        commit((value) => ({ ...value, sim }))
        return result.awarded
      }
      const result = recordWalkInData(current.real, input, now)
      commit((value) => ({ ...value, real: result.data }))
      return result.awarded
    },
    [commit],
  )

  const completeChecklistItem = useCallback(
    (id: string) => {
      const current = stateRef.current
      const now = new Date().toISOString()
      const date = activeDate(current)
      if (current.mode === 'sim' && current.sim) {
        const result = completeChecklistInData(current.sim, id, date, now)
        if (!result.awarded) return false
        const sim: SimData = { ...current.sim, ...result.data }
        commit((value) => ({ ...value, sim }))
        return true
      }
      const result = completeChecklistInData(current.real, id, date, now)
      if (!result.awarded) return false
      commit((value) => ({ ...value, real: result.data }))
      return true
    },
    [commit],
  )

  const updateProfile = useCallback(
    (profile: Profile) => {
      const current = stateRef.current
      if (current.mode === 'sim' && current.sim) {
        const sim: SimData = { ...current.sim, ...updateProfileInData(current.sim, profile) }
        commit((value) => ({ ...value, sim }))
        return
      }
      commit((value) => ({ ...value, real: updateProfileInData(value.real, profile) }))
    },
    [commit],
  )

  const completeOnboarding = useCallback(
    (profile: Profile | null) => {
      commit((value) => ({
        ...value,
        mode: 'real',
        real: completeOnboardingInData(value.real, profile),
      }))
    },
    [commit],
  )

  const startSim = useCallback(
    (seed = DEFAULT_SIM_SEED) => {
      const sim = generateSim(localDateKey(), seed)
      commit((value) => ({ ...value, sim, mode: 'sim' }))
    },
    [commit],
  )

  const endSim = useCallback(() => {
    commit((value) => ({ ...value, mode: 'real' }))
  }, [commit])

  const resetSim = useCallback(() => {
    const current = stateRef.current
    const seed = current.sim?.seed ?? DEFAULT_SIM_SEED
    const sim = generateSim(localDateKey(), seed)
    commit((value) => ({ ...value, sim, mode: 'sim' }))
  }, [commit])

  const shuffleSim = useCallback(() => {
    const sim = generateSim(localDateKey(), newSimSeed())
    commit((value) => ({ ...value, sim, mode: 'sim' }))
  }, [commit])

  const advanceSimDay = useCallback(() => {
    const current = stateRef.current
    if (current.mode !== 'sim' || !current.sim) return null
    const sim = advanceSimDayPure(current.sim)
    commit((value) => ({ ...value, sim }))
    return sim.currentDate
  }, [commit])

  const setAutoWalk = useCallback(
    (value: boolean) => {
      const current = stateRef.current
      if (!current.sim) return
      const sim: SimData = { ...current.sim, autoWalk: value }
      commit((stateValue) => ({ ...stateValue, sim }))
    },
    [commit],
  )

  const exportActive = useCallback(() => {
    const current = stateRef.current
    const mode: Mode = current.mode === 'sim' && current.sim ? 'sim' : 'real'
    const data = mode === 'sim' && current.sim ? current.sim : current.real
    const text = makeExport(mode, data)
    downloadText(`choshido-${mode}-${localDateKey()}.json`, text)
  }, [])

  const importActive = useCallback(
    (text: string) => {
      const result = parseExport(text)
      if (!result.ok) return { ok: false, message: result.error }

      if (result.mode === 'real') {
        commit((value) => ({ ...value, mode: 'real', real: result.state as AppData }))
        return { ok: true, message: '通常データを読み込みました。' }
      }

      commit((value) => ({ ...value, mode: 'sim', sim: result.state as SimData }))
      return { ok: true, message: 'シミュレーションデータを読み込みました。' }
    },
    [commit],
  )

  const clearActive = useCallback(() => {
    const current = stateRef.current
    if (current.mode === 'sim') {
      commit((value) => ({ ...value, mode: 'real', sim: null }))
      return
    }
    commit((value) => ({ ...value, mode: 'real', real: emptyAppData() }))
  }, [commit])

  const dismissWarning = useCallback(() => {
    setState((value) => {
      const next = { ...value, loadWarning: null }
      stateRef.current = next
      return next
    })
  }, [])

  const data = currentData(state)
  const date = activeDate(state)
  const value: StoreValue = {
    ...state,
    data,
    date,
    metrics: activeMetrics(state),
    streak: activeStreak(state),
    total: activeTotalPoints(state),
    level: activeLevel(state),
    todayPoints: activeTodayPoints(state),
    saveLog,
    deleteLog,
    recordWalk,
    completeChecklistItem,
    updateProfile,
    completeOnboarding,
    startSim,
    endSim,
    resetSim,
    shuffleSim,
    advanceSimDay,
    setAutoWalk,
    exportActive,
    importActive,
    clearActive,
    dismissWarning,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function currentData(state: StoreState): AppData {
  return state.mode === 'sim' && state.sim ? state.sim : state.real
}
