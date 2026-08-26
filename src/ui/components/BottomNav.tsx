import { View, Text } from '@tarojs/components'
import { C, F } from '../tokens'

export type Tab = 'adventure' | 'character' | 'codex' | 'data'

const TABS: { id: Tab; label: string }[] = [
  { id: 'adventure', label: '冒险' },
  { id: 'character', label: '角色' },
  { id: 'codex', label: '图鉴' },
  { id: 'data', label: '数据' },
]

/** 4 项上限。选中项：金色 + 深色底，不用下划线或圆点。 */
export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: `3px solid ${C.border}`,
        background: C.raised,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((t) => {
        const on = t.id === active
        return (
          <View
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 6,
              padding: '14px 4px',
              minHeight: 56,
              background: on ? C.line : 'transparent',
              boxSizing: 'border-box',
            }}
          >
            <View style={{ width: 14, height: 14, background: on ? C.gold : C.dim }} />
            <Text style={{ font: `400 8px/1 ${F.pixel}`, color: on ? C.gold : C.muted }}>{t.label}</Text>
          </View>
        )
      })}
    </View>
  )
}
