import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { useGame } from '../../app/store'
import { EXERCISES } from '../../exercise'
import { CHEST_BASE_XP, TIERS, type LootTier } from '../../game/Loot'
import { PixelSprite } from '../components/PixelSprite'
import { Label, Panel, PixelButton, SolidBar } from '../components/Primitives'
import { C, F } from '../tokens'

export function Victory({ onBack }: { onBack: () => void }) {
  const { lastResult, boss, level, xpInto, xpNeed, streak, state, openChest } = useGame()
  const [chest, setChest] = useState<LootTier | null>(null)
  const [showTable, setShowTable] = useState(false)

  if (!lastResult) {
    return (
      <View style={{ padding: 24 }}>
        <PixelButton onClick={onBack}>返回冒险</PixelButton>
      </View>
    )
  }

  const killed = lastResult.bossKilled
  const def = EXERCISES[lastResult.exercise]
  const mm = Math.floor(lastResult.durationSeconds / 60)
  const ss = lastResult.durationSeconds % 60

  return (
    <View style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%' }}>
      <View style={{ padding: '24px 18px', overflowY: 'auto', display: 'grid', gap: 18, alignContent: 'start', justifyItems: 'center' }}>
        <View style={{ font: `400 16px/1.6 ${F.pixel}`, color: killed ? C.gold : C.green, textAlign: 'center' }}>
          {killed ? (
            <>
              <View>BOSS</View>
              <View>DEFEATED</View>
            </>
          ) : (
            <>
              <View>SESSION</View>
              <View>CLEAR</View>
            </>
          )}
        </View>

        <PixelSprite def={boss.def} cell={9} hidden={killed} />

        <View style={{ font: `900 18px/1.4 ${F.sans}`, color: C.text, textAlign: 'center' }}>
          {killed ? `${boss.def.name} 已击败` : `${boss.def.name} 剩余 ${boss.hp} HP`}
        </View>

        <Panel style={{ alignSelf: 'stretch', border: `2px solid ${C.line}` }}>
          <Stat label={def.name} value={`${lastResult.reps} 次`} />
          <Stat label="时长" value={`${mm}m ${ss}s`} />
          <Stat label="造成伤害" value={`${lastResult.damage}`} />
          <Stat label="平均质量" value={`${lastResult.quality || '—'}`} color={C.green} />
        </Panel>

        <View style={{ alignSelf: 'stretch', display: 'grid', gap: 10 }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ font: `400 9px/1 ${F.pixel}`, color: C.green }}>XP · LV {level}</Text>
            <Text style={{ font: `700 12px/1 ${F.mono}`, color: C.text }}>+{lastResult.xp}</Text>
          </View>
          <SolidBar value={xpInto} max={xpNeed} color={C.green} />
          <View style={{ font: `400 11px/1 ${F.mono}`, color: C.muted }}>
            {xpInto} / {xpNeed}
          </View>
        </View>

        <View
          style={{
            alignSelf: 'stretch',
            border: `2px solid ${C.goldDeep}`,
            background: C.panel,
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ font: `400 9px/1 ${F.pixel}`, color: C.gold }}>STREAK</Text>
          <Text style={{ font: `400 14px/1 ${F.pixel}`, color: C.text }}>{streak} 天</Text>
        </View>

        {state.pendingChests > 0 && (
          <View style={{ alignSelf: 'stretch', display: 'grid', gap: 12, justifyItems: 'center', border: `3px solid ${chest?.border ?? C.border}`, background: C.panel, padding: 20 }}>
            <Label color={C.gold}>CHEST · 开箱</Label>
            <View
              style={{
                border: `3px solid ${chest?.border ?? C.border}`,
                background: C.raised,
                width: 120,
                height: 120,
                display: 'grid',
                placeItems: 'center',
                gap: 10,
                padding: 12,
              }}
            >
              <View style={{ width: 40, height: 40, background: chest?.border ?? C.border }} />
              <View style={{ font: `400 9px/1.5 ${F.pixel}`, color: C.text, textAlign: 'center' }}>
                {chest ? chest.label : '未开启'}
              </View>
            </View>
            <View style={{ font: `400 12px/1.6 ${F.mono}`, color: C.muted, textAlign: 'center', minHeight: 32 }}>
              {chest ? chest.note : `概率公开 · 保底 11 次必出金 · 任何结果 +${CHEST_BASE_XP} XP`}
            </View>
            {!chest && (
              <PixelButton size={11} onClick={() => setChest(openChest())}>
                开启宝箱
              </PixelButton>
            )}
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              style={{ background: 'none', border: 'none', color: C.muted, font: `400 12px/1.6 ${F.sans}`, cursor: 'pointer' }}
            >
              {showTable ? '收起概率' : '查看掉落概率'}
            </button>
            {showTable && (
              <View style={{ alignSelf: 'stretch', display: 'grid', gap: 8 }}>
                {TIERS.map((t) => (
                  <View
                    key={t.tier}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      border: `2px solid ${t.border}`,
                      background: C.raised,
                      padding: '10px 12px',
                    }}
                  >
                    <View style={{ width: 12, height: 12, background: t.border }} />
                    <Text style={{ font: `400 9px/1 ${F.pixel}`, color: C.text, flex: 1 }}>{t.tier}</Text>
                    <Text style={{ font: `700 12px/1 ${F.mono}`, color: C.muted }}>
                      {Math.round(t.rate * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={{ padding: 16, borderTop: `3px solid ${C.border}`, background: C.raised }}>
        <PixelButton variant="secondary" size={10} onClick={onBack} style={{ width: '100%' }}>
          返回冒险
        </PixelButton>
      </View>
    </View>
  )
}

function Stat({ label, value, color = C.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ font: `400 13px/1.5 ${F.sans}`, color: C.body }}>{label}</Text>
      <Text style={{ font: `700 13px/1.5 ${F.mono}`, color }}>{value}</Text>
    </View>
  )
}
