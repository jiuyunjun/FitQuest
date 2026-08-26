import Taro from '@tarojs/taro'
import type { QualityTier } from '../exercise'
import { isWeapp } from './env'

/**
 * 8-bit 打击音效。
 *
 * 不用音频文件：方波振荡器 + 快速衰减包络就是 8-bit 音色的原理本身，
 * 实时合成省掉了小程序的资源包体积和 downloadFile 域名白名单，
 * 而且音高可以跟着质量分级连续变化，换成采样文件反而做不到。
 */

interface Ramp {
  setValueAtTime(v: number, t: number): void
  linearRampToValueAtTime(v: number, t: number): void
  exponentialRampToValueAtTime(v: number, t: number): void
}
interface Osc {
  type: string
  frequency: Ramp
  connect(n: unknown): void
  start(t: number): void
  stop(t: number): void
}
interface Ctx {
  currentTime: number
  destination: unknown
  createOscillator(): Osc
  createGain(): { gain: Ramp; connect(n: unknown): void }
}

let ctx: Ctx | null = null
let broken = false

/**
 * 懒初始化：iOS 在用户手势之前不给 AudioContext 出声，
 * 模块顶层创建会拿到一个永远 suspended 的实例。
 */
function acquire(): Ctx | null {
  if (broken) return null
  if (ctx) return ctx
  try {
    if (isWeapp) {
      ctx = Taro.createWebAudioContext() as unknown as Ctx
    } else {
      const W = window as unknown as { AudioContext?: new () => Ctx; webkitAudioContext?: new () => Ctx }
      const Impl = W.AudioContext ?? W.webkitAudioContext
      if (!Impl) throw new Error('no webaudio')
      ctx = new Impl()
    }
  } catch {
    // 低版本基础库 / 不支持的浏览器：静音降级，绝不让音效影响计数。
    broken = true
    return null
  }
  return ctx
}

/** 一声方波，从 from 滑到 to。at 是相对现在的延迟秒数。 */
function blip(c: Ctx, from: number, to: number, ms: number, at: number, vol: number): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t0 = c.currentTime + at
  const t1 = t0 + ms / 1000

  osc.type = 'square'
  osc.frequency.setValueAtTime(from, t0)
  osc.frequency.linearRampToValueAtTime(to, t1)

  // 起手就是最大音量、指数衰减到接近零：8-bit 打击感来自这个陡峭的包络。
  // 目标值不能给 0，exponentialRamp 到 0 是未定义行为。
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t1)

  osc.connect(gain as unknown)
  gain.connect(c.destination)
  osc.start(t0)
  osc.stop(t1)
}

/**
 * 按质量分级出声。音高随质量升高，暴击是两段上行，
 * MISS 给一声下坠的闷响 —— 空砍也要有反馈，否则用户不知道动作被记到了没有。
 */
export function playHit(tier: QualityTier): void {
  const c = acquire()
  if (!c) return
  try {
    switch (tier) {
      case 'CRITICAL':
        blip(c, 880, 1175, 50, 0, 0.18)
        blip(c, 1175, 1760, 70, 0.055, 0.16)
        break
      case 'GOOD':
        blip(c, 660, 880, 80, 0, 0.16)
        break
      case 'NORMAL':
        blip(c, 440, 523, 80, 0, 0.14)
        break
      case 'MISS':
        blip(c, 160, 90, 90, 0, 0.1)
        break
    }
  } catch {
    broken = true
  }
}

/** Boss 归零时的胜利音，三连上行。 */
export function playVictory(): void {
  const c = acquire()
  if (!c) return
  try {
    blip(c, 523, 523, 90, 0, 0.16)
    blip(c, 659, 659, 90, 0.1, 0.16)
    blip(c, 1047, 1047, 180, 0.2, 0.18)
  } catch {
    broken = true
  }
}
