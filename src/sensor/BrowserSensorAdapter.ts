import { now } from '../platform/env'
import type { PermissionState, SensorAdapter, SensorSample } from './SensorAdapter'

type MotionEventCtor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/**
 * DeviceMotionEvent 适配器。
 * 浏览器给的采样率由机型决定（通常 30~60Hz），我们不重采样，
 * 只把真实 timestamp 交给上层，由 signal 层做窗口与频率统计。
 */
export class BrowserSensorAdapter implements SensorAdapter {
  private handler: ((e: DeviceMotionEvent) => void) | null = null

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
  }

  async requestPermission(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported'
    const ctor = window.DeviceMotionEvent as MotionEventCtor
    if (typeof ctor.requestPermission !== 'function') return 'granted'
    try {
      const res = await ctor.requestPermission()
      return res === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }

  start(onSample: (s: SensorSample) => void): void {
    this.stop()
    this.handler = (e: DeviceMotionEvent) => {
      // 优先带重力的读数：深蹲的低频分量主要体现在重力方向上。
      const acc = e.accelerationIncludingGravity ?? e.acceleration
      if (!acc) return
      const rot = e.rotationRate
      onSample({
        timestamp: now(),
        ax: acc.x ?? 0,
        ay: acc.y ?? 0,
        az: acc.z ?? 0,
        gx: rot?.alpha ?? 0,
        gy: rot?.beta ?? 0,
        gz: rot?.gamma ?? 0,
      })
    }
    window.addEventListener('devicemotion', this.handler)
  }

  stop(): void {
    if (this.handler) {
      window.removeEventListener('devicemotion', this.handler)
      this.handler = null
    }
  }
}
