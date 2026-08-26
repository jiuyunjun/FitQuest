import Taro from '@tarojs/taro'
import type { QualityTier } from '../exercise'
import { isWeapp } from './env'

/**
 * 计数震动。
 *
 * 这不只是打击反馈，更是这套交互的必要组成：手机必须在裤子前侧口袋里，
 * 屏幕上再丰富的读数用户也看不见。震动把「这一次记上了」搬到了
 * 唯一还通着的感知通道上 —— 顺带让标定时能定位到具体哪一次漏了、哪一次误触发。
 *
 * MISS 也震，只是轻一点：做了动作却毫无反馈，用户会以为是 App 卡了。
 */
export function repTick(tier: QualityTier): void {
  if (!isWeapp) return
  const type = tier === 'CRITICAL' ? 'heavy' : tier === 'MISS' ? 'light' : 'medium'
  Taro.vibrateShort({ type }).catch(() => {
    // 用户关了系统震动 / 部分机型不支持，纯辅助通道，静默失败。
  })
}
