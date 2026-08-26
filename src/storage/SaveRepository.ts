import { EMPTY_STATE, type SaveState } from './types'

const KEY = 'fitquest.save.v1'

/**
 * MVP 全本地。原始 IMU 不落盘、不上传，只保存动作结果。
 */
export function loadState(): SaveState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY_STATE }
    const parsed = JSON.parse(raw) as SaveState
    if (parsed.version !== 1) return { ...EMPTY_STATE }
    return { ...EMPTY_STATE, ...parsed }
  } catch {
    return { ...EMPTY_STATE }
  }
}

export function saveState(state: SaveState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // 隐私模式下写入会抛错，此时只保留内存态，不打断训练。
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
