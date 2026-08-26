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

/**
 * 状态机内部实时量，只给真机标定看。
 *
 * 调阈值时唯一有意义的画面是「`value` 相对 `enter` / `confirm` 走到哪」——
 * 计数不对基本只有两种：动作没顶过 `enter`（漏计），
 * 或者走路抖动就顶过了 `enter`（误计）。光看 reps 数字看不出是哪一种。
 */
export interface DetectorDebug {
  /** 低通后的加速度模长 */
  smooth: number
  /** 静止基线（深蹲=站立，开合跳=闭合） */
  baseline: number
  /** 当前相对基线的偏移：深蹲是下蹲深度，开合跳是冲击幅度 */
  value: number
  /** 越过它才开始判定一次动作 */
  enter: number
  /** 越过它这次动作才算数 */
  confirm: number
}

export interface RepDetector {
  readonly exercise: ExerciseId
  push(sample: SensorSample): RepEvent | null
  reset(): void
  /** 0~1，当前动作在一次 rep 中的进度，用于 UI 反馈。 */
  readonly phaseProgress: number
  readonly stateName: string
  readonly debug: DetectorDebug
}
