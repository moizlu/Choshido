import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../app/storeContext'
import { checklistProgress } from '../../app/selectors'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { Stamp } from '../../components/Stamp'
import { useToast } from '../../components/toastContext'
import { IconAlert, IconCheck, IconClose, IconWalk } from '../../components/icons'
import { CHECKLIST_ITEMS } from '../../domain/checklist'
import { formatDateJa } from '../../domain/date'
import type { ShelterId } from '../../domain/types'
import { WalkMap } from './WalkMap'
import { findPath, walkMetrics } from './pathfinding'
import { SHELTERS, isHazardAt, type GridPoint } from './mapData'
import { useWalkAnimation } from './useWalkAnimation'

interface WalkResult {
  destination: ShelterId
  points: number
  hazards: number
  cells: number
  distanceM: number
  steps: number
  avoidHazard: boolean
}

export function MapPage() {
  const store = useStore()
  const { showToast } = useToast()
  const { data, date } = store
  const [destination, setDestination] = useState<ShelterId>('B')
  const [avoidHazard, setAvoidHazard] = useState(true)
  const [result, setResult] = useState<WalkResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLElement | null>(null)
  const pendingRef = useRef<{
    destination: ShelterId
    avoidHazard: boolean
    path: GridPoint[]
  } | null>(null)

  const routes = useMemo(
    () =>
      SHELTERS.map((shelter) => {
        const route = findPath(shelter.point, avoidHazard)
        return {
          shelter,
          path: route,
          metrics: route ? walkMetrics(route) : null,
        }
      }),
    [avoidHazard],
  )

  const selectedRoute = routes.find((route) => route.shelter.id === destination)
  const checklist = checklistProgress(data)
  const history = [...data.walks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  const handleComplete = (completedPath: GridPoint[]) => {
    const pending = pendingRef.current
    if (!pending) return
    const metrics = walkMetrics(completedPath)
    const points = store.recordWalk({
      date,
      destinationId: pending.destination,
      avoidHazard: pending.avoidHazard,
      hazardCellsCrossed: metrics.hazardCells,
      cells: metrics.cells,
      distanceM: metrics.distanceM,
      steps: metrics.steps,
    })
    setResult({
      destination: pending.destination,
      points,
      hazards: metrics.hazardCells,
      cells: metrics.cells,
      distanceM: metrics.distanceM,
      steps: metrics.steps,
      avoidHazard: pending.avoidHazard,
    })
    if (points > 0) {
      showToast(`${metricLabel(points)} 避難所${pending.destination}に到着しました`)
    } else {
      showToast('到着しました。この避難先の本日分は獲得済みです。')
    }
  }

  const { path, index, running, start, skip, reset } = useWalkAnimation(handleComplete)

  useEffect(() => {
    if (!result) return
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [result])

  const handleSelectShelter = (id: ShelterId) => {
    if (id === destination) return
    reset()
    setResult(null)
    setError(null)
    setDestination(id)
  }

  const handleAvoidChange = (value: boolean) => {
    reset()
    setResult(null)
    setError(null)
    setAvoidHazard(value)
  }

  const handleStart = () => {
    if (running) return
    if (!selectedRoute?.path) {
      setError(
        '安全な経路が見つかりません。危険区域を避ける設定を変えるか、別の避難先を選んでください。',
      )
      return
    }
    setError(null)
    setResult(null)
    pendingRef.current = {
      destination,
      avoidHazard,
      path: selectedRoute.path,
    }
    const instant =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    start(selectedRoute.path, instant)
  }

  const handleReset = () => {
    reset()
    setResult(null)
    setError(null)
  }

  const handleChecklist = (id: string) => {
    const awarded = store.completeChecklistItem(id)
    if (awarded) showToast('備えを記録しました +5点')
  }

  const displayPath = path ?? selectedRoute?.path ?? null
  const selectedMetrics = selectedRoute?.metrics
  const currentPoint = path?.[index]
  const inHazard = running && currentPoint ? isHazardAt(currentPoint.x, currentPoint.y) : false

  return (
    <>
      <PageHeader
        eyebrow="防災 / 訓練"
        title="防災さんぽ"
        description="架空の街で避難所までの経路を選び、危険区域を避けて歩く訓練です。"
        actions={<Stamp tone="caution">訓練</Stamp>}
      />

      <div className="notice notice-warning mb-4">
        <div className="flex items-start gap-2">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
          <p>この地図はデモ用の架空の街です。実際の避難経路・ハザード情報ではありません。</p>
        </div>
      </div>

      <div className="grid-dashboard">
        <div className="stack">
          <section className="card" aria-labelledby="map-title">
            <div className="card-header">
              <h2 className="card-title" id="map-title">
                街のマップ
              </h2>
              <span className="card-label">16×12 / 1マス30m</span>
            </div>
            <WalkMap path={displayPath} walkerIndex={index} destination={destination} />
            <div className="map-legend">
              <span className="map-legend-item">
                <span className="map-swatch" style={{ background: 'var(--color-paper-raised)' }} />
                道路
              </span>
              <span className="map-legend-item">
                <span className="map-swatch" style={{ background: 'var(--color-park)' }} />
                公園
              </span>
              <span className="map-legend-item">
                <span className="map-swatch" style={{ background: 'var(--color-paper-sunken)' }} />
                建物
              </span>
              <span className="map-legend-item">
                <span className="map-swatch" style={{ background: 'var(--color-water)' }} />水
              </span>
              <span className="map-legend-item">
                <span
                  className="map-swatch"
                  style={{
                    background:
                      'repeating-linear-gradient(45deg, var(--color-caution-soft) 0 2px, var(--color-caution) 2px 3px)',
                  }}
                />
                危険区域
              </span>
              <span className="map-legend-item">
                <span
                  className="map-swatch"
                  style={{
                    background: 'var(--color-paper-raised)',
                    borderColor: 'var(--color-accent)',
                  }}
                />
                避難所
              </span>
            </div>

            <div className="walk-status">
              {running ? (
                <>
                  <span>
                    歩行中{' '}
                    <span className="num">{Math.min(index + 1, displayPath?.length ?? 0)}</span> /{' '}
                    <span className="num">{displayPath?.length ?? 0}</span> マス
                  </span>
                  {inHazard ? <Stamp tone="caution">危険区域</Stamp> : null}
                  <Button size="sm" variant="ghost" onClick={skip}>
                    スキップ
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleReset}>
                    <IconClose width={14} height={14} />
                    中止
                  </Button>
                </>
              ) : selectedMetrics ? (
                <>
                  <span>
                    約 <span className="num">{selectedMetrics.distanceM}</span>m
                  </span>
                  <span>
                    歩数 <span className="num">{selectedMetrics.steps}</span>
                  </span>
                  <span>
                    危険区域 <span className="num">{selectedMetrics.hazardCells}</span>マス
                  </span>
                </>
              ) : (
                <span>この設定では経路が見つかりません。</span>
              )}
            </div>
            <p className="sr-only" aria-live="assertive">
              {inHazard ? '危険区域に入りました' : ''}
            </p>

            {error ? (
              <div className="notice notice-warning mt-3" role="alert">
                {error}
              </div>
            ) : null}
          </section>

          {result ? (
            <section className="card" aria-labelledby="result-title" ref={resultRef}>
              <div className="card-header">
                <h2 className="card-title" id="result-title">
                  訓練の結果
                </h2>
                <Stamp tone={result.hazards === 0 ? 'accent' : 'caution'}>
                  {result.hazards === 0 ? '安全' : '危険区域あり'}
                </Stamp>
              </div>
              <h3 className="card-title">避難所 {result.destination} に到着</h3>
              <dl className="result-grid">
                <div className="result-cell">
                  <dt>距離</dt>
                  <dd>
                    {result.distanceM}
                    <small>m</small>
                  </dd>
                </div>
                <div className="result-cell">
                  <dt>歩数</dt>
                  <dd>{result.steps}</dd>
                </div>
                <div className="result-cell">
                  <dt>危険区域</dt>
                  <dd>
                    {result.hazards}
                    <small>マス</small>
                  </dd>
                </div>
                <div className="result-cell">
                  <dt>獲得</dt>
                  <dd>
                    +{result.points}
                    <small>点</small>
                  </dd>
                </div>
              </dl>
              {result.hazards > 0 ? (
                <p className="notice notice-warning mt-3">
                  危険区域を{result.hazards}
                  マス通過しました。次は「危険区域を避ける」をONにして迂回路を選びましょう。
                </p>
              ) : result.points > 0 ? (
                <p className="card-note mt-3">
                  到着 +30点 / 安全手当 +20点。危険区域を一度も通りませんでした。
                </p>
              ) : null}
              {result.points === 0 ? (
                <p className="card-note mt-2">この避難先の本日分は獲得済みです。</p>
              ) : null}
              <div className="form-actions">
                <Button variant="primary" onClick={handleReset}>
                  <IconWalk width={16} height={16} />
                  やり直す
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        <div className="grid-side stack">
          <section className="card" aria-labelledby="shelter-title">
            <div className="card-header">
              <h2 className="card-title" id="shelter-title">
                避難先を選ぶ
              </h2>
              <span className="card-label">自宅から</span>
            </div>
            <div className="shelter-grid" role="group" aria-label="避難先">
              {routes.map((route) => {
                const selected = route.shelter.id === destination
                const meta = route.metrics
                  ? `約${route.metrics.distanceM}m / 危険 ${route.metrics.hazardCells}`
                  : '経路なし'
                return (
                  <button
                    key={route.shelter.id}
                    type="button"
                    className="shelter-card"
                    aria-pressed={selected}
                    disabled={running}
                    onClick={() => handleSelectShelter(route.shelter.id)}
                  >
                    <span className="shelter-mark">{route.shelter.id}</span>
                    <span>
                      <span className="shelter-name">
                        {route.shelter.name}
                        <span className="shelter-meta">{route.shelter.area}</span>
                      </span>
                      <span className="shelter-meta">{meta}</span>
                    </span>
                    {selected ? (
                      <IconCheck width={16} height={16} className="shelter-check" />
                    ) : null}
                  </button>
                )
              })}
            </div>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={avoidHazard}
                disabled={running}
                onChange={(event) => handleAvoidChange(event.target.checked)}
              />
              <span className="toggle-text">
                <strong>危険区域を避ける</strong>
                <span>安全な迂回路を優先します</span>
              </span>
            </label>

            <Button
              variant="primary"
              block
              disabled={running || !selectedRoute?.path}
              onClick={handleStart}
            >
              <IconWalk width={16} height={16} />
              {running ? '歩行中…' : '歩く'}
            </Button>
            <p className="field-hint mt-2">
              各避難先1日1回まで。到着 +30点、危険区域0マスで +20点。
            </p>
          </section>

          <section className="card" aria-labelledby="checklist-title">
            <div className="card-header">
              <h2 className="card-title" id="checklist-title">
                防災の備え
              </h2>
              {checklist.complete ? (
                <Stamp>備え完了</Stamp>
              ) : (
                <span className="card-label">
                  {checklist.done} / {checklist.total}
                </span>
              )}
            </div>
            <ul className="checklist">
              {CHECKLIST_ITEMS.map((item) => {
                const done = Boolean(data.checklist[item.id])
                return (
                  <li key={item.id} className="checklist-item">
                    <button
                      type="button"
                      className="checklist-btn"
                      data-done={done}
                      disabled={done}
                      onClick={() => handleChecklist(item.id)}
                    >
                      <span className="check-box">
                        <IconCheck width={14} height={14} />
                      </span>
                      <span>{item.label}</span>
                      <span className="checklist-points">{done ? '完了' : '+5'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="field-hint mt-2">各項目1回まで。すべて完了で +25点。</p>
          </section>

          <section className="card">
            <h2 className="card-title">訓練の前提</h2>
            <p className="card-note mt-2">
              自宅はマップ南西の位置にあります。マップ・避難所・危険区域はすべてデモ用に作成したもので、実際の神戸市のハザードマップとは関係ありません。
            </p>
          </section>
        </div>
      </div>

      <section className="card mt-4" aria-labelledby="history-title">
        <div className="card-header">
          <h2 className="card-title" id="history-title">
            訓練の履歴
          </h2>
          <span className="card-label">直近5件</span>
        </div>
        {history.length > 0 ? (
          <ul className="history-list">
            {history.map((walk) => (
              <li key={walk.id} className="history-item">
                <span>
                  <span className="num">{formatDateJa(walk.date)}</span> / 避難所
                  {walk.destinationId}
                </span>
                <span className="history-meta">
                  危険 {walk.hazardCellsCrossed} / +{walk.points}点
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">まだ訓練の記録がありません。</div>
        )}
      </section>

      <p className="footer-note">
        防災さんぽは訓練用のシミュレーションです。実際に避難するときは、自治体の最新情報と現地の状況に従ってください。
      </p>
    </>
  )
}

function metricLabel(points: number): string {
  if (points >= 50) return `+${points}点（到着+30 / 安全+20）`
  if (points >= 30) return `+${points}点（到着+30）`
  return ''
}
