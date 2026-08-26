import { now } from '../platform/env'
import type { PermissionState, SensorAdapter, SensorSample } from './SensorAdapter'

/**
 * 桌面调试用：合成 50Hz 的深蹲波形，周期 2.4s。
 * 只在 ?mock=1 时启用，不进入正式流程。
 */
export class MockSensorAdapter implements SensorAdapter {
  private timer: ReturnType<typeof setInterval> | null = null
  private t = 0

  isSupported(): boolean {
    return true
  }

  async requestPermission(): Promise<PermissionState> {
    return 'granted'
  }

  start(onSample: (s: SensorSample) => void): void {
    this.stop()
    const dt = 20
    this.timer = setInterval(() => {
      this.t += dt / 1000
      const phase = (this.t / 2.4) * Math.PI * 2
      const depth = 3.4 * Math.sin(phase)
      onSample({
        timestamp: now(),
        ax: 0.2 * Math.sin(phase * 2),
        ay: 9.8 - depth,
        az: 0.3 * Math.cos(phase),
        gx: 12 * Math.cos(phase),
        gy: 4 * Math.sin(phase),
        gz: 2,
      })
    }, dt)
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
