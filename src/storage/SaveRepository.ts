import Taro from '@tarojs/taro'
import { EMPTY_STATE, type SaveState } from './types'

const KEY = 'fitquest.save.v1'

/**
 * MVP 全本地。原始 IMU 不落盘、不上传，只保存动作结果。
 * Taro 的 storage 在 H5 上就是 localStorage，在小程序上是 wx.setStorageSync，
 * 两端同一份代码；小程序单 key 上限 1MB，SaveState 只留 100 条 session 远低于此。
 */
export function loadState(): SaveState {
  try {
    const raw = Taro.getStorageSync(KEY)
    if (!raw) return { ...EMPTY_STATE }
    const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as SaveState
    if (parsed.version !== 1) return { ...EMPTY_STATE }
    return { ...EMPTY_STATE, ...parsed }
  } catch {
    return { ...EMPTY_STATE }
  }
}

export function saveState(state: SaveState): void {
  try {
    Taro.setStorageSync(KEY, JSON.stringify(state))
  } catch {
    // 隐私模式 / storage 写满时会抛错，此时只保留内存态，不打断训练。
  }
}

export function clearState(): void {
  try {
    Taro.removeStorageSync(KEY)
  } catch {
    /* ignore */
  }
}
