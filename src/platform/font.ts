import Taro from '@tarojs/taro'
import { isWeapp } from './env'

/**
 * 像素字体。H5 走 index.html 里的 <link>，小程序不能用 @font-face 引外链，
 * 只能在运行时 wx.loadFontFace 注入。
 *
 * 注意：URL 的域名必须先加进小程序后台的「downloadFile 合法域名」白名单，
 * 否则真机上会静默失败（开发者工具勾了「不校验域名」时看不出来）。
 * 留空则跳过加载，直接吃 tokens.ts 里 monospace 的兜底 —— 排版会略糊但不崩。
 */
const PIXEL_FONT_URL = ''

let loaded = false

export function loadPixelFont(): void {
  if (loaded || !isWeapp || !PIXEL_FONT_URL) return
  loaded = true
  Taro.loadFontFace({
    family: 'Press Start 2P',
    source: `url("${PIXEL_FONT_URL}")`,
    global: true,
    fail: () => {
      // 字体拉不到不影响玩：所有 font 声明都带 monospace 兜底。
    },
  })
}
