/**
 * Node 冒烟测试用的 @tarojs/components 替身。
 * 真实的 Taro 组件依赖小程序 / 浏览器运行时，在 renderToStaticMarkup 下起不来，
 * 而冒烟测试要验的是「屏幕逻辑会不会炸」，不是 Taro 的渲染实现。
 */
import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children?: ReactNode
  style?: CSSProperties
  onClick?: () => void
  onTouchStart?: () => void
  onTouchEnd?: () => void
  onTouchCancel?: () => void
}

export function View({ children, style }: Props) {
  return <div style={style}>{children}</div>
}

export function Text({ children, style }: Props) {
  return <span style={style}>{children}</span>
}
