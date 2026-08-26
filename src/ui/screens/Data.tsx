import { View, Text } from '@tarojs/components'
import { useGame } from '../../app/store'
import { EXERCISES } from '../../exercise'
import { STANDARD_QUEST_MINUTES, weekRecords } from '../../game/StreakSystem'
import { Label, Row } from '../components/Primitives'
import { C, F } from '../tokens'

const WEEKLY_TARGET_MINUTES = 210
const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export function Data() {
  const { state, streak } = useGame()
  const week = weekRecords(state.days)
  const weekMinutes = Math.floor(week.reduce((a, d) => a + d.activeSeconds, 0) / 60)
  const maxMinutes = Math.max(STANDARD_QUEST_MINUTES, ...week.map((d) => d.activeSeconds / 60))
  const bossKills = state.sessions.filter((s) => s.bossKilled).length
  const avgReps =
    state.sessions.length > 0
      ? Math.round(state.sessions.reduce((a, s) => a + s.reps, 0) / state.sessions.length)
      : 0

  return (
    <View style={{ padding: '20px 18px 28px', display: 'grid', gap: 20, alignContent: 'start' }}>
      <View style={{ font: `400 11px/1 ${F.pixel}`, color: C.gold }}>本周</View>

      <View style={{ border: `3px solid ${C.border}`, background: C.panel, padding: 18, display: 'grid', gap: 14 }}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ font: `400 9px/1 ${F.pixel}`, color: C.gold }}>FITNESS BANK</Text>
          <Text style={{ font: `700 12px/1 ${F.mono}`, color: C.text }}>
            {weekMinutes} / {WEEKLY_TARGET_MINUTES} min
          </Text>
        </View>
        <View style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 88 }}>
          {week.map((d, i) => {
            const minutes = d.activeSeconds / 60
            const h = Math.max(6, Math.round((minutes / maxMinutes) * 80))
            const color = d.result === 'minimal' ? C.green : d.result === 'standard' ? C.gold : C.line
            return (
              <View key={d.date} style={{ flex: 1, display: 'grid', gap: 6, justifyItems: 'center' }}>
                <View style={{ width: '100%', height: h, background: color }} />
                <Text style={{ font: `400 8px/1 ${F.pixel}`, color: C.label }}>{DAY_LABELS[i]}</Text>
              </View>
            )
          })}
        </View>
        <View style={{ font: `400 11px/1.6 ${F.mono}`, color: C.muted }}>
          绿柱 = 最低任务保住的一天 · 允许跨天抵消
        </View>
      </View>

      <View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Tile label="SESSIONS" value={state.sessions.length} />
        <Tile label="BOSS KILL" value={bossKills} />
        <Tile label="AVG REPS" value={avgReps} />
        <Tile label="STREAK" value={streak} color={C.gold} />
      </View>

      <View style={{ display: 'grid', gap: 10 }}>
        <Label>最近训练</Label>
        {state.sessions.length === 0 && (
          <View style={{ font: `400 13px/1.8 ${F.sans}`, color: C.muted }}>
            还没有记录。完成一次训练后会出现在这里。
          </View>
        )}
        {state.sessions.slice(0, 12).map((s) => (
          <Row
            key={s.id}
            left={
              <View style={{ display: 'grid', gap: 5 }}>
                <View style={{ font: `700 13px/1 ${F.sans}`, color: C.text }}>
                  {EXERCISES[s.exercise].name} · {s.reps} 次
                </View>
                <View style={{ font: `400 10px/1 ${F.mono}`, color: C.muted }}>
                  {s.date.slice(5)} · {s.durationSeconds}s · Q {s.quality || '—'}
                  {s.bossKilled ? ' · 击杀' : ''}
                </View>
              </View>
            }
            right={<View style={{ font: `400 9px/1 ${F.pixel}`, color: C.gold }}>+{s.xp} XP</View>}
          />
        ))}
        <View style={{ font: `400 12px/1.7 ${F.sans}`, color: C.muted }}>
          历史只显示行为与奖励，不显示卡路里。
        </View>
      </View>
    </View>
  )
}

function Tile({ label, value, color = C.text }: { label: string; value: number; color?: string }) {
  return (
    <View style={{ border: `2px solid ${C.line}`, background: C.raised, padding: 14, display: 'grid', gap: 8 }}>
      <Text style={{ font: `400 8px/1 ${F.pixel}`, color: C.label }}>{label}</Text>
      <Text style={{ font: `400 20px/1 ${F.pixel}`, color }}>{value}</Text>
    </View>
  )
}
