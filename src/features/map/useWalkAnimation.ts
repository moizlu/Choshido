import { useCallback, useEffect, useRef, useState } from 'react'
import type { GridPoint } from './mapData'

export function useWalkAnimation(onComplete: (path: GridPoint[]) => void) {
  const [path, setPath] = useState<GridPoint[] | null>(null)
  const [index, setIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const timer = useRef<number | null>(null)
  const done = useRef(true)
  const completeRef = useRef(onComplete)

  useEffect(() => {
    completeRef.current = onComplete
  }, [onComplete])

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const finish = useCallback(
    (route: GridPoint[]) => {
      if (done.current) return
      done.current = true
      clearTimer()
      setIndex(Math.max(0, route.length - 1))
      setRunning(false)
      completeRef.current(route)
    },
    [clearTimer],
  )

  const start = useCallback(
    (route: GridPoint[], instant: boolean) => {
      clearTimer()
      done.current = false
      setPath(route)
      setIndex(0)
      setRunning(true)

      if (instant || route.length <= 1) {
        finish(route)
        return
      }

      let next = 0
      const tick = () => {
        next += 1
        if (next >= route.length) {
          finish(route)
          return
        }
        setIndex(next)
        timer.current = window.setTimeout(tick, 240)
      }
      timer.current = window.setTimeout(tick, 240)
    },
    [clearTimer, finish],
  )

  const skip = useCallback(() => {
    if (path) finish(path)
  }, [path, finish])

  const reset = useCallback(() => {
    clearTimer()
    done.current = true
    setPath(null)
    setIndex(0)
    setRunning(false)
  }, [clearTimer])

  useEffect(() => clearTimer, [clearTimer])

  return { path, index, running, start, skip, reset }
}
