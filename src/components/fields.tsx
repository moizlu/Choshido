import type { Condition } from '../domain/types'

interface NumberFieldProps {
  id: string
  label: string
  unit: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
  min?: number
  max?: number
  step?: number
  optional?: boolean
}

export function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  placeholder,
  hint,
  error,
  min,
  max,
  step = 1,
  optional = false,
}: NumberFieldProps) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {optional ? <span className="optional">任意</span> : null}
      </label>
      <div className={`input-shell${error ? ' is-invalid' : ''}`}>
        <input
          id={id}
          className="input input-num"
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        <span className="input-unit">{unit}</span>
      </div>
      {hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

interface TextAreaFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
  maxLength?: number
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  maxLength = 200,
}: TextAreaFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        <span className="optional">任意</span>
      </label>
      <div className={`input-shell${error ? ' is-invalid' : ''}`}>
        <textarea
          id={id}
          className="input textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
        />
      </div>
      <p className="field-hint" id={`${id}-hint`}>
        {hint ?? `${value.length} / ${maxLength}`}
      </p>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  hint?: string
  error?: string
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  error,
}: SelectFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className={`input-shell${error ? ' is-invalid' : ''}`}>
        <select
          id={id}
          className="input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

const CONDITION_WORDS = ['低い', 'やや低', '普通', '良い', 'とても良'] as const

interface ConditionPickerProps {
  value: Condition | null
  onChange: (value: Condition | null) => void
}

export function ConditionPicker({ value, onChange }: ConditionPickerProps) {
  const options: Condition[] = [1, 2, 3, 4, 5]
  return (
    <fieldset className="condition-picker">
      <legend>体調</legend>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="condition-btn"
          aria-pressed={value === option}
          onClick={() => onChange(value === option ? null : option)}
        >
          <span className="num">{option}</span>
          <span className="condition-word">{CONDITION_WORDS[option - 1]}</span>
        </button>
      ))}
    </fieldset>
  )
}
