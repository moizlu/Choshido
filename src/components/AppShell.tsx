import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useStore } from '../app/storeContext'
import { formatDateJa, localDateKey } from '../domain/date'
import { IconAlert, IconClose, IconHistory, IconMap, IconSettings, IconToday } from './icons'
import { useToast } from './toastContext'

const NAV_ITEMS = [
  { to: '/', label: '今日', icon: IconToday, end: true },
  { to: '/history', label: '記録', icon: IconHistory, end: false },
  { to: '/map', label: '散歩', icon: IconMap, end: false },
  { to: '/settings', label: '設定', icon: IconSettings, end: false },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, sim, advanceSimDay, endSim, loadWarning, storageError, dismissWarning } = useStore()
  const { showToast } = useToast()
  const today = localDateKey()
  const displayDate = mode === 'sim' && sim ? sim.currentDate : today

  const handleAdvance = () => {
    const next = advanceSimDay()
    if (next) showToast(`${formatDateJa(next)} を記録しました`)
  }

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main')
          main?.focus()
          main?.scrollIntoView()
        }}
      >
        本文へ
      </a>

      {loadWarning ? (
        <div className="notice notice-warning mx-4 mt-2" role="alert">
          <div className="flex items-start gap-2">
            <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
            <p className="flex-1">{loadWarning}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={dismissWarning}>
              閉じる
            </button>
          </div>
        </div>
      ) : null}

      {storageError ? (
        <div className="notice notice-warning mx-4 mt-2" role="alert">
          {storageError}
        </div>
      ) : null}

      {mode === 'sim' ? (
        <div className="sim-banner">
          <strong>シミュレーション中</strong>
          <span>{sim ? formatDateJa(sim.currentDate) : ''}</span>
          <span className="sim-banner-spacer" />
          <button type="button" className="btn btn-sm" onClick={handleAdvance}>
            1日進める
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={endSim}>
            <IconClose width={14} height={14} />
            終了
          </button>
          <p className="sim-banner-guide">
            「1日進める」で日付を進めながら、各タブを見て回れます。
          </p>
        </div>
      ) : null}

      <div className="app-body">
        <aside className="side-rail" aria-label="サイドバー">
          <div className="rail-brand">
            <span className="wordmark">調知堂</span>
          </div>
          <nav className="rail-nav" aria-label="主要な画面">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="rail-link">
                <item.icon width={18} height={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="rail-foot">
            <div className="rail-rule" />
            <span className="num">{formatDateJa(displayDate)}</span>
            {mode === 'sim' ? (
              <span className="mode-chip">SIM</span>
            ) : (
              <span>ブラウザ内に保存</span>
            )}
          </div>
        </aside>

        <div className="app-main">
          <header className="mobile-bar">
            <div className="mobile-bar-title">
              <span className="wordmark">調知堂</span>
              <span className="wordmark-sub">{formatDateJa(displayDate)}</span>
            </div>
            {mode === 'sim' ? <span className="mode-chip">SIM</span> : null}
          </header>
          <main id="main" className="page" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      <nav className="tab-bar" aria-label="主要な画面">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="tab-link">
            <item.icon width={20} height={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
