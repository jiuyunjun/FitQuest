import { View, Text } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../app/store'
import { useTraining, type RepDiagnostic } from '../../app/useTraining'
import { EXERCISES, qualityTier } from '../../exercise'
import type { DetectorDebug, ExerciseId } from '../../exercise/types'
import { repsToKill } from '../../game/DamageCalculator'
import type { SensorSample } from '../../sensor/SensorAdapter'
import { PixelSprite } from '../components/PixelSprite'
import { Label, PixelButton, SegmentedBar } from '../components/Primitives'
import { C, F } from '../tokens'

export function Battle({
  exercise,
  onFinish,
  onAbort,
}: {
  exercise: ExerciseId
  onFinish: () => void
  onAbort: () => void
}) {
  const { boss, commitSession } = useGame()
  const t = useTraining(exercise, boss)
  const def = EXERCISES[exercise]
  const [started, setStarted] = useState(false)
  const committed = useRef(false)

  useEffect(() => {
    if (!started) {
      setStarted(true)
      void t.start()
    }
  }, [started, t])

  const finish = () => {
    if (committed.current) return
    committed.current = true
    t.stop()
    commitSession({
      exercise,
      reps: t.reps,
      durationSeconds: t.elapsed,
      quality: t.avgQuality,
      damage: t.damageDealt,
    })
    onFinish()
  }

  // Boss 归零立即结算，不让用户空打。
  useEffect(() => {
    if (t.reps > 0 && t.bossHpNow <= 0) {
      // 裸 setTimeout：小程序运行时没有 window。
      const id = setTimeout(finish, 700)
      return () => clearTimeout(id)
    }
    return undefined
  })

  const remaining = t.bossHpNow
  const lowHp = remaining > 0 && remaining / boss.maxHp <= 0.2
  const needMore = repsToKill(exercise, { ...boss, hp: remaining })
  const manual = t.status === 'denied' || t.status === 'manual' || !def.supported

  return (
    <View style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
      <View>
        <SensorBar status={t.status} hz={t.hz} exercise={def.en} />
        {t.sample && <AxisReadout s={t.sample} />}
        {t.detail && <DetectorReadout state={t.detail.state} d={t.detail.d} />}
        {t.lastRep && <RepDiagnosticReadout r={t.lastRep} />}
      </View>

      <View style={{ padding: '20px 18px', overflowY: 'auto', display: 'grid', gap: 20, alignContent: 'start' }}>
        <View style={{ display: 'grid', gap: 10 }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ font: `400 9px/1 ${F.pixel}`, color: C.red }}>BOSS HP</Text>
            <Text style={{ font: `700 12px/1 ${F.mono}`, color: C.text }}>
              {remaining} / {boss.maxHp}
            </Text>
          </View>
          <SegmentedBar value={remaining} max={boss.maxHp} color={lowHp ? C.red : '#c9634f'} blink={lowHp} />
        </View>

        <View style={{ display: 'grid', justifyItems: 'center', gap: 10, position: 'relative', minHeight: 150 }}>
          <PixelSprite
            def={boss.def}
            cell={12}
            animate={t.hits.length > 0 ? 'shake' : undefined}
            hidden={remaining <= 0}
          />
          <View style={{ position: 'absolute', top: 0, display: 'grid', justifyItems: 'center', gap: 4, pointerEvents: 'none' }}>
            {t.hits.map((h) => (
              <View key={h.id} style={{ animation: 'fq-float 0.9s steps(6,end) forwards', display: 'grid', justifyItems: 'center', gap: 4 }}>
                <View style={{ font: `400 22px/1 ${F.pixel}`, color: h.damage > 0 ? C.red : C.dim }}>
                  {h.damage > 0 ? `-${h.damage}` : 'MISS'}
                </View>
                {h.critical && <View style={{ font: `400 11px/1 ${F.pixel}`, color: C.gold }}>CRITICAL!</View>}
                {h.weakness && h.damage > 0 && (
                  <View style={{ font: `400 10px/1 ${F.pixel}`, color: C.green }}>WEAKNESS</View>
                )}
              </View>
            ))}
          </View>
          {remaining <= 0 && (
            <View style={{ font: `400 14px/1.6 ${F.pixel}`, color: C.gold, textAlign: 'center' }}>
              <View>BOSS</View>
              <View>DEFEATED</View>
            </View>
          )}
        </View>

        <View
          style={{
            display: 'grid',
            gap: 10,
            justifyItems: 'center',
            border: `3px solid ${C.border}`,
            background: C.panel,
            padding: 20,
          }}
        >
          <Label>REPS</Label>
          <View style={{ font: `400 40px/1 ${F.pixel}`, color: C.text }}>{t.reps}</View>
          <View style={{ alignSelf: 'stretch' }}>
            <SegmentedBar value={t.phaseProgress} max={1} segments={12} color={C.green} height={10} />
          </View>
          <View style={{ font: `400 11px/1.6 ${F.mono}`, color: C.muted, textAlign: 'center' }}>
            {def.name} · {t.elapsed}s · 平均质量 {t.avgQuality || '—'}
          </View>
          {t.hits.length > 0 && (
            <View style={{ font: `400 9px/1 ${F.pixel}`, color: C.gold }}>
              {qualityTier(t.hits[t.hits.length - 1].quality)}
            </View>
          )}
        </View>

        {manual && (
          <View style={{ border: `3px solid ${C.redDeep}`, background: C.panelAlt, padding: 18, display: 'grid', gap: 12 }}>
            <Label color={C.red}>手动计数降级</Label>
            <View style={{ font: `400 13px/1.8 ${F.sans}`, color: C.body }}>
              {def.supported
                ? '没有拿到运动传感器权限。可以手动记录，奖励规则不变。'
                : `${def.name}在 MVP 的手机位置下无法可靠识别，只提供手动计数。`}
            </View>
            <PixelButton variant="secondary" onClick={t.manualRep} style={{ width: '100%' }}>
              记一次{def.name}
            </PixelButton>
          </View>
        )}
      </View>

      <View style={{ padding: 16, borderTop: `3px solid ${C.border}`, background: C.raised, display: 'grid', gap: 10 }}>
        <View style={{ font: `400 12px/1.6 ${F.sans}`, color: C.text, textAlign: 'center' }}>
          {remaining <= 0
            ? '结算中…'
            : Number.isFinite(needMore)
              ? `再做 ${needMore} 个即可击杀`
              : '继续训练'}
        </View>
        <PixelButton variant="danger" size={10} onClick={t.reps > 0 ? finish : onAbort} style={{ width: '100%' }}>
          {t.reps > 0 ? '结束训练' : '放弃训练'}
        </PixelButton>
      </View>
    </View>
  )
}

