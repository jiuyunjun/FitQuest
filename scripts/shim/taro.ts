/**
 * Node 冒烟测试用的 @tarojs/taro 替身：内存 storage + 空的启动参数。
 * 测试可以在 import 之后、render 之前往 globalThis.__FQ_STORE__ 里塞存档，
 * loadState 是在 useState 初始化时才读的，时机上来得及。
 */
type Store = Record<string, string>

const store = (): Store => {
  const g = globalThis as { __FQ_STORE__?: Store }
  if (!g.__FQ_STORE__) g.__FQ_STORE__ = {}
  return g.__FQ_STORE__
}

export default {
  getStorageSync: (key: string): string => store()[key] ?? '',
  setStorageSync: (key: string, value: string): void => {
    store()[key] = value
  },
  removeStorageSync: (key: string): void => {
    delete store()[key]
  },
  getLaunchOptionsSync: () => ({ query: {} as Record<string, string> }),
  loadFontFace: () => {},
  setKeepScreenOn: () => Promise.resolve(),
  vibrateShort: () => Promise.resolve(),
  createWebAudioContext: () => {
    throw new Error('no webaudio in node')
  },
  startAccelerometer: () => Promise.resolve(),
  stopAccelerometer: () => Promise.resolve(),
  startGyroscope: () => Promise.resolve(),
  stopGyroscope: () => Promise.resolve(),
  onAccelerometerChange: () => {},
  offAccelerometerChange: () => {},
  onGyroscopeChange: () => {},
  offGyroscopeChange: () => {},
}
