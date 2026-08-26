import type { SensorSample } from '../sensor/SensorAdapter'

export type ExerciseId = 'squat' | 'jumping_jack' | 'push_up'

export interface QualityBreakdown {
  rom: number
  tempo: number
  stability: number
  completion: number
}

export interface RepEvent {
  index: number
  durationMs: number
  quality: number
  breakdown: QualityBreakdown
}

export interface RepDetector {
  readonly exercise: ExerciseId
  push(sample: SensorSample): RepEvent | null
  reset(): void
  /** 0~1，当前动作在一次 rep 中的进度，用于 UI 反馈。 */
  readonly phaseProgress: number
  readonly stateName: string
}