/**
 * 真机标定面板，只在 debug 模式出现（小程序编译模式「传感器标定」/ H5 ?debug=1）。
 *
 * 要看的是 |a|：状态机吃的就是这个三轴合成模长。
 * 手机静止时它应该稳定在 9.8 附近 —— 偏到 1.0 左右说明微信给的 g
 * 没被换算成 m/s²（`WeappSensorAdapter` 的 G 常量），那才是会毁掉计数的问题。
 * 单轴 ax/ay/az 只用来核对轴向，对 MVP 的计数不敏感（模长与符号无关）。
 */
function AxisReadout({ s }: { s: SensorSample }) {
  const mag = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az)
  const axis: [string, number][] = [
    ['ax', s.ax],
    ['ay', s.ay],
    ['az', s.az],
  ]
  return (
    <View
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        padding: '8px 16px',
        borderBottom: `2px solid ${C.line}`,
        background: C.panel,
      }}
    >
      {axis.map(([k, v]) => (
        <Text key={k} style={{ font: `400 11px/1 ${F.mono}`, color: C.muted }}>
          {k} <Text style={{ color: C.text }}>{v.toFixed(2)}</Text>
        </Text>
      ))}
      <Text style={{ font: `400 11px/1 ${F.mono}`, color: C.gold }}>
        |a| <Text style={{ color: mag > 8.5 && mag < 11 ? C.green : C.red }}>{mag.toFixed(2)}</Text>
      </Text>
    </View>
  )
}

/**
 * 状态机内部量，debug 模式专用。
 *
 * 那条横杠是整个面板的重点：刻度是相对基线的偏移，
 * 两道竖线是 enter / confirm 阈值，亮块是当前 value。
 * 做一个标准动作，亮块要越过右边那道线；站着不动或原地走，
 * 亮块不许碰到左边那道线。计数不准时看的就是这个，不是 reps 数字。
 */
