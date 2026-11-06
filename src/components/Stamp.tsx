import type { ReactNode } from 'react'

export function Stamp({
  children,
  tone = 'accent',
  className = '',
}: {
  children: ReactNode
  tone?: 'accent' | 'caution' | 'muted'
  className?: string
}) {
  const toneClass = tone === 'caution' ? 'stamp-caution' : tone === 'muted' ? 'stamp-muted' : ''
  return <span className={`stamp ${toneClass} ${className}`.trim()}>{children}</span>
}
