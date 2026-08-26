import Taro from '@tarojs/taro'

/** Taro 在编译期把 process.env.TARO_ENV 替换成字面量，摇树后只剩当前平台分支。 */
export const PLATFORM: string = process.env.TARO_ENV || 'h5'
export const isWeapp = PLATFORM === 'weapp'
export const isH5 = PLATFORM === 'h5'

/**
 * 小程序运行时没有 performance，而计数状态机依赖单调递增的毫秒时钟。
 * 两端统一走这个函数，signal / exercise 层不需要知道自己跑在哪。
 */
export const now = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

/**
 * 启动参数。H5 读 query string，小程序读场景值里的 query
 * （开发者工具「编译模式」里填 `mock=1` 即可复现桌面调试链路）。
 */
export function launchQuery(): Record<string, string> {
  if (isH5) {
    if (typeof location === 'undefined') return {}
    const out: Record<string, string> = {}
    new URLSearchParams(location.search).forEach((v, k) => {
      out[k] = v
    })
    return out
  }
  try {
    return (Taro.getLaunchOptionsSync()?.query ?? {}) as Record<string, string>
  } catch {
    return {}
  }
}

/** 桌面 / 开发者工具没有 IMU 时，用合成波形驱动整条链路。 */
export const useMockSensor = (): boolean => 'mock' in launchQuery()

/**
 * 真机标定用：战斗页显示原始 ax/ay/az 读数。
 * 小程序端在开发者工具的编译模式里选「传感器标定」，H5 端加 ?debug=1。
 * 正式用户看不到，别把它做成设置项。
 */
export const isDebug = (): boolean => 'debug' in launchQuery()
