import { todayKey } from './Boss'

export const STANDARD_QUEST_MINUTES = 30
export const MINIMAL_QUEST_MINUTES = 5
export const MINIMAL_QUEST_WEEKLY_LIMIT = 3

export type DayResult = 'none' | 'minimal' | 'standard'

export interface DayRecord {
  date: string
  activeSeconds: number
  reps: number
  result: DayResult
}

export function dayResult(activeSeconds: number): DayResult {
  const minutes = activeSeconds / 60
  if (minutes >= STANDARD_QUEST_MINUTES) return 'standard'
  if (minutes >= MINIMAL_QUEST_MINUTES) return 'minimal'
  return 'none'
}

function shiftDate(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return todayKey(dt)
}

/**
 * 连续天数。今天还没完成不算断，只在“昨天没完成”时归零 —
 * 用户在当天任何时刻打开都不该看到已经被清零的记录。
 */
export function computeStreak(days: DayRecord[], today = todayKey()): number {
  const byDate = new Map(days.map((d) => [d.date, d]))
  let streak = 0
  let cursor = byDate.get(today)?.result !== 'none' && byDate.has(today) ? today : shiftDate(today, -1)
  for (;;) {
    const rec = byDate.get(cursor)
    if (!rec || rec.result === 'none') break
    streak++
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

export function minimalUsesThisWeek(days: DayRecord[], today = todayKey()): number {
  const [y, m, d] = today.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const weekday = (dt.getDay() + 6) % 7
  const monday = shiftDate(today, -weekday)
  return days.filter((r) => r.date >= monday && r.date <= today && r.result === 'minimal').length
}

export function weekRecords(days: DayRecord[], today = todayKey()): DayRecord[] {
  const [y, m, d] = today.split('-').map(Number)
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7
  const monday = shiftDate(today, -weekday)
  return Array.from({ length: 7 }, (_, i) => {
    const key = shiftDate(monday, i)
    return (
      days.find((r) => r.date === key) ?? { date: key, activeSeconds: 0, reps: 0, result: 'none' as DayResult }
    )
  })
}
