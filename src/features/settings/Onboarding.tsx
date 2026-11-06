import { useStore } from '../../app/storeContext'
import { Stamp } from '../../components/Stamp'
import { ProfileForm } from './ProfileForm'

export function Onboarding() {
  const store = useStore()

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-brand">
          <div>
            <h1 className="onboarding-title">調知堂</h1>
            <p className="onboarding-lead">からだの記録と、防災の備え。</p>
          </div>
          <Stamp tone="muted">はじめに</Stamp>
        </div>

        <p className="onboarding-lead">
          毎日の体重・睡眠・運動・体調を記録し、生活の目安と防災訓練をひとつにまとめます。
          データはこの端末のブラウザ内にだけ保存され、外部には送信しません。
        </p>

        <div className="my-4 grid gap-2">
          <div className="notice">
            <strong>記録</strong> 1日1項目から。続けると段位と連続記録が伸びます。
          </div>
          <div className="notice">
            <strong>防災</strong> 架空の街で避難所までの経路を確認する訓練です。
          </div>
          <div className="notice">
            <strong>目安</strong> 医療上の診断や助言ではありません。
          </div>
        </div>

        <ProfileForm
          initial={store.data.profile}
          submitLabel="はじめる"
          onSubmit={(profile) => store.completeOnboarding(profile)}
          onSkip={() => store.completeOnboarding(null)}
          skipLabel="あとで設定する"
        />

        <p className="footer-note">
          入力した内容はJSONで書き出せます。ブラウザのデータ消去にはご注意ください。
        </p>
      </div>
    </div>
  )
}
