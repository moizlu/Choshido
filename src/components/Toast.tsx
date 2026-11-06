import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './toastContext'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const showToast = useCallback((next: string) => {
    setMessage(next)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setMessage(null)
      timer.current = null
    }, 2800)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="toast"
        role="status"
        aria-live="polite"
        data-visible={message !== null ? 'true' : 'false'}
      >
        {message ?? ''}
      </div>
    </ToastContext.Provider>
  )
}
