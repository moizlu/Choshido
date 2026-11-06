import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './app/storeContext'
import { AppShell } from './components/AppShell'
import { HistoryPage } from './features/history/HistoryPage'
import { MapPage } from './features/map/MapPage'
import { Onboarding } from './features/settings/Onboarding'
import { SettingsPage } from './features/settings/SettingsPage'
import { TodayPage } from './features/today/TodayPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const { mode, real, date } = useStore()

  if (mode === 'real' && !real.onboardingDone) {
    return <Onboarding />
  }

  return (
    <>
      <ScrollToTop />
      <AppShell>
        <Routes>
          <Route path="/" element={<TodayPage key={`${mode}:${date}`} />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </>
  )
}
