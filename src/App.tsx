import { useState } from 'react'
import { useGame } from './app/store'
import type { ExerciseId } from './exercise/types'
import { BottomNav, type Tab } from './ui/components/BottomNav'
import { Battle } from './ui/screens/Battle'
import { Character } from './ui/screens/Character'
import { Codex } from './ui/screens/Codex'
import { Data } from './ui/screens/Data'
import { FirstRun } from './ui/screens/FirstRun'
import { Home } from './ui/screens/Home'
import { Victory } from './ui/screens/Victory'
import { C } from './ui/tokens'

type Route = 'home' | 'battle' | 'victory'

export function App() {
  const { state, markOnboarded, clearLastResult } = useGame()
  const [tab, setTab] = useState<Tab>('adventure')
  const [route, setRoute] = useState<Route>('home')
  const [exercise, setExercise] = useState<ExerciseId>('squat')

  if (!state.onboarded) {
    return (
      <Shell>
        <FirstRun onDone={markOnboarded} />
      </Shell>
    )
  }

  // 战斗与结算是全屏流程，没有底部导航 —— 每屏只有一个明确的下一步。
  if (route === 'battle') {
    return (
      <Shell>
        <Battle
          exercise={exercise}
          onFinish={() => setRoute('victory')}
          onAbort={() => setRoute('home')}
        />
      </Shell>
    )
  }

  if (route === 'victory') {
    return (
      <Shell>
        <Victory
          onBack={() => {
            clearLastResult()
            setRoute('home')
          }}
        />
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%', minHeight: 0 }}>
        <div style={{ overflowY: 'auto', minHeight: 0 }}>
          {tab === 'adventure' && (
            <Home exercise={exercise} onPickExercise={setExercise} onStart={() => setRoute('battle')} />
          )}
          {tab === 'character' && <Character />}
          {tab === 'codex' && <Codex />}
          {tab === 'data' && <Data />}
        </div>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: C.bg }}>
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          height: '100%',
          maxHeight: 960,
          background: C.panelAlt,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: '1fr',
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
