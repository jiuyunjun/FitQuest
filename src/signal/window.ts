import type { SensorSample } from '../sensor/SensorAdapter'

/** 固定长度滑窗，模型接入后直接喂 100×6。 */
export class SlidingWindow {
  private buf: SensorSample[] = []
  constructor(private size: number) {}

  push(s: SensorSample): void {
    this.buf.push(s)
    if (this.buf.length > this.size) this.buf.shift()
  }

  get full(): boolean {
    return this.buf.length === this.size
  }

  get samples(): readonly SensorSample[] {
    return this.buf
  }

  reset(): void {
    this.buf = []
  }
}
