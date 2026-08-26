/** 一阶低通。alpha 越小越平滑，代价是相位滞后。 */
export class LowPass {
  private y: number | null = null
  constructor(private alpha: number) {}

  push(x: number): number {
    this.y = this.y === null ? x : this.y + this.alpha * (x - this.y)
    return this.y
  }

  reset(): void {
    this.y = null
  }
}

/** 滑动均值，用于估计重力基线（做动作时的“站立位”）。 */
export class RunningMean {
  private buf: number[] = []
  constructor(private size: number) {}

  push(x: number): number {
    this.buf.push(x)
    if (this.buf.length > this.size) this.buf.shift()
    return this.value
  }

  get value(): number {
    if (this.buf.length === 0) return 0
    return this.buf.reduce((a, b) => a + b, 0) / this.buf.length
  }

  get ready(): boolean {
    return this.buf.length >= this.size
  }

  reset(): void {
    this.buf = []
  }
}

export function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}
