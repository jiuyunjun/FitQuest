export interface SensorSample {
  timestamp: number
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
}

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported'

export interface SensorAdapter {
  /** 是否可能拿到 IMU。false 时上层直接走手动计数降级路径。 */
  isSupported(): boolean
  /** iOS 必须在用户手势中调用。 */
  requestPermission(): Promise<PermissionState>
  start(onSample: (s: SensorSample) => void): void
  stop(): void
}