function DetectorReadout({ state, d }: { state: string; d: DetectorDebug }) {
  const scale = Math.max(d.confirm, d.enter) * 2
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`
  const past = d.value >= d.confirm ? C.green : d.value >= d.enter ? C.gold : C.dim

  return (
    <View style={{ padding: '8px 16px', borderBottom: `2px solid ${C.line}`, background: C.panel, display: 'grid', gap: 6 }}>
      <View style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Text style={{ font: `400 8px/1 ${F.pixel}`, color: C.gold }}>{state}</Text>
        <Text style={{ font: `400 11px/1 ${F.mono}`, color: C.muted }}>
          base <Text style={{ color: C.text }}>{d.baseline.toFixed(2)}</Text>
          {'  '}val <Text style={{ color: past }}>{d.value.toFixed(2)}</Text>
        </Text>
      </View>
      {/* 偏移量相对两条阈值线的位置 */}
      <View style={{ position: 'relative', height: 12, background: C.line }}>
        <View style={{ position: 'absolute', left: 0, top: 0, height: 12, width: pct(Math.max(0, d.value)), background: past }} />
        <View style={{ position: 'absolute', left: pct(d.enter), top: 0, width: 2, height: 12, background: C.gold }} />
        <View style={{ position: 'absolute', left: pct(d.confirm), top: 0, width: 2, height: 12, background: C.green }} />
      </View>
      <View style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Text style={{ font: `400 9px/1 ${F.mono}`, color: C.gold }}>enter {d.enter}</Text>
        <Text style={{ font: `400 9px/1 ${F.mono}`, color: C.green }}>confirm {d.confirm}</Text>
      </View>
    </View>
  )
}

/**
 * 最近一次 rep 的评分链路，debug 模式专用。
 *
 * 「计数在涨但血条不动」看这一条就够：
 * dmg 是 0 时，往左看是 q<0.6（哪一项拖垮的，四个分数里最低那个）
 * 还是 conf<0.5（被反作弊掐了）还是 hp 本来就是 0。
 */
function RepDiagnosticReadout({ r }: { r: RepDiagnostic }) {
  const miss = r.damage <= 0
  const parts: [string, number][] = [
    ['rom', r.breakdown.rom],
    ['tmp', r.breakdown.tempo],
    ['stb', r.breakdown.stability],
    ['cmp', r.breakdown.completion],
  ]
  const worst = Math.min(...parts.map(([, v]) => v))

  return (
    <View
      style={{
        padding: '8px 16px',
        borderBottom: `2px solid ${C.line}`,
        background: miss ? '#241a18' : C.panel,
        display: 'grid',
        gap: 4,
      }}
    >
      <View style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Text style={{ font: `400 9px/1 ${F.mono}`, color: C.muted }}>
          q <Text style={{ color: r.quality < 0.6 ? C.red : C.green }}>{r.quality.toFixed(2)}</Text>
          {'  '}conf <Text style={{ color: r.confidence < 0.5 ? C.red : C.green }}>{r.confidence.toFixed(2)}</Text>
          {'  '}hp <Text style={{ color: r.bossHpBefore <= 0 ? C.red : C.body }}>{r.bossHpBefore}</Text>
        </Text>
        <Text style={{ font: `400 9px/1 ${F.mono}`, color: miss ? C.red : C.gold }}>
          dmg {r.damage}
        </Text>
      </View>
      <View style={{ display: 'flex', justifyContent: 'space-between' }}>
        {parts.map(([k, v]) => (
          <Text
            key={k}
            style={{ font: `400 9px/1 ${F.mono}`, color: v === worst ? C.red : C.dim }}
          >
            {k} {v.toFixed(2)}
          </Text>
        ))}
      </View>
    </View>
  )
}

function SensorBar({ status, hz, exercise }: { status: string; hz: number; exercise: string }) {
  const map: Record<string, { color: string; border: string; text: string; blink?: boolean }> = {
    idle: { color: C.muted, border: C.line, text: '待机' },
    calibrating: { color: C.gold, border: C.goldDeep, text: '校准中…', blink: true },
    ok: { color: C.green, border: C.greenDeep, text: `SENSOR OK · ${hz}Hz` },
    low_rate: { color: C.gold, border: C.goldDeep, text: `${hz}Hz · 计数可能不准` },
    denied: { color: C.red, border: C.redDeep, text: '权限未授予' },
    manual: { color: C.red, border: C.redDeep, text: '手动计数' },
  }
  const s = map[status] ?? map.idle
  return (
    <View
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: `3px solid ${C.border}`,
        background: C.raised,
      }}
    >
      <View style={{ display: 'flex', alignItems: 'center', gap: 8, border: `2px solid ${s.border}`, padding: '7px 10px' }}>
        <View
          style={{
            width: 9,
            height: 9,
            background: s.color,
            animation: s.blink ? 'fq-blink 1s steps(1,end) infinite' : undefined,
          }}
        />
        <Text style={{ font: `400 8px/1 ${F.pixel}`, color: s.color }}>{s.text}</Text>
      </View>
      <View style={{ font: `400 8px/1 ${F.pixel}`, color: C.muted }}>{exercise}</View>
    </View>
  )
}
