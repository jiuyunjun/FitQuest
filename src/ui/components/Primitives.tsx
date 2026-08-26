import { View } from '@tarojs/components'
import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { C, F } from '../tokens'

export function PixelButton({
  children,
  onClick,
  variant = 'primary',
  disabled,
  size = 12,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  size?: number
  style?: CSSProperties
}) {
  const [pressed, setPressed] = useState(false)

  const palette = {
    primary: { color: C.bg, background: C.gold, border: C.text, shadow: C.goldDeep },
    secondary: { color: C.text, background: C.raised, border: C.border, shadow: '#23201a' },
    danger: { color: C.red, background: 'transparent', border: C.redDeep, shadow: '#23201a' },
  }[variant]

  const offset = pressed && !disabled ? 5 : 0

  return (
    // 小程序没有 <button> 的按下态可用，按压位移自己管；
    // Pointer Events 在小程序不存在，统一走 touch。
    <View
      onClick={disabled ? undefined : onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        font: `400 ${size}px/1.4 ${F.pixel}`,
        color: disabled ? C.dim : palette.color,
        background: disabled ? '#1c1a16' : palette.background,
        border: `3px solid ${disabled ? C.line : palette.border}`,
        boxShadow: disabled ? 'none' : `${5 - offset}px ${5 - offset}px 0 ${palette.shadow}`,
        transform: `translate(${offset}px, ${offset}px)`,
        padding: '18px 22px',
        minHeight: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </View>
  )
}

export function Panel({
  children,
  accent,
  style,
}: {
  children: ReactNode
  accent?: string
  style?: CSSProperties
}) {
  return (
    <View
      style={{
        border: `3px solid ${accent ?? C.line}`,
        background: C.panel,
        padding: 18,
        display: 'grid',
        gap: 12,
        ...style,
      }}
    >
      {children}
    </View>
  )
}

export function Label({ children, color = C.label }: { children: ReactNode; color?: string }) {
  return <View style={{ font: `400 9px/1.4 ${F.pixel}`, color }}>{children}</View>
}

/** 分段进度条：3px 间隔的硬格子，不用平滑条。 */
export function SegmentedBar({
  value,
  max,
  segments = 20,
  color,
  height = 18,
  blink = false,
}: {
  value: number
  max: number
  segments?: number
  color: string
  height?: number
  blink?: boolean
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const filled = Math.ceil(ratio * segments)
  return (
    <View style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: segments }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height,
            background: i < filled ? color : C.line,
            animation: blink && i < filled ? 'fq-blink 0.9s steps(1,end) infinite' : undefined,
          }}
        />
      ))}
    </View>
  )
}

/** 连续条，用于 XP 一类不需要分格的进度。 */
export function SolidBar({
  value,
  max,
  color,
  height = 14,
}: {
  value: number
  max: number
  color: string
  height?: number
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <View style={{ display: 'flex', gap: 2 }}>
      <View style={{ flex: pct, height, background: color }} />
      <View style={{ flex: 100 - pct, height, background: C.line }} />
    </View>
  )
}

export function Row({
  left,
  right,
  accent,
}: {
  left: ReactNode
  right: ReactNode
  accent?: string
}) {
  return (
    <View
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        border: `2px solid ${accent ?? C.line}`,
        background: C.raised,
        padding: '12px 14px',
      }}
    >
      {left}
      {right}
    </View>
  )
}
