import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../app/store'
import { useTraining } from '../../app/useTraining'
import { EXERCISES, qualityTier } from '../../exercise'
import type { ExerciseId } from '../../exercise/types'
import { repsToKill } from '../../game/DamageCalculator'
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
      const id = window.setTimeout(finish, 700)
      return () => window.clearTimeout(id)
    }
    return undefined
  })

  const remaining = t.bossHpNow
  const lowHp = remaining > 0 && remaining / boss.maxHp <= 0.2
  const needMore = repsToKill(exercise, { ...boss, hp: remaining })
  const manual = t.status === 'denied' || t.status === 'manual' || !def.supported

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
      <SensorBar status={t.status} hz={t.hz} exercise={def.en} />

      <div style={{ padding: '20px 18px', overflowY: 'auto', display: 'grid', gap: 20, alignContent: 'start' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: `400 9px/1 ${F.pixel}`, color: C.red }}>BOSS HP</span>
            <span style={{ font: `700 12px/1 ${F.mono}`, color: C.text }}>
              {remaining} / {boss.maxHp}
            </span>
          </div>
          <SegmentedBar value={remaining} max={boss.maxHp} color={lowHp ? C.red : '#c9634f'} blink={lowHp} />
        </div>

        <div style={{ display: 'grid', justifyItems: 'center', gap: 10, position: 'relative', minHeight: 150 }}>
          <PixelSprite
            def={boss.def}
            cell={12}
            animate={t.hits.length > 0 ? 'shake' : undefined}
            hidden={remaining <= 0}
          />
          <div style={{ position: 'absolute', top: 0, display: 'grid', justifyItems: 'center', gap: 4, pointerEvents: 'none' }}>
            {t.hits.map((h) => (
              <div key={h.id} style={{ animation: 'fq-float 0.9s steps(6,end) forwards', display: 'grid', justifyItems: 'center', gap: 4 }}>
                <div style={{ font: `400 22px/1 ${F.pixel}`, color: h.damage > 0 ? C.red : C.dim }}>
                  {h.damage > 0 ? `-${h.damage}` : 'MISS'}
                </div>
                {h.critical && <div style={{ font: `400 11px/1 ${F.pixel}`, color: C.gold }}>CRITICAL!</div>}
                {h.weakness && h.damage > 0 && (
                  <div style={{ font: `400 10px/1 ${F.pixel}`, color: C.green }}>WEAKNESS</div>
                )}
              </div>
            ))}
          </div>
          {remaining <= 0 && (
            <div style={{ font: `400 14px/1.6 ${F.pixel}`, color: C.gold, textAlign: 'center' }}>
              BOSS
              <br />
              DEFEATED
            </div>
          )}
        </div>

        <div
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
          <div style={{ font: `400 40px/1 ${F.pixel}`, color: C.text }}>{t.reps}</div>
          <div style={{ alignSelf: 'stretch' }}>
            <SegmentedBar value={t.phaseProgress} max={1} segments={12} color={C.green} height={10} />
          </div>
          <div style={{ font: `400 11px/1.6 ${F.mono}`, color: C.muted, textAlign: 'center' }}>
            {def.name} · {t.elapsed}s · 平均质量 {t.avgQuality || '—'}
          </div>
          {t.hits.length > 0 && (
            <div style={{ font: `400 9px/1 ${F.pixel}`, color: C.gold }}>
              {qualityTier(t.hits[t.hits.length - 1].quality)}
            </div>
          )}
        </div>

        {manual && (
          <div style={{ border: `3px solid ${C.redDeep}`, background: C.panelAlt, padding: 18, display: 'grid', gap: 12 }}>
            <Label color={C.red}>手动计数降级</Label>
            <div style={{ font: `400 13px/1.8 ${F.sans}`, color: C.body }}>
              {def.supported
                ? '没有拿到运动传感器权限。可以手动记录，奖励规则不变。'
                : `${def.name}在 MVP 的手机位置下无法可靠识别，只提供手动计数。`}
            </div>
            <PixelButton variant="secondary" onClick={t.manualRep} style={{ width: '100%' }}>
              记一次{def.name}
            </PixelButton>
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: `3px solid ${C.border}`, background: C.raised, display: 'grid', gap: 10 }}>
        <div style={{ font: `400 12px/1.6 ${F.sans}`, color: C.text, textAlign: 'center' }}>
          {remaining <= 0
            ? '结算中…'
            : Number.isFinite(needMore)
              ? `再做 ${needMore} 个即可击杀`
              : '继续训练'}
        </div>
        <PixelButton variant="danger" size={10} onClick={t.reps > 0 ? finish : onAbort} style={{ width: '100%' }}>
          {t.reps > 0 ? '结束训练' : '放弃训练'}
        </PixelButton>
      </div>
    </div>
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
    <div
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `2px solid ${s.border}`, padding: '7px 10px' }}>
        <div
          style={{
            width: 9,
            height: 9,
            background: s.color,
            animation: s.blink ? 'fq-blink 1s steps(1,end) infinite' : undefined,
          }}
        />
        <span style={{ font: `400 8px/1 ${F.pixel}`, color: s.color }}>{s.text}</span>
      </div>
      <div style={{ font: `400 8px/1 ${F.pixel}`, color: C.muted }}>{exercise}</div>
    </div>
  )
}
