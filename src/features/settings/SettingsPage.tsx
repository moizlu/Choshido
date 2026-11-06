import { useState, type ChangeEvent } from 'react'
import { useStore } from '../../app/storeContext'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { Stamp } from '../../components/Stamp'
import { useToast } from '../../components/toastContext'
import { IconDownload, IconRefresh, IconTrash, IconUpload, IconWalk } from '../../components/icons'
import { formatDateJa } from '../../domain/date'
import { ProfileForm } from './ProfileForm'

interface ImportMessage {
  ok: boolean
  text: string
}

export function SettingsPage() {
  const store = useStore()
  const { showToast } = useToast()
  const { mode, sim, data } = store
  const [confirmText, setConfirmText] = useState('')
  const [importMessage, setImportMessage] = useState<ImportMessage | null>(null)

  const handleStartSim = () => {
    if (sim && !window.confirm('前回のシミュレーションを上書きして開始します。よろしいですか？')) {
      return
    }
    store.startSim()
    showToast('シミュレーションを開始しました')
  }

  const handleAdvance = () => {
    const next = store.advanceSimDay()
    if (next) showToast(`${formatDateJa(next)} を記録しました`)
  }

  const handleResetSim = () => {
    if (!window.confirm('シミュレーションを最初から作り直します。よろしいですか？')) return
    store.resetSim()
    showToast('シミュレーションを初期化しました')
  }

  const handleShuffle = () => {
    if (!window.confirm('別のパターンでシミュレーションを作り直します。よろしいですか？')) return
    store.shuffleSim()
    showToast('別のパターンを生成しました')
  }

  const handleEndSim = () => {
    store.endSim()
    showToast('シミュレーションを終了しました')
  }

  const handleExport = () => {
    store.exportActive()
    showToast('JSONを書き出しました')
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const text = await file.text()
    if (!window.confirm('現在のデータを置き換えます。よろしいですか？')) return
    const result = store.importActive(text)
    setImportMessage({ ok: result.ok, text: result.message })
    showToast(result.message)
  }

  const handleClear = () => {
    if (confirmText !== '削除') return
    store.clearActive()
    setConfirmText('')
    showToast(mode === 'sim' ? 'シミュレーションを削除しました' : '通常データを削除しました')
  }

  const clearLabel = mode === 'sim' ? 'シミュレーションを削除' : '通常データをすべて削除'

  return (
    <>
      <PageHeader
        eyebrow="設定 / データ"
        title="設定とデータ"
        description="プロフィール、シミュレーション、保存データを管理します。"
        actions={
          mode === 'sim' ? <Stamp tone="caution">SIM</Stamp> : <Stamp tone="muted">通常</Stamp>
        }
      />

      <div className="settings-grid">
        <section className="card" aria-labelledby="profile-settings-title">
          <div className="card-header">
            <h2 className="card-title" id="profile-settings-title">
              プロフィール
            </h2>
            <span className="card-label">
              {mode === 'sim' ? 'シミュレーション側' : '通常データ'}
            </span>
          </div>
          <ProfileForm
            key={`${mode}:${data.profile.heightCm}:${data.profile.birthYear}:${data.profile.sex}:${data.profile.activity}`}
            initial={data.profile}
            submitLabel="保存する"
            onSubmit={(profile) => {
              store.updateProfile(profile)
              showToast('プロフィールを保存しました')
            }}
          />
        </section>

        <section className="card" aria-labelledby="sim-settings-title">
          <div className="card-header">
            <h2 className="card-title" id="sim-settings-title">
              シミュレーション
            </h2>
            <span className="card-label">デモ再生</span>
          </div>

          {mode === 'sim' && sim ? (
            <div className="stack-sm">
              <p className="card-note">
                現在 <span className="num">{formatDateJa(sim.currentDate)}</span> / パターン{' '}
                <span className="num">{sim.seed}</span>
              </p>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={sim.autoWalk}
                  onChange={(event) => store.setAutoWalk(event.target.checked)}
                />
                <span className="toggle-text">
                  <strong>1日進めるときに散歩も記録する</strong>
                  <span>安全な経路で避難所まで歩きます</span>
                </span>
              </label>
              <div className="settings-row">
                <Button variant="primary" size="sm" onClick={handleAdvance}>
                  1日進める
                </Button>
                <Button size="sm" variant="ghost" onClick={handleEndSim}>
                  終了
                </Button>
              </div>
              <div className="settings-row">
                <Button size="sm" onClick={handleResetSim}>
                  <IconRefresh width={14} height={14} />
                  最初から
                </Button>
                <Button size="sm" onClick={handleShuffle}>
                  別のパターン
                </Button>
              </div>
              <p className="field-hint">
                シミュレーションの記録は通常データとは別に保存されます。終了しても通常データは変わりません。
              </p>
            </div>
          ) : (
            <div className="stack-sm">
              <p className="card-note">
                14日分のサンプル記録を生成し、日付を進めながらグラフ・段位・助言の変化を確認できます。
                通常データとは別に保存され、終了後も通常データはそのまま残ります。
              </p>
              {sim ? (
                <p className="notice">
                  前回のシミュレーションが残っています。開始すると上書きされます。
                </p>
              ) : null}
              <div className="settings-row">
                <Button variant="primary" onClick={handleStartSim}>
                  <IconWalk width={16} height={16} />
                  シミュレーションを開始
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="data-settings-title">
          <div className="card-header">
            <h2 className="card-title" id="data-settings-title">
              保存データ
            </h2>
            <span className="card-label">{mode === 'sim' ? 'SIM' : '通常'}</span>
          </div>

          <div className="settings-row">
            <Button size="sm" onClick={handleExport}>
              <IconDownload width={14} height={14} />
              JSONを書き出す
            </Button>
            <label className="btn btn-sm">
              <IconUpload width={14} height={14} />
              読み込む
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleImport}
              />
            </label>
          </div>

          {importMessage ? (
            <div
              className={`notice mt-3 ${importMessage.ok ? 'notice-accent' : 'notice-warning'}`}
              role="status"
            >
              {importMessage.text}
            </div>
          ) : null}

          <p className="card-note mt-3">
            書き出しは現在のモードのデータのみです。読み込みはファイルのモードに合わせて切り替わります。
          </p>

          <div className="danger-zone mt-4">
            <h3>{clearLabel}</h3>
            <p className="field-hint mt-1">
              確認のため「削除」と入力してください。この操作は元に戻せません。
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="input-shell" style={{ maxWidth: 160 }}>
                <input
                  className="input"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  placeholder="削除"
                  aria-label="削除の確認入力"
                />
              </div>
              <Button
                size="sm"
                variant="danger"
                disabled={confirmText !== '削除'}
                onClick={handleClear}
              >
                <IconTrash width={14} height={14} />
                {clearLabel}
              </Button>
            </div>
          </div>

          {store.storageError ? (
            <div className="notice notice-warning mt-3" role="alert">
              {store.storageError}
            </div>
          ) : null}
        </section>

        <section className="card" aria-labelledby="about-title">
          <div className="card-header">
            <h2 className="card-title" id="about-title">
              このアプリについて
            </h2>
            <span className="card-label">v0.1.0</span>
          </div>
          <ul className="stack-sm card-note">
            <li>健康データは手入力です。HealthKit・Google Fitなどとの連携はありません。</li>
            <li>データはこのブラウザ内にだけ保存され、外部に送信されません。</li>
            <li>
              表示されるBMI・基礎代謝・助言は一般的な目安で、医療上の診断や助言ではありません。
            </li>
            <li>防災マップはデモ用の架空の街です。実際の避難経路・ハザード情報ではありません。</li>
            <li>ブラウザのデータ消去や端末の変更に備え、JSONの書き出しを利用してください。</li>
          </ul>
        </section>
      </div>
    </>
  )
}
