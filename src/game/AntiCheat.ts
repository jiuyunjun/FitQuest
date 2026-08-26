import type { RepEvent } from '../exercise/types'

/**
 * 摇手机刷 XP 是这套机制的天然漏洞。MVP 不试图彻底解决，
 * 只输出一个 0~1 的置信度，异常时降低伤害而不是直接判定作弊。
 */
export class AntiCheat {
  private intervals: number[] = []
  private qualities: number[] = []
  private lastAt = 0

  observe(rep: RepEvent, now: number): number {
    if (this.lastAt > 0) {
      this.intervals.push(now - this.lastAt)
      if (this.intervals.length > 12) this.intervals.shift()
    }
    this.lastAt = now
    this.qualities.push(rep.quality)
    if (this.qualities.length > 12) this.qualities.shift()
    return this.confidence
  }

  /**
   * 真人做动作的节奏有自然抖动。间隔方差过小 + 过快，
   * 更像手持规律摇晃而不是深蹲。
   */
  get confidence(): number {
    if (this.intervals.length < 4) return 1
    const mean = this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length
    const variance =
      this.intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / this.intervals.length
    const cv = Math.sqrt(variance) / mean

    let c = 1
    if (mean < 700) c -= 0.4
    if (cv < 0.04) c -= 0.35
    return Math.max(0.2, Math.min(1, c))
  }

  reset(): void {
    this.intervals = []
    this.qualities = []
    this.lastAt = 0
  }
}
