// 冒烟测试：把每个屏幕在 Node 里渲染一遍，捕捉运行时崩溃。
import { renderToStaticMarkup } from 'react-dom/server.browser'
import type { ReactNode } from 'react'
import { GameProvider } from '../src/app/store'
import { Game } from '../src/Game'
import { Home } from '../src/ui/screens/Home'
import { Character } from '../src/ui/screens/Character'
import { Codex } from '../src/ui/screens/Codex'
import { Data } from '../src/ui/screens/Data'
import { Victory } from '../src/ui/screens/Victory'
import { Battle } from '../src/ui/screens/Battle'
import { EMPTY_STATE } from '../src/storage/types'
import { todayKey } from '../src/game/Boss'

const today = todayKey()
const seeded = {
  ...EMPTY_STATE,
  onboarded: true,
  totalXp: 640,
  pendingChests: 1,
  defeatedBossIds: ['slime', 'bat'],
  inventory: [{ id: '1', label: '药水', border: '#8fd8a0', from: today }],
  days: [{ date: today, activeSeconds: 400, reps: 22, result: 'minimal' as const }],
  sessions: [
    {
      id: 's1', date: today, exercise: 'squat' as const, reps: 22,
      durationSeconds: 96, quality: 0.88, damage: 62, xp: 44, bossKilled: true,
    },
  ],
}

// shim/taro.ts 从这里读存档 —— SaveRepository 现在走 Taro.getStorageSync，
// 两端同一份代码，Node 里只需要一个内存 store。
;(globalThis as { __FQ_STORE__?: Record<string, string> }).__FQ_STORE__ = {
  'fitquest.save.v1': JSON.stringify(seeded),
}

const wrap = (node: ReactNode) => renderToStaticMarkup(<GameProvider>{node}</GameProvider>)

const cases: [string, ReactNode][] = [
  ['Game', <Game />],
  ['Home', <Home exercise="squat" onPickExercise={() => {}} onStart={() => {}} />],
  ['Battle', <Battle exercise="squat" onFinish={() => {}} onAbort={() => {}} />],
  ['Victory', <Victory onBack={() => {}} />],
  ['Character', <Character />],
  ['Codex', <Codex />],
  ['Data', <Data />],
]

for (const [name, node] of cases) {
  const html = wrap(node)
  if (html.length < 200) throw new Error(`${name} 渲染内容过少：${html.length}`)
  console.log(`smoke ok · ${name} · ${html.length} chars`)
}
