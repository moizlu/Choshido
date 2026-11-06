import { useState, type FormEvent } from 'react'
import { ConditionPicker, NumberField, TextAreaField } from '../../components/fields'
import { Button } from '../../components/Button'
import type { Condition, DailyLog, LogInput } from '../../domain/types'

interface LogFormProps {
  date: string
  initial?: DailyLog
  onSubmit: (input: LogInput) => void
  onDelete?: () => void
}

interface FormErrors {
  weight?: string
  sleep?: string
  exercise?: string
  general?: string
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function LogForm({ date, initial, onSubmit, onDelete }: LogFormProps) {
  const [weight, setWeight] = useState(initial?.weightKg != null ? String(initial.weightKg) : '')
  const [sleep, setSleep] = useState(initial?.sleepHours != null ? String(initial.sleepHours) : '')
  const [exercise, setExercise] = useState(
    initial?.exerciseMinutes != null ? String(initial.exerciseMinutes) : '',
  )
  const [condition, setCondition] = useState<Condition | null>(initial?.condition ?? null)
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    const weightValue = toNumber(weight)
    const sleepValue = toNumber(sleep)
    const exerciseValue = toNumber(exercise)

    if (weightValue !== null && (weightValue < 20 || weightValue > 300)) {
      nextErrors.weight = '20〜300kgの範囲で入力してください。'
    }
    if (sleepValue !== null && (sleepValue < 0 || sleepValue > 24)) {
      nextErrors.sleep = '0〜24時間の範囲で入力してください。'
    }
    if (exerciseValue !== null && (exerciseValue < 0 || exerciseValue > 600)) {
      nextErrors.exercise = '0〜600分の範囲で入力してください。'
    }
    if (
      weightValue === null &&
      sleepValue === null &&
      exerciseValue === null &&
      condition === null
    ) {
      nextErrors.general = '体重・睡眠・運動・体調のいずれかを入力してください。'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      date,
      weightKg: weightValue,
      sleepHours: sleepValue,
      exerciseMinutes: exerciseValue,
      condition,
      memo: memo.trim(),
    })
  }

  const handleDelete = () => {
    if (!onDelete) return
    if (window.confirm('この日の記録を削除しますか？ 獲得済みの点数は戻りません。')) {
      onDelete()
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField
          id={`weight-${date}`}
          label="体重"
          unit="kg"
          value={weight}
          onChange={setWeight}
          placeholder="68.0"
          min={20}
          max={300}
          step={0.1}
          error={errors.weight}
          optional
        />
        <NumberField
          id={`sleep-${date}`}
          label="睡眠"
          unit="時間"
          value={sleep}
          onChange={setSleep}
          placeholder="7.0"
          min={0}
          max={24}
          step={0.5}
          error={errors.sleep}
          optional
        />
        <NumberField
          id={`exercise-${date}`}
          label="運動"
          unit="分"
          value={exercise}
          onChange={setExercise}
          placeholder="20"
          min={0}
          max={600}
          step={5}
          error={errors.exercise}
          optional
        />
      </div>

      <ConditionPicker value={condition} onChange={setCondition} />

      <TextAreaField
        id={`memo-${date}`}
        label="メモ"
        value={memo}
        onChange={setMemo}
        placeholder="体調や気づいたこと"
        maxLength={200}
      />

      {errors.general ? (
        <p className="field-error" role="alert">
          {errors.general}
        </p>
      ) : null}

      <div className="form-actions">
        <Button type="submit" variant="primary">
          {initial ? '更新する' : '記録する'}
        </Button>
        {onDelete ? (
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            記録を削除
          </Button>
        ) : null}
        <span className="field-hint">保存すると1日1回 +10点</span>
      </div>
    </form>
  )
}
