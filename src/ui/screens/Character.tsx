import { useGame } from '../../app/store'
import { HERO_SPRITE } from '../../game/monsters'
import { PixelSprite } from '../components/PixelSprite'
import { Label, Row, SolidBar } from '../components/Primitives'
import { C, F } from '../tokens'

export function Character() {
  const { state, level, xpInto, xpNeed, streak } = useGame()

  // 属性由真实行为累积，不是抽象点数。
  const squatReps = state.sessions
    .filter((s) => s.exercise === 'squat' || s.exercise === 'push_up')
    .reduce((a, s) => a + s.reps, 0)
  const jackReps = state.sessions
    .filter((s) => s.exercise === 'jumping_jack')
    .reduce((a, s) => a + s.reps, 0)
  const totalMinutes = Math.floor(state.days.reduce((a, d) => a + d.activeSeconds, 0) / 60)

  return (
    <div style={{ padding: '20px 18px 28px', display: 'grid', gap: 18, alignContent: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ font: `400 11px/1 ${F.pixel}`, color: C.gold }}>LV {level}</div>
        <div style={{ font: `400 9px/1 ${F.pixel}`, color: C.muted }}>冒险者</div>
      </div>

      <div style={{ border: `3px solid ${C.border}`, background: C.panel, padding: 20, display: 'grid', gap: 14, justifyItems: 'center' }}>
        <PixelSprite def={HERO_SPRITE} cell={12} />
        <div style={{ alignSelf: 'stretch', display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: `400 9px/1 ${F.pixel}`, color: C.green }}>XP</span>
            <span style={{ font: `700 11px/1 ${F.mono}`, color: C.text }}>
              {xpInto} / {xpNeed}
            </span>
          </div>
          <SolidBar value={xpInto} max={xpNeed} color={C.green} height={12} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <Label>属性 · 由行为累积</Label>
        <Attr name="力量 · 深蹲/俯卧撑" value={squatReps} />
        <Attr name="耐力 · 训练分钟" value={totalMinutes} />
        <Attr name="敏捷 · 开合跳" value={jackReps} />
        <Attr name="恒心 · 连续天数" value={streak} />
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <Label>背包 · {state.inventory.length} 件</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {Array.from({ length: Math.max(8, state.inventory.length) }, (_, i) => {
            const item = state.inventory[i]
            return (
              <div
                key={i}
                style={{
                  border: item ? `3px solid ${item.border}` : `3px dashed ${C.line}`,
                  background: item ? C.raised : C.panel,
                  aspectRatio: '1',
                  display: 'grid',
                  placeItems: 'center',
                  gap: 5,
                  padding: 6,
                }}
              >
                {item && (
                  <>
                    <div style={{ width: 16, height: 16, background: item.border }} />
                    <span style={{ font: `400 7px/1.3 ${F.pixel}`, color: C.muted, textAlign: 'center' }}>
                      {item.label}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ font: `400 12px/1.7 ${F.sans}`, color: C.muted }}>
          空格子保留占位，不折叠。边框色表示稀有度。
        </div>
      </div>
    </div>
  )
}

function Attr({ name, value }: { name: string; value: number }) {
  return (
    <Row
      left={<span style={{ font: `400 13px/1 ${F.sans}`, color: C.text }}>{name}</span>}
      right={<span style={{ font: `700 12px/1 ${F.mono}`, color: C.gold }}>{value}</span>}
    />
  )
}
