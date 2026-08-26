import Taro from '@tarojs/taro'
import { isWeapp } from './env'

/**
 * 训练中保持屏幕常亮。
 *
 * 这不是体验优化，是功能前提：小程序息屏 / 退到后台后会被挂起，
 * accelerometer 回调直接断掉 —— 用户在做深蹲，计数却停在原地。
 * 手机揣在裤兜里没人去点屏幕，所以必须显式申请。
 *
 * H5 上没有对应能力（Wake Lock API 支持面太窄且要求安全上下文），
 * 这里不做，桌面调试也不需要。
 */
export function keepScreenOn(on: boolean): void {
  if (!isWeapp) return
  Taro.setKeepScreenOn({ keepScreenOn: on }).catch(() => {
    // 申请失败不影响计数逻辑，最多是息屏后这一组白做，不值得打断训练。
  })
}
