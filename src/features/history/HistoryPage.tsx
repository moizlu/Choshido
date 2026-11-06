import { useState } from 'react'
import { useStore } from '../../app/storeContext'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/Button'
import { Stamp } from '../../components/Stamp'
import { useToast } from '../../components/toastContext'
import { formatDateJa, lastNDates } from '../../domain/date'
import { pointsOnDate } from '../../domain/points'
import type { LogInput } from '../../domain/types'
import { LogForm } from '../today/LogForm'
import { ConditionStrip, ExerciseChart, SleepChart, WeightChart } from './charts'

export function HistoryPage() {
  const store = useStore()
  const { showToast } = useToast()
  const { data, date } = store
  const [range, setRange] = useState<14 | 30>(14)
  const [editing, setEditing] = useState<string | null>(null)

  const dates = lastNDates(date, range)
  const displayDates = [...dates].reverse()
  const loggedCount = dates.filter((dayKey) => data.logs[dayKey]).length

  const handleSave = (input: LogInput) => {
    const result = store.saveLog(input)
    showToast(result.awarded ? '記録を追加しました +10点' : '記録を更新しました')
    setEditing(null)
  }

  const handleDelete = (dayKey: string) => {
    store.deleteLog(dayKey)
    showToast('記録を削除しました')
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        eyebrow={`記録 / 直近${range}日`}
        title="記録の台帳"
        description="日ごとの記録と推移を確認します。行を開くと過去の記録を編集できます。"
        actions={
          <div className="settings-row" role="group" aria-label="表示期間">
            <Button
              size="sm"
              variant={range === 14 ? 'primary' : 'secondary'}
              aria-pressed={range === 14}
              onClick={() => setRange(14)}
            >
              14日
            </Button>
            <Button
              size="sm"
              variant={range === 30 ? 'primary' : 'secondary'}
              aria-pressed={range === 30}
              onClick={() => setRange(30)}
            >
              30日
            </Button>
          </div>
        }
      />

      <div className="history-charts">
        <WeightChart dates={dates} logs={data.logs} />
        <SleepChart dates={dates} logs={data.logs} />
        <ExerciseChart dates={dates} logs={data.logs} />
        <ConditionStrip dates={dates} logs={data.logs} />
      </div>

      <section className="card mt-4" aria-labelledby="ledger-title">
        <div className="card-header">
          <h2 className="card-title" id="ledger-title">
            日別の記録
          </h2>
          <span className="card-label">
            {loggedCount} / {range}日
          </span>
        </div>

        <ul className="ledger">
          {displayDates.map((dayKey) => {
            const log = data.logs[dayKey]
            const points = pointsOnDate(data.points, dayKey)
            const isEditing = editing === dayKey
            return (
              <li key={dayKey} className="ledger-item">
                <div className="ledger-row">
                  <div className="ledger-date">
                    <span className="num">{formatDateJa(dayKey)}</span>
                    {log?.condition ? (
                      <Stamp tone={log.condition <= 2 ? 'caution' : 'accent'}>
                        体調 {log.condition}
                      </Stamp>
                    ) : null}
                  </div>
                  <div className="ledger-actions">
                    {points > 0 ? <span className="card-label">+{points}点</span> : null}
                    {log ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-expanded={isEditing}
                        onClick={() => setEditing(isEditing ? null : dayKey)}
                      >
                        {isEditing ? '閉じる' : '編集'}
                      </Button>
                    ) : (
                      <span className="card-label ledger-empty">記録なし</span>
                    )}
                  </div>
                  <div className="ledger-metrics">
                    <span className="ledger-metric">
                      体重{' '}
                      <span className="num">
                        {log?.weightKg != null ? `${log.weightKg.toFixed(1)}kg` : '—'}
                      </span>
                    </span>
                    <span className="ledger-metric">
                      睡眠{' '}
                      <span className="num">
                        {log?.sleepHours != null ? `${log.sleepHours.toFixed(1)}h` : '—'}
                      </span>
                    </span>
                    <span className="ledger-metric">
                      運動{' '}
                      <span className="num">
                        {log?.exerciseMinutes != null ? `${log.exerciseMinutes}分` : '—'}
                      </span>
                    </span>
                    <span className="ledger-metric">
                      体調 <span className="num">{log?.condition ?? '—'}</span>
                    </span>
                  </div>
                </div>

                {log && isEditing ? (
                  <div className="pb-3">
                    <LogForm
                      key={`${dayKey}-${log.updatedAt}`}
                      date={dayKey}
                      initial={log}
                      onSubmit={handleSave}
                      onDelete={() => handleDelete(dayKey)}
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>

      <p className="footer-note">
        記録はこの端末のブラウザ内にだけ保存されます。設定からJSONで書き出せます。
      </p>
    </>
  )
}
