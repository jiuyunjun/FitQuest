import type { SensorSample } from '../sensor/SensorAdapter'
import { LowPass, RunningMean, magnitude } from '../signal/filter'
import { scoreRep } from './quality'
import type { ExerciseId, RepDetector, RepEvent } from './types'

type State = 'CLOSED' | 'OPENING' | 'OPEN'

/**
 * 开合跳。频率比深蹲高（约 0.5~1.2s 一次），靠落地冲击的峰值分段，
 * 加不应期避免一次落地被计成多次。
 */
export class JumpingJackStateMachine implements RepDetector {
  readonly exercise: ExerciseId = 'jumping_jack'

  private lp = new LowPass(0.5)
  private baseline = new RunningMean(50)
  private state: State = 'CLOSED'
  private repIndex = 0
  private lastRepAt = 0
  private startedAt = 0
  private peak = 0
  private jitterSum = 0
  private jitterCount = 0
  private d1 = 0
  private d2 = 0

  private readonly peakThreshold = 3.0
  private readonly releaseThreshold = 1.2
  private readonly refractoryMs = 320
  private readonly minRepMs = 300
  private readonly maxRepMs = 2500
  private readonly targetPeak = 7
  private readonly idealMs = 800

  push(s: SensorSample): RepEvent | null {
    const smooth = this.lp.push(magnitude(s.ax, s.ay, s.az))
    if (this.state === 'CLOSED') this.baseline.push(smooth)
    if (!this.baseline.ready) return null

    const deviation = Math.abs(smooth - this.baseline.value)
    this.jitterSum += Math.abs(deviation - 2 * this.d1 + this.d2)
    this.jitterCount++
    this.d2 = this.d1
    this.d1 = deviation

    switch (this.state) {
      case 'CLOSED':
        if (deviation > this.peakThreshold && s.timestamp - this.lastRepAt > this.refractoryMs) {
          this.state = 'OPENING'
          this.startedAt = s.timestamp
          this.peak = deviation
          this.jitterSum = 0
          this.jitterCount = 0
        }
        break

      case 'OPENING':
        this.peak = Math.max(this.peak, deviation)
        if (deviation < this.releaseThreshold) this.state = 'OPEN'
        break

      case 'OPEN': {
        this.peak = Math.max(this.peak, deviation)
        const durationMs = s.timestamp - this.startedAt
        if (deviation > this.peakThreshold || durationMs > this.maxRepMs) {
          this.state = 'CLOSED'
          this.lastRepAt = s.timestamp
          if (durationMs < this.minRepMs || durationMs > this.maxRepMs) return null
          return this.emit(durationMs)
        }
        break
      }
    }
    return null
  }

  private emit(durationMs: number): RepEvent {
    const jitter = this.jitterCount > 0 ? (this.jitterSum / this.jitterCount) * 30 : 0
    const { quality, breakdown } = scoreRep({
      depth: this.peak,
      targetDepth: this.targetPeak,
      durationMs,
      idealMs: this.idealMs,
      jitter,
      downMs: durationMs / 2,
      upMs: durationMs / 2,
    })
    this.repIndex++
    this.peak = 0
    return { index: this.repIndex, durationMs, quality, breakdown }
  }

  get phaseProgress(): number {
    return this.state === 'CLOSED' ? 0 : Math.min(1, this.peak / this.targetPeak)
  }

  get stateName(): string {
    return this.state
  }

  reset(): void {
    this.lp.reset()
    this.baseline.reset()
    this.state = 'CLOSED'
    this.repIndex = 0
    this.peak = 0
    this.lastRepAt = 0
  }
}
