import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatMonthDay } from '../../domain/date'
import type { DailyLog } from '../../domain/types'

const HEIGHT = 160
const MARGIN = { top: 14, right: 10, bottom: 22, left: 36 }

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setWidth(Math.max(240, element.clientWidth))
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, width }
}

function xLabels(dates: string[], width: number): { index: number; label: string }[] {
  if (dates.length === 0 || width < 200) return []
  const indexes = new Set<number>([0, Math.floor(dates.length / 2), dates.length - 1])
  return [...indexes]
    .sort((a, b) => a - b)
    .map((index) => ({ index, label: formatMonthDay(dates[index] ?? dates[0] ?? '') }))
}

interface ChartCardProps {
  title: string
  hint: string
  summary: string
  empty: boolean
  emptyText: string
  children: (width: number) => ReactNode
}

function ChartCard({ title, hint, summary, empty, emptyText, children }: ChartCardProps) {
  const { ref, width } = useWidth()
  return (
    <section className="card chart-frame">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <span className="card-label">{hint}</span>
      </div>
      <div ref={ref}>
        {empty ? <div className="chart-empty">{emptyText}</div> : children(width)}
      </div>
      <p className="chart-summary">{summary}</p>
    </section>
  )
}

interface WeightChartProps {
  dates: string[]
  logs: Record<string, DailyLog>
}

export function WeightChart({ dates, logs }: WeightChartProps) {
  const values = dates.map((date) => logs[date]?.weightKg ?? null)
  const present = values.filter((value): value is number => value !== null)
  const last = present[present.length - 1]
  const first = present[0]
  const summary =
    present.length >= 2 && first !== undefined && last !== undefined
      ? `体重 ${first.toFixed(1)}kg → ${last.toFixed(1)}kg（${dates.length}日）`
      : present.length === 1
        ? `体重 ${present[0]?.toFixed(1)}kg（記録1件）`
        : '体重の記録がありません。'

  return (
    <ChartCard
      title="体重"
      hint={`${dates.length}日`}
      summary={summary}
      empty={present.length === 0}
      emptyText="体重を記録すると折れ線が表示されます。"
    >
      {(width) => {
        const plotWidth = width - MARGIN.left - MARGIN.right
        const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
        const min = Math.min(...present) - 0.5
        const max = Math.max(...present) + 0.5
        const span = Math.max(1, max - min)
        const xFor = (index: number) =>
          dates.length <= 1
            ? MARGIN.left + plotWidth / 2
            : MARGIN.left + (index / (dates.length - 1)) * plotWidth
        const yFor = (value: number) =>
          MARGIN.top + plotHeight - ((value - min) / span) * plotHeight

        const points = values.map((value, index) =>
          value === null ? null : { x: xFor(index), y: yFor(value), value, index },
        )
        const segments: { x: number; y: number }[][] = []
        let current: { x: number; y: number }[] = []
        for (const point of points) {
          if (!point) {
            if (current.length > 0) segments.push(current)
            current = []
            continue
          }
          current.push({ x: point.x, y: point.y })
        }
        if (current.length > 0) segments.push(current)

        return (
          <svg
            className="chart-svg"
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            aria-hidden="true"
          >
            <text className="chart-axis" x={0} y={MARGIN.top + 4}>
              {max.toFixed(1)}
            </text>
            <text className="chart-axis" x={0} y={HEIGHT - MARGIN.bottom}>
              {min.toFixed(1)}
            </text>
            {segments.map((segment, index) =>
              segment.length > 1 ? (
                <polyline
                  key={`segment-${index}`}
                  className="chart-line"
                  points={segment.map((point) => `${point.x},${point.y}`).join(' ')}
                />
              ) : null,
            )}
            {points.map((point, index) =>
              point ? (
                <circle key={`dot-${index}`} className="chart-dot" cx={point.x} cy={point.y} r={3}>
                  <title>
                    {formatMonthDay(dates[index] ?? '')} {point.value.toFixed(1)}kg
                  </title>
                </circle>
              ) : null,
            )}
            {xLabels(dates, width).map((label) => (
              <text
                key={label.index}
                className="chart-axis"
                x={xFor(label.index)}
                y={HEIGHT - 4}
                textAnchor="middle"
              >
                {label.label}
              </text>
            ))}
          </svg>
        )
      }}
    </ChartCard>
  )
}

interface BarChartProps {
  dates: string[]
  values: (number | null)[]
  target: number
  lowThreshold?: number
  unit: string
  title: string
  hint: string
  summary: string
  emptyText: string
  targetLabel: string
}

