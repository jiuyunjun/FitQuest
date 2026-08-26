import type { PropsWithChildren } from 'react'
import { GameProvider } from './app/store'
import { loadPixelFont } from './platform/font'
import './app.css'

/**
 * Taro 应用入口。小程序没有 createRoot —— 页面由框架挂载，
 * 入口组件只负责套全局 Provider，UI 全在 pages/index 里。
 */
export default function App({ children }: PropsWithChildren) {
  loadPixelFont()
  return <GameProvider>{children}</GameProvider>
}
