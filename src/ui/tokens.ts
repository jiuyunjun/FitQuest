/** 与 Claude Design「FitQuest 设计系统」一一对应。硬边框、硬投影、无圆角。 */
export const C = {
  bg: '#14120f',
  panel: '#1a1713',
  panelAlt: '#181712',
  raised: '#221f1a',
  line: '#2e2a23',
  border: '#4a4133',
  dim: '#5c564a',
  label: '#6d6557',
  muted: '#8d8577',
  body: '#b9b2a5',
  text: '#ece6da',
  gold: '#e0b980',
  goldDeep: '#6b5326',
  green: '#8fd8a0',
  greenDeep: '#35603f',
  red: '#e07a6a',
  redDeep: '#6b3a33',
  purple: '#8a6ac9',
} as const

export const F = {
  pixel: "'Press Start 2P', monospace",
  sans: "'Noto Sans SC', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

export const px = (size: number) => `400 ${size}px/1 ${F.pixel}`
