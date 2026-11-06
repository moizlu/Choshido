import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { NumberField, SelectField } from '../../components/fields'
import type { Activity, Profile, Sex } from '../../domain/types'

interface ProfileFormProps {
  initial: Profile
  submitLabel: string
  onSubmit: (profile: Profile) => void
  onSkip?: () => void
  skipLabel?: string
}

interface ProfileErrors {
  height?: string
  birthYear?: string
}

const CURRENT_YEAR = new Date().getFullYear()

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onSkip,
  skipLabel = 'あとで設定する',
}: ProfileFormProps) {
  const [height, setHeight] = useState(initial.heightCm !== null ? String(initial.heightCm) : '')
  const [birthYear, setBirthYear] = useState(
    initial.birthYear !== null ? String(initial.birthYear) : '',
  )
  const [sex, setSex] = useState<Sex>(initial.sex)
  const [activity, setActivity] = useState<Activity>(initial.activity)
  const [errors, setErrors] = useState<ProfileErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: ProfileErrors = {}
    const heightValue = parseOptionalNumber(height)
    const birthYearValue = parseOptionalNumber(birthYear)

    if (heightValue !== null && (heightValue < 100 || heightValue > 250)) {
      nextErrors.height = '100〜250cmの範囲で入力してください。'
    }
    if (
      birthYearValue !== null &&
      (!Number.isInteger(birthYearValue) ||
        birthYearValue < 1900 ||
        birthYearValue > CURRENT_YEAR - 10)
    ) {
      nextErrors.birthYear = `1900〜${CURRENT_YEAR - 10}年の範囲で入力してください。`
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      heightCm: heightValue,
      birthYear: birthYearValue,
      sex,
      activity,
    })
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <div className="form-grid form-grid-2">
        <NumberField
          id="profile-height"
          label="身長"
          unit="cm"
          value={height}
          onChange={setHeight}
          placeholder="170"
          min={100}
          max={250}
          step={1}
          error={errors.height}
          hint="BMIと標準体重に使用します。"
        />
        <NumberField
          id="profile-birth-year"
          label="生年"
          unit="年"
          value={birthYear}
          onChange={setBirthYear}
          placeholder="1990"
          min={1900}
          max={CURRENT_YEAR - 10}
          step={1}
          error={errors.birthYear}
          hint="年齢の計算に使用します。"
        />
        <SelectField
          id="profile-sex"
          label="性別"
          value={sex}
          onChange={(value) => setSex(value as Sex)}
          options={[
            { value: 'unspecified', label: '未設定' },
            { value: 'male', label: '男性' },
            { value: 'female', label: '女性' },
          ]}
          hint="基礎代謝の計算にのみ使用します。"
        />
        <SelectField
          id="profile-activity"
          label="活動量"
          value={activity}
          onChange={(value) => setActivity(value as Activity)}
          options={[
            { value: 'low', label: '低い（デスクワーク中心）' },
            { value: 'normal', label: '普通（通学・軽い運動）' },
            { value: 'high', label: '高い（運動習慣あり）' },
          ]}
          hint="推定消費量の計算に使用します。"
        />
      </div>

      <p className="field-hint">
        身長・生年・性別が未設定でも記録は使えます。設定するとBMI・基礎代謝が表示されます。
      </p>

      <div className="form-actions">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        {onSkip ? (
          <Button type="button" variant="ghost" onClick={onSkip}>
            {skipLabel}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
