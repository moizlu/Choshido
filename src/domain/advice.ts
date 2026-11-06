import { addDays, lastNDates, minutesSinceMidnight } from './date'
import { metricsFor } from './metrics'
import type { AppData } from './types'

export type AdviceTone = 'attention' | 'notice' | 'steady'

export interface Advice {
  id: string
  tone: AdviceTone
  title: string
  body: string
  evidence: string
}

export function buildAdvice(data: AppData, activeDate: string, now = new Date()): Advice[] {
  const advice: Advice[] = []
  const today = data.logs[activeDate]
  const yesterday = data.logs[addDays(activeDate, -1)]

  if (
    today?.condition != null &&
    today.condition <= 2 &&
    yesterday?.condition != null &&
    yesterday.condition <= 2
  ) {
    advice.push({
      id: 'condition',
      tone: 'attention',
      title: '体調を優先',
      body: '体調が低い日が続いています。今日は運動を軽めにして、睡眠を優先してください。',
      evidence: `体調 ${today.condition} / ${yesterday.condition}（2日連続）`,
    })
  }

  const recentThree = lastNDates(activeDate, 3).map((date) => data.logs[date])
  const shortSleepDays = recentThree.filter(
    (log) => log?.sleepHours != null && log.sleepHours < 6,
  ).length
  if (shortSleepDays >= 2) {
    advice.push({
      id: 'sleep',
      tone: 'attention',
      title: '睡眠を確保',
      body: '睡眠が6時間未満の日が続いています。就寝時刻を30分早めてみてください。',
      evidence: `睡眠 6時間未満 × ${shortSleepDays}日 / 直近3日`,
    })
  }

  const zeroExerciseDays = lastNDates(activeDate, 3).filter((date) => {
    const log = data.logs[date]
    return log?.exerciseMinutes === 0
  }).length
  if (zeroExerciseDays === 3) {
    advice.push({
      id: 'exercise',
      tone: 'attention',
      title: '運動を再開',
      body: '3日間、運動の記録がありません。10分の散歩から再開できます。',
      evidence: '運動 0分 × 3日',
    })
  }

  const weekWeights = lastNDates(activeDate, 7)
    .map((date) => ({ date, weight: data.logs[date]?.weightKg ?? null }))
    .filter((item): item is { date: string; weight: number } => item.weight !== null)
  if (weekWeights.length >= 2) {
    const first = weekWeights[0]
    const last = weekWeights[weekWeights.length - 1]
    if (first && last) {
      const diff = last.weight - first.weight
      if (Math.abs(diff) >= 1) {
        advice.push({
          id: 'weight',
          tone: 'notice',
          title: '体重の変化',
          body: '7日間で体重が1kg以上変動しました。体調とあわせて確認してください。',
          evidence: `体重 ${diff > 0 ? '+' : ''}${diff.toFixed(1)}kg / 7日`,
        })
      }
    }
  }

  const metrics = metricsFor(data, activeDate)
  if (metrics.bmi !== null && metrics.bmi >= 25) {
    advice.push({
      id: 'bmi',
      tone: 'notice',
      title: 'BMIの目安',
      body: 'BMIが25を超えています。月1kg程度の緩やかな変化を目安にしましょう。',
      evidence: `BMI ${metrics.bmi.toFixed(1)}（${metrics.bmiCategory?.label ?? ''}）`,
    })
  }

  if (!today && minutesSinceMidnight(now) >= 20 * 60) {
    advice.push({
      id: 'no-log',
      tone: 'notice',
      title: '記録が未入力',
      body: '今日の記録がまだです。体重・睡眠・体調だけでも残せます。',
      evidence: '20:00 時点で未記録',
    })
  }

  const trainingWindowStart = addDays(activeDate, -14)
  const hasRecentWalk = data.walks.some(
    (walk) => walk.date > trainingWindowStart && walk.date <= activeDate,
  )
  if (!hasRecentWalk) {
    advice.push({
      id: 'training',
      tone: 'notice',
      title: '防災訓練',
      body: '防災さんぽの訓練が14日間ありません。避難所までの経路を確認しましょう。',
      evidence: '散歩訓練 14日間なし',
    })
  }

  const logCount = Object.keys(data.logs).filter((date) => date <= activeDate).length
  if (logCount < 3) {
    advice.push({
      id: 'insufficient',
      tone: 'steady',
      title: 'データをためる',
      body: '3日分の記録がたまると、傾向に応じた提案が出ます。',
      evidence: `記録 ${logCount}日 / 3日`,
    })
  }

  if (advice.length === 0) {
    return [
      {
        id: 'steady',
        tone: 'steady',
        title: '記録が続いています',
        body: '睡眠と運動のバランスを保ちましょう。',
        evidence: '直近の記録に大きな変化なし',
      },
    ]
  }

  return advice.slice(0, 3)
}
