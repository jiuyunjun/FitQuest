/** 采样率估计。低于 25Hz 时上层必须提示“计数可能不准”，不静默继续。 */
export class SampleRateMeter {
  private stamps: number[] = []

  push(timestamp: number): void {
    this.stamps.push(timestamp)
    const cutoff = timestamp - 1000
    while (this.stamps.length && this.stamps[0] < cutoff) this.stamps.shift()
  }

  get hz(): number {
    return this.stamps.length
  }

  reset(): void {
    this.stamps = []
  }
}
