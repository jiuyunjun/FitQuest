import { View, Text } from '@tarojs/components'
import { useGame } from '../../app/store'
import { MONSTERS } from '../../game/monsters'
import { PixelSprite } from '../components/PixelSprite'
import { C, F } from '../tokens'

export function Codex() {
  const { state } = useGame()
  const found = new Set(state.defeatedBossIds)

  return (
    <View style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <View
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          borderBottom: `3px solid ${C.border}`,
          background: C.raised,
        }}
      >
        <Text style={{ font: `400 10px/1 ${F.pixel}`, color: C.gold }}>图鉴</Text>
        <Text style={{ font: `400 9px/1 ${F.pixel}`, color: C.muted }}>
          {found.size} / {MONSTERS.length}
        </Text>
      </View>

      <View
        style={{
          padding: 18,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          alignContent: 'start',
        }}
      >
        {MONSTERS.map((m) => {
          const known = found.has(m.id)
          return (
            <View
              key={m.id}
              style={{
                border: `3px solid ${known ? C.border : C.line}`,
                background: C.panel,
                padding: 12,
                display: 'grid',
                gap: 10,
                justifyItems: 'center',
              }}
            >
              <PixelSprite def={m} cell={7} hidden={!known} />
              <View
                style={{
                  font: `700 12px/1.3 ${F.sans}`,
                  color: known ? C.text : C.dim,
                  textAlign: 'center',
                }}
              >
                {known ? m.name : '未发现'}
              </View>
              <View style={{ font: `400 8px/1 ${F.pixel}`, color: C.label }}>
                {known ? '已击败' : '???'}
              </View>
              {known && (
                <View style={{ font: `400 11px/1.5 ${F.sans}`, color: C.muted, textAlign: 'center' }}>
                  弱点 <Text style={{ color: C.green }}>{m.weakLabel}</Text>
                </View>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}