function BarChart({
  dates,
  values,
  target,
  lowThreshold = target,
  unit,
  title,
  hint,
  summary,
  emptyText,
  targetLabel,
}: BarChartProps) {
  const present = values.filter((value): value is number => value !== null)
  return (
    <ChartCard
      title={title}
      hint={hint}
      summary={summary}
      empty={present.length === 0}
      emptyText={emptyText}
    >
      {(width) => {
        const plotWidth = width - MARGIN.left - MARGIN.right
        const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
        const max = Math.max(target * 1.3, ...present, 1)
        const yFor = (value: number) => MARGIN.top + plotHeight - (value / max) * plotHeight
        const step = dates.length > 0 ? plotWidth / dates.length : plotWidth
        const barWidth = Math.max(2, step * 0.55)
        const xFor = (index: number) => MARGIN.left + step * index + step / 2

        return (
          <svg
            className="chart-svg"
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            aria-hidden="true"
          >
            <text className="chart-axis" x={0} y={MARGIN.top + 4}>
              {Math.round(max)}
            </text>
            <text className="chart-axis" x={0} y={HEIGHT - MARGIN.bottom}>
              0
            </text>
            <line
              className="chart-target"
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={yFor(target)}
              y2={yFor(target)}
            />
            <text
              className="chart-target-label"
              x={width - MARGIN.right}
              y={yFor(target) - 3}
              textAnchor="end"
            >
              {targetLabel}
            </text>
            {values.map((value, index) => {
              if (value === null) return null
              const barHeight = value === 0 ? 2 : Math.max(2, yFor(0) - yFor(value))
              const className =
                value === 0
                  ? 'chart-bar-zero'
                  : value < lowThreshold
                    ? 'chart-bar-low'
                    : 'chart-bar'
              return (
                <rect
                  key={`bar-${index}`}
                  className={className}
                  x={xFor(index) - barWidth / 2}
                  y={yFor(0) - barHeight}
                  width={barWidth}
                  height={barHeight}
                >
                  <title>
                    {formatMonthDay(dates[index] ?? '')} {value}
                    {unit}
                  </title>
                </rect>
              )
            })}
            {xLabels(dates, width).map((label) => (
              <text
                key={label.index}
                className="chart-axis"
                x={xFor(label.index)}
                y={HEIGHT - 4}
                textAnchor="middle"
              >
                {label.label}
              </text>
            ))}
          </svg>
        )
      }}
    </ChartCard>
  )
}

interface SleepChartProps {
  dates: string[]
  logs: Record<string, DailyLog>
}

export function SleepChart({ dates, logs }: SleepChartProps) {
  const values = dates.map((date) => logs[date]?.sleepHours ?? null)
  const present = values.filter((value): value is number => value !== null)
  const average =
    present.length > 0 ? present.reduce((sum, value) => sum + value, 0) / present.length : 0
  const short = present.filter((value) => value < 6).length
  return (
    <BarChart
      dates={dates}
      title="睡眠"
      hint={`${dates.length}日`}
      values={values}
      target={7}
      lowThreshold={6}
      targetLabel="7時間"
      unit="時間"
      summary={
        present.length > 0
          ? `平均 ${average.toFixed(1)}時間 / 6時間未満 ${short}日`
          : '睡眠の記録がありません。'
      }
      emptyText="睡眠を記録すると棒グラフが表示されます。"
    />
  )
}

interface ExerciseChartProps {
  dates: string[]
  logs: Record<string, DailyLog>
}

export function ExerciseChart({ dates, logs }: ExerciseChartProps) {
  const values = dates.map((date) => logs[date]?.exerciseMinutes ?? null)
  const present = values.filter((value): value is number => value !== null)
  const total = present.reduce((sum, value) => sum + value, 0)
  const activeDays = present.filter((value) => value > 0).length
  return (
    <BarChart
      dates={dates}
      title="運動"
      hint={`${dates.length}日`}
      values={values}
      target={20}
      targetLabel="20分"
      unit="分"
      summary={
        present.length > 0
          ? `合計 ${total}分 / 運動した日 ${activeDays}日`
          : '運動の記録がありません。'
      }
      emptyText="運動を記録すると棒グラフが表示されます。"
    />
  )
}

interface ConditionStripProps {
  dates: string[]
  logs: Record<string, DailyLog>
}

export function ConditionStrip({ dates, logs }: ConditionStripProps) {
  const levels = dates.map((date) => logs[date]?.condition ?? null)
  const present = levels.filter((level): level is 1 | 2 | 3 | 4 | 5 => level !== null)
  const average =
    present.length > 0 ? present.reduce((sum, level) => sum + level, 0) / present.length : 0

  return (
    <section className="card">
      <div className="card-header">
        <h3 className="card-title">体調</h3>
        <span className="card-label">{dates.length}日</span>
      </div>
      <ol className="condition-strip">
        {dates.map((date, index) => {
          const level = levels[index]
          return (
            <li
              key={date}
              className="condition-cell"
              data-level={level ?? 'none'}
              title={`${formatMonthDay(date)} ${level ? `体調${level}` : '記録なし'}`}
              aria-label={`${formatMonthDay(date)} ${level ? `体調${level}` : '記録なし'}`}
            >
              {level ?? '·'}
            </li>
          )
        })}
      </ol>
      <div className="condition-legend">
        <span>1 低い</span>
        <span>{present.length > 0 ? `平均 ${average.toFixed(1)} / 5` : '記録がありません'}</span>
        <span>5 良い</span>
      </div>
    </section>
  )
}
