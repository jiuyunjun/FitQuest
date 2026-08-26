import { View, Text } from '@tarojs/components'
import { EXERCISES } from '../../exercise'
import type { ExerciseId } from '../../exercise/types'
import { repsToKill } from '../../game/DamageCalculator'
import { MINIMAL_QUEST_MINUTES, MINIMAL_QUEST_WEEKLY_LIMIT, STANDARD_QUEST_MINUTES } from '../../game/StreakSystem'
import { useGame } from '../../app/store'
import { PixelSprite } from '../components/PixelSprite'
import { Label, Panel, PixelButton, SegmentedBar } from '../components/Primitives'
import { C, F } from '../tokens'

export function Home({
  exercise,
  onPickExercise,
  onStart,
}: {
  exercise: ExerciseId
  onPickExercise: (id: ExerciseId) => void
  onStart: () => void
}) {
  const { boss, level, streak, today, minimalUsed } = useGame()
  const def = EXERCISES[exercise]
  const need = repsToKill(exercise, boss)
  const defeated = boss.hp <= 0
  const minutes = Math.floor(today.activeSeconds / 60)
  const lowHp = boss.hp > 0 && boss.hp / boss.maxHp <= 0.2

  return (
    <View style={{ padding: '20px 18px 28px', display: 'grid', gap: 18, alignContent: 'start' }}>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ font: `400 11px/1 ${F.pixel}`, color: C.gold }}>DAY {streak + (today.result === 'none' ? 1 : 0)}</View>
        <View style={{ font: `400 9px/1 ${F.pixel}`, color: C.muted }}>LV {level}</View>
      </View>

      <Panel accent={C.border} style={{ justifyItems: 'center', gap: 12, padding: '18px 14px' }}>
        <Label>{defeated ? '今日 BOSS · 已击败' : '今日 BOSS'}</Label>
        <PixelSprite def={boss.def} cell={10} hidden={defeated} />
        <View style={{ font: `900 17px/1.3 ${F.sans}`, color: C.text }}>{boss.def.name}</View>
        <View style={{ width: '100%' }}>
          <SegmentedBar value={boss.hp} max={boss.maxHp} color={lowHp ? C.red : '#c9634f'} height={14} blink={lowHp} />
        </View>
        <View style={{ font: `700 11px/1 ${F.mono}`, color: C.text }}>
          HP {boss.hp} / {boss.maxHp}
        </View>
        <View style={{ font: `400 11px/1.6 ${F.mono}`, color: C.muted }}>
          弱点 {boss.def.weakLabel} · 伤害 ×1.5
        </View>
      </Panel>

      <Panel>
        <Label>今日完成</Label>
        <StatRow label={`${today.reps} 次动作`} done={today.reps > 0} />
        <StatRow label={`${minutes} 分钟训练`} done={minutes > 0} />
        <StatRow
          label={`标准任务 ${STANDARD_QUEST_MINUTES} 分钟`}
          done={today.result === 'standard'}
        />
      </Panel>

      {!defeated && (
        <Panel accent={C.gold}>
          <Label color={C.gold}>推荐</Label>
          <View style={{ font: `700 15px/1.5 ${F.sans}`, color: C.text }}>
            再完成 {Number.isFinite(need) ? need : '—'} 个{def.name}
          </View>
          <View style={{ font: `400 12px/1.6 ${F.mono}`, color: C.muted }}>
            预计伤害 {boss.hp} · 可击杀
          </View>
        </Panel>
      )}

      <View style={{ display: 'grid', gap: 10 }}>
        <Label>选择攻击方式 · 目标固定，方式自由</Label>
        {(Object.values(EXERCISES)).map((e) => {
          const on = e.id === exercise
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onPickExercise(e.id)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                border: `3px solid ${on ? C.gold : C.border}`,
                background: C.raised,
                padding: '14px 16px',
                minHeight: 56,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <View style={{ display: 'grid', gap: 5 }}>
                <Text style={{ font: `700 14px/1 ${F.sans}`, color: on ? C.gold : C.text }}>
                  {e.name}
                  {boss.def.weak === e.id ? ' · 弱点' : ''}
                </Text>
                <Text style={{ font: `400 11px/1 ${F.mono}`, color: C.muted }}>
                  {e.supported ? `${e.baseDamage} DMG / 次` : '仅手动计数'}
                </Text>
              </View>
              <Text style={{ font: `400 9px/1 ${F.pixel}`, color: on ? C.gold : C.dim }}>
                {on ? '已选' : '选择'}
              </Text>
            </button>
          )
        })}
      </View>

      {today.result === 'none' && streak > 0 && (
        <Panel accent={C.goldDeep}>
          <View style={{ font: `900 16px/1.5 ${F.sans}`, color: C.text }}>今天还没有行动</View>
          <View style={{ font: `400 13px/1.8 ${F.sans}`, color: C.body }}>
            连续冒险 {streak} 天。完成最低任务（{MINIMAL_QUEST_MINUTES} 分钟）即可保住记录，奖励减少但不清零。
          </View>
          <View style={{ font: `400 11px/1 ${F.mono}`, color: C.muted }}>
            本周剩 {Math.max(0, MINIMAL_QUEST_WEEKLY_LIMIT - minimalUsed)} 次
          </View>
        </Panel>
      )}

      <PixelButton onClick={onStart} style={{ width: '100%' }}>
        {defeated ? '继续训练' : '开始战斗'}
      </PixelButton>

      <View style={{ font: `400 12px/1.7 ${F.sans}`, color: C.label, textAlign: 'center' }}>
        {def.hint}
      </View>
    </View>
  )
}

function StatRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ font: `400 13px/1.5 ${F.sans}`, color: done ? C.text : C.muted }}>{label}</Text>
      <Text style={{ color: done ? C.green : C.dim }}>{done ? '✓' : '—'}</Text>
    </View>
  )
}
