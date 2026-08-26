import type { QualityBreakdown } from './types'

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * 基于 IMU waveform 的一致性 / 完整度评分。
 * 明确不是医学意义上的“动作标准度”，只描述本次波形与目标模板的接近程度。
 */
export function scoreRep(input: {
  depth: number
  targetDepth: number
  durationMs: number
  idealMs: number
  jitter: number
  downMs: number
  upMs: number
}): { quality: number; breakdown: QualityBreakdown } {
  const rom = clamp01(input.depth / input.targetDepth)

  // 节奏在理想值的 1/1.5 ~ 1.5 倍之间都算标准，只惩罚明显过快或拖沓。
  const ratio = input.durationMs / input.idealMs
  const drift = Math.max(0, Math.abs(Math.log(ratio)) - Math.log(1.5))
  const tempo = clamp01(1 - drift / Math.log(2.2))

  const stability = clamp01(1 - input.jitter / 6)

  const total = input.downMs + input.upMs
  const symmetry = total > 0 ? 1 - Math.abs(input.downMs - input.upMs) / total : 0
  const completion = clamp01(symmetry)

  const quality =
    rom * 0.4 + tempo * 0.2 + stability * 0.2 + completion * 0.2

  return {
    quality: Math.round(quality * 100) / 100,
    breakdown: {
      rom: Math.round(rom * 100) / 100,
      tempo: Math.round(tempo * 100) / 100,
      stability: Math.round(stability * 100) / 100,
      completion: Math.round(completion * 100) / 100,
    },
  }
}

export type QualityTier = 'MISS' | 'NORMAL' | 'GOOD' | 'CRITICAL'

export function qualityTier(q: number): QualityTier {
  if (q < 0.6) return 'MISS'
  if (q < 0.8) return 'NORMAL'
  if (q < 0.95) return 'GOOD'
  return 'CRITICAL'
}
