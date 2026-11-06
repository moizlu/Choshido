import { Link } from 'react-router-dom'
import { useStore } from '../../app/storeContext'
import { badgesFor, checklistProgress } from '../../app/selectors'
import { PageHeader } from '../../components/PageHeader'
import { Stamp } from '../../components/Stamp'
import { useToast } from '../../components/toastContext'
import { buildAdvice } from '../../domain/advice'
import { formatDateJa } from '../../domain/date'
import { STREAK_MILESTONES } from '../../domain/points'
import { AdviceList } from './AdviceList'
import { LogForm } from './LogForm'

export function TodayPage() {
  const store = useStore()
  const { showToast } = useToast()
  const { data, date, metrics, streak, total, level, todayPoints } = store

  const todayLog = data.logs[date]
  const advice = buildAdvice(data, date)
  const checklist = checklistProgress(data)
  const badges = badgesFor(data, date)
  const lastWalk = [...data.walks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  const profileNeedsHeight = !data.profile.heightCm || !data.profile.birthYear
  const profileNeedsSex = data.profile.sex === 'unspecified'

  const handleSave = (input: Parameters<typeof store.saveLog>[0]) => {
    const result = store.saveLog(input)
    const parts = [result.awarded ? '記録しました +10点' : '記録を更新しました']
    for (const days of result.milestones) {
      const milestone = STREAK_MILESTONES.find((item) => item.days === days)
      if (milestone) parts.push(`連続${days}日 +${milestone.amount}点`)
    }
    showToast(parts.join(' / '))
  }

  const handleDelete = () => {
    store.deleteLog(date)
    showToast('記録を削除しました')
  }

  return (
    <>
      <PageHeader
        eyebrow={`記録 / ${formatDateJa(date)}`}
        title="今日の記録"
        description="体重・睡眠・運動・体調を残します。入力はどれか1つでも構いません。"
        actions={todayLog ? <Stamp>記録済み</Stamp> : <Stamp tone="muted">未記録</Stamp>}
      />

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">BMI</p>
          <p className="summary-value">
            {metrics.bmi !== null ? metrics.bmi.toFixed(1) : '—'}
            <small>{metrics.bmiCategory?.label ?? '未設定'}</small>
          </p>
          <p className="summary-sub">
            {metrics.standardWeight !== null
              ? `標準体重 ${metrics.standardWeight.toFixed(1)}kg`
              : '最新の体重から'}
          </p>
        </div>
        <div className="summary-card">
          <p className="summary-label">基礎代謝</p>
          <p className="summary-value">
            {metrics.bmr !== null ? metrics.bmr.toLocaleString('ja-JP') : '—'}
            <small>kcal</small>
          </p>
          <p className="summary-sub">
            {metrics.tdee !== null
              ? `推定消費 ${metrics.tdee.toLocaleString('ja-JP')}kcal`
              : 'Mifflin-St Jeor'}
          </p>
        </div>
        <div className="summary-card">
          <p className="summary-label">連続記録</p>
          <p className="summary-value">
            {streak}
            <small>日</small>
          </p>
          <p className="summary-sub">今日または昨日まで</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">段位</p>
          <p className="summary-value">
            {level.current.name}
            <small>累計 {total}点</small>
          </p>
          <p className="summary-sub">{level.next ? `次は${level.next.name}` : '最高段位'}</p>
        </div>
      </div>

      {profileNeedsHeight || profileNeedsSex ? (
        <div className="notice notice-accent mb-4">
          {profileNeedsHeight
            ? 'プロフィールを設定すると、BMIと基礎代謝が表示されます。'
            : '性別を設定すると、基礎代謝が表示されます。'}{' '}
          <Link to="/settings" className="link-inline">
            設定へ
          </Link>
        </div>
      ) : null}

      <div className="grid-dashboard">
        <div className="stack">
          <section className="card" aria-labelledby="today-log-title">
            <div className="card-header">
              <h2 className="card-title" id="today-log-title">
                今日の入力
              </h2>
              <span className="card-label">1日1回 +10点</span>
            </div>
            <LogForm
              key={`${date}-${todayLog?.updatedAt ?? 'new'}`}
              date={date}
              initial={todayLog}
              onSubmit={handleSave}
              onDelete={todayLog ? handleDelete : undefined}
            />
          </section>

          <section className="card" aria-labelledby="today-advice-title">
            <div className="card-header">
              <h2 className="card-title" id="today-advice-title">
                生活の目安
              </h2>
              <span className="card-label">直近の記録から</span>
            </div>
            <AdviceList advice={advice} />
            <p className="footer-note">
              一般的な生活習慣の目安です。医療上の診断や助言ではありません。
            </p>
          </section>
        </div>

        <div className="grid-side stack">
          <section className="card" aria-labelledby="today-points-title">
            <div className="card-header">
              <h2 className="card-title" id="today-points-title">
                ポイント
              </h2>
              <Stamp tone="muted">今日 +{todayPoints}</Stamp>
            </div>
            <p className="card-label">累計</p>
            <p className="point-total">
              {total}
              <small>点</small>
            </p>
            <div className="point-row">
              <span className="card-label">{level.current.name}</span>
              <span className="card-label">
                {level.next ? `次まで ${level.toNext}点` : '最高段位'}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(level.progress * 100)}%` }}
              />
            </div>
            <div className="progress-meta">
              <span>現在 {total}点</span>
              <span>{level.next ? `${level.next.name} ${level.next.min}点` : '—'}</span>
            </div>
            <div className="badge-row">
              {badges.map((badge) => (
                <Stamp key={badge.id} tone={badge.earned ? 'accent' : 'muted'}>
                  {badge.label}
                </Stamp>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="today-disaster-title">
            <div className="card-header">
              <h2 className="card-title" id="today-disaster-title">
                防災の備え
              </h2>
              {checklist.complete ? (
                <Stamp>備え完了</Stamp>
              ) : (
                <Stamp tone="muted">{checklist.done}/5</Stamp>
              )}
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.round((checklist.done / checklist.total) * 100)}%` }}
              />
            </div>
            <p className="card-note mt-2">
              {lastWalk
                ? `最終訓練 ${formatDateJa(lastWalk.date)} / 避難所${lastWalk.destinationId} / +${lastWalk.points}点`
                : 'まだ防災さんぽの訓練がありません。'}
            </p>
            <div className="form-actions">
              <Link to="/map" className="btn btn-primary">
                防災さんぽへ
              </Link>
              <Link to="/map" className="btn btn-ghost">
                備えを確認
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
