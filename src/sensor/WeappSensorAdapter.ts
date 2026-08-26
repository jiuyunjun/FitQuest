import Taro from '@tarojs/taro'
import { now } from '../platform/env'
import type { PermissionState, SensorAdapter, SensorSample } from './SensorAdapter'

/** 微信加速度计返回的是重力加速度倍数（g），DeviceMotion 给的是 m/s²。 */
const G = 9.80665

/**
 * 轴向映射。微信与 W3C DeviceMotion 的轴定义在文档上一致，
 * 但真机（尤其 iOS）存在符号差异的报告，做成常量方便真机标定。
 *
 * 注意范围：现在的 `SquatStateMachine` / `JumpingJackStateMachine`
 * 吃的是三轴**合成模长** `magnitude(ax, ay, az)`，模长与符号无关，
 * 所以 AXIS 翻不翻符号都不影响 MVP 的计数。
 * 它是给 Phase 2 留的 —— ONNX 分类器吃 SlidingWindow 的 6 通道原始数据，
 * 那时轴向搞反会直接毁掉模型输入。
 *
 * 真正会毁掉计数的是下面那个 G：单位不换算，模长差 9.8 倍，阈值全废。
 */
const AXIS = { x: 1, y: 1, z: 1 } as const

interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * wx.startAccelerometer / wx.startGyroscope 适配器。
 *
 * 加速度计是主时钟：每来一帧加速度就发一个 SensorSample，
 * 陀螺仪只缓存最近一次读数贴上去 —— 两个回调频率相同但不保证对齐，
 * 强行等待配对会把有效采样率砍半。
 *
 * interval 'game' ≈ 20ms（50Hz），刚好覆盖 useTraining 的 25Hz 下限。
 */
export class WeappSensorAdapter implements SensorAdapter {
  private accHandler: ((res: Vec3) => void) | null = null
  private gyroHandler: ((res: Vec3) => void) | null = null
  private lastGyro: Vec3 = { x: 0, y: 0, z: 0 }
  private started = false

  isSupported(): boolean {
    return typeof Taro.startAccelerometer === 'function'
  }

  /**
   * 小程序的加速度计不占用 scope 授权，没有弹窗可请求。
   * 探测方式就是真的启一次：模拟器和缺传感器的机型会在这里 reject。
   */
  async requestPermission(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported'
    try {
      await Taro.startAccelerometer({ interval: 'game' })
      await Taro.stopAccelerometer()
      return 'granted'
    } catch {
      return 'unsupported'
    }
  }

  start(onSample: (s: SensorSample) => void): void {
    this.stop()

    this.gyroHandler = (res) => {
      this.lastGyro = res
    }
    this.accHandler = (res) => {
      onSample({
        timestamp: now(),
        ax: AXIS.x * res.x * G,
        ay: AXIS.y * res.y * G,
        az: AXIS.z * res.z * G,
        gx: this.lastGyro.x,
        gy: this.lastGyro.y,
        gz: this.lastGyro.z,
      })
    }

    Taro.onGyroscopeChange(this.gyroHandler)
    Taro.onAccelerometerChange(this.accHandler)

    // 陀螺仪失败不致命：状态机只用加速度，gyro 仅供后续模型使用。
    Taro.startGyroscope({ interval: 'game' }).catch(() => {})
    Taro.startAccelerometer({ interval: 'game' }).catch(() => {})
    this.started = true
  }

  stop(): void {
    if (!this.started && !this.accHandler) return
    // offXxxChange 在低版本基础库上可能缺失，缺了就只 stop，回调随页面卸载释放。
    if (this.accHandler && typeof Taro.offAccelerometerChange === 'function') {
      Taro.offAccelerometerChange(this.accHandler)
    }
    if (this.gyroHandler && typeof Taro.offGyroscopeChange === 'function') {
      Taro.offGyroscopeChange(this.gyroHandler)
    }
    this.accHandler = null
    this.gyroHandler = null
    this.lastGyro = { x: 0, y: 0, z: 0 }
    if (this.started) {
      Taro.stopAccelerometer().catch(() => {})
      Taro.stopGyroscope().catch(() => {})
      this.started = false
    }
  }
}
