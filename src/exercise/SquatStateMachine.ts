import type { SensorSample } from '../sensor/SensorAdapter'
import { LowPass, RunningMean, magnitude } from '../signal/filter'
import { scoreRep } from './quality'
import type { DetectorDebug, ExerciseId, RepDetector, RepEvent } from './types'

type State = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING'

/**
 * 深蹲状态机。手机固定在裤子前侧口袋，屏幕朝外。
 *
 * 输入是加速度模长的低通结果相对站立基线的偏移：
 * 下蹲时躯干减速 → 模长明显低于基线，起身时高于基线。
 * 状态机保证一次完整的 下-底-上 才计一次，避免抖动重复计数。
 */
export class SquatStateMachine implements RepDetector {
  readonly exercise: ExerciseId = 'squat'

  private lp = new LowPass(0.25)
  private baseline = new RunningMean(60)
  private state: State = 'STANDING'
  private repIndex = 0

  private startedAt = 0
  private bottomAt = 0
  private peakDepth = 0
  private jitterSum = 0
  private jitterCount = 0
  private d1 = 0
  private d2 = 0
  private lastSmooth = 0
  private lastDepth = 0

  /** 进入下蹲判定的偏移阈值 m/s²，低于基线。 */
  private readonly enterDepth = 1.6
  /** 认定“到底”的最小深度。 */
  private readonly bottomDepth = 2.4
  /** 回到站立的回滞带。 */
  private readonly settle = 0.8
  private readonly minRepMs = 600
  private readonly maxRepMs = 6000
  private readonly targetDepth = 4.5
  private readonly idealMs = 2200

  push(s: SensorSample): RepEvent | null {
    const m = magnitude(s.ax, s.ay, s.az)
    const smooth = this.lp.push(m)
    this.lastSmooth = smooth

    if (this.state === 'STANDING') {
      this.baseline.push(smooth)
    }
    if (!this.baseline.ready) return null

    const deviation = smooth - this.baseline.value
    const depth = -deviation
    this.lastDepth = depth

    // 二阶差分：只惩罚高频抖动，动作本身的匀速位移不算不稳。
    this.jitterSum += Math.abs(deviation - 2 * this.d1 + this.d2)
    this.jitterCount++
    this.d2 = this.d1
    this.d1 = deviation

    switch (this.state) {
      case 'STANDING':
        if (depth > this.enterDepth) {
          this.state = 'DESCENDING'
          this.startedAt = s.timestamp
          this.peakDepth = depth
          this.jitterSum = 0
          this.jitterCount = 0
        }
        break

      case 'DESCENDING':
        if (depth > this.peakDepth) {
          this.peakDepth = depth
          this.bottomAt = s.timestamp
        }
        if (depth >= this.bottomDepth) {
          this.state = 'BOTTOM'
        } else if (depth < this.settle) {
          // 半程动作，不计数
          this.state = 'STANDING'
        }
        break

      case 'BOTTOM':
        if (depth > this.peakDepth) {
          this.peakDepth = depth
          this.bottomAt = s.timestamp
        }
        if (depth < this.bottomDepth - this.settle) {
          this.state = 'ASCENDING'
        }
        break

      case 'ASCENDING':
        if (depth < this.settle) {
          const durationMs = s.timestamp - this.startedAt
          this.state = 'STANDING'
          if (durationMs < this.minRepMs || durationMs > this.maxRepMs) {
            this.reseg()
            return null
          }
          return this.emit(durationMs, s.timestamp)
        }
        break
    }

    if (this.state !== 'STANDING' && s.timestamp - this.startedAt > this.maxRepMs) {
      this.state = 'STANDING'
      this.reseg()
    }
    return null
  }

  private emit(durationMs: number, now: number): RepEvent {
    const downMs = Math.max(1, this.bottomAt - this.startedAt)
    const upMs = Math.max(1, now - this.bottomAt)
    const jitter = this.jitterCount > 0 ? (this.jitterSum / this.jitterCount) * 60 : 0
    const { quality, breakdown } = scoreRep({
      depth: this.peakDepth,
      targetDepth: this.targetDepth,
      durationMs,
      idealMs: this.idealMs,
      jitter,
      downMs,
      upMs,
    })
    this.repIndex++
    const event: RepEvent = { index: this.repIndex, durationMs, quality, breakdown }
    this.reseg()
    return event
  }

  private reseg(): void {
    this.peakDepth = 0
    this.jitterSum = 0
    this.jitterCount = 0
  }

  get phaseProgress(): number {
    if (this.state === 'STANDING') return 0
    return Math.max(0, Math.min(1, this.peakDepth / this.targetDepth))
  }

  get stateName(): string {
    return this.state
  }

  get debug(): DetectorDebug {
    return {
      smooth: this.lastSmooth,
      baseline: this.baseline.value,
      value: this.lastDepth,
      enter: this.enterDepth,
      confirm: this.bottomDepth,
    }
  }

  reset(): void {
    this.lp.reset()
    this.baseline.reset()
    this.state = 'STANDING'
    this.repIndex = 0
    this.lastSmooth = 0
    this.lastDepth = 0
    this.reseg()
  }
}
