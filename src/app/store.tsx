import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ExerciseId } from '../exercise/types'
import { generateBoss, todayKey, type Boss } from '../game/Boss'
import { CHEST_BASE_XP, rollChest, type LootTier } from '../game/Loot'
import { computeStreak, dayResult, minimalUsesThisWeek, type DayRecord } from '../game/StreakSystem'
import { XP_BOSS_KILL, XP_MINIMAL_QUEST, XP_PER_REP, XP_STANDARD_QUEST, levelFromXp } from '../game/XPSystem'
import { clearState, loadState, saveState } from '../storage/SaveRepository'
import { EMPTY_STATE, type SaveState, type SessionRecord } from '../storage/types'

export interface SessionResult {
  exercise: ExerciseId
  reps: number
  durationSeconds: number
  quality: number
  damage: number
  xp: number
  bossKilled: boolean
  streakBefore: number
  streakAfter: number
}

interface GameContextValue {
  state: SaveState
  boss: Boss
  level: number
  xpInto: number
  xpNeed: number
  streak: number
  minimalUsed: number
  today: DayRecord
  lastResult: SessionResult | null
  markOnboarded(): void
  commitSession(input: {
    exercise: ExerciseId
    reps: number
    durationSeconds: number
    quality: number
    damage: number
  }): SessionResult
  openChest(): LootTier
  clearLastResult(): void
  resetAll(): void
}

const GameContext = createContext<GameContextValue | null>(null)

const emptyDay = (date: string): DayRecord => ({ date, activeSeconds: 0, reps: 0, result: 'none' })

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SaveState>(() => loadState())
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const date = todayKey()

  const { level, into: xpInto, need: xpNeed } = levelFromXp(state.totalXp)

  const boss = useMemo(() => {
    const generated = generateBoss(date, level)
    if (state.bossDate === date) {
      return { ...generated, hp: Math.min(state.bossHp, generated.maxHp) }
    }
    return generated
  }, [date, level, state.bossDate, state.bossHp])

  // 跨天时把上一场 Boss 状态归档，新的一天重新生成。
  useEffect(() => {
    if (state.bossDate !== date) {
      setState((s) => ({ ...s, bossDate: date, bossHp: boss.maxHp }))
    }
  }, [date, state.bossDate, boss.maxHp])

  useEffect(() => {
    saveState(state)
  }, [state])

  const today = state.days.find((d) => d.date === date) ?? emptyDay(date)
  const streak = computeStreak(state.days, date)
  const minimalUsed = minimalUsesThisWeek(state.days, date)

  const streakRef = useRef(streak)
  streakRef.current = streak

  const markOnboarded = useCallback(() => {
    setState((s) => ({ ...s, onboarded: true }))
  }, [])

  const commitSession = useCallback<GameContextValue['commitSession']>(
    (input) => {
      const streakBefore = streakRef.current
      let result!: SessionResult

      setState((s) => {
        const hpBefore = s.bossDate === date ? s.bossHp : boss.maxHp
        const hpAfter = Math.max(0, Math.round((hpBefore - input.damage) * 10) / 10)
        const bossKilled = hpBefore > 0 && hpAfter === 0

        const prevDay = s.days.find((d) => d.date === date) ?? emptyDay(date)
        const nextDay: DayRecord = {
          date,
          activeSeconds: prevDay.activeSeconds + input.durationSeconds,
          reps: prevDay.reps + input.reps,
          result: 'none',
        }
        nextDay.result = dayResult(nextDay.activeSeconds)

        let xp = input.reps * XP_PER_REP
        if (bossKilled) xp += XP_BOSS_KILL
        if (prevDay.result !== 'standard' && nextDay.result === 'standard') xp += XP_STANDARD_QUEST
        else if (prevDay.result === 'none' && nextDay.result === 'minimal') xp += XP_MINIMAL_QUEST

        const days = [...s.days.filter((d) => d.date !== date), nextDay].sort((a, b) =>
          a.date < b.date ? -1 : 1,
        )

        const session: SessionRecord = {
          id: `${date}-${Date.now()}`,
          date,
          exercise: input.exercise,
          reps: input.reps,
          durationSeconds: input.durationSeconds,
          quality: input.quality,
          damage: input.damage,
          xp,
          bossKilled,
        }

        result = {
          ...input,
          xp,
          bossKilled,
          streakBefore,
          streakAfter: computeStreak(days, date),
        }

        return {
          ...s,
          bossDate: date,
          bossHp: hpAfter,
          totalXp: s.totalXp + xp,
          days,
          sessions: [session, ...s.sessions].slice(0, 100),
          pendingChests: s.pendingChests + (bossKilled ? 1 : 0),
          defeatedBossIds: bossKilled
            ? Array.from(new Set([...s.defeatedBossIds, boss.def.id]))
            : s.defeatedBossIds,
        }
      })

      setLastResult(() => result)
      return result
    },
    [boss.def.id, boss.maxHp, date],
  )

  const openChest = useCallback((): LootTier => {
    const { tier, pity } = rollChest(state.pity)
    setState((s) => ({
      ...s,
      pity,
      pendingChests: Math.max(0, s.pendingChests - 1),
      totalXp: s.totalXp + CHEST_BASE_XP,
      inventory: [
        { id: `${Date.now()}`, label: tier.label, border: tier.border, from: date },
        ...s.inventory,
      ].slice(0, 40),
    }))
    return tier
  }, [date, state.pity])

  const value: GameContextValue = {
    state,
    boss,
    level,
    xpInto,
    xpNeed,
    streak,
    minimalUsed,
    today,
    lastResult,
    markOnboarded,
    commitSession,
    openChest,
    clearLastResult: () => setLastResult(null),
    resetAll: () => {
      clearState()
      setState({ ...EMPTY_STATE })
      setLastResult(null)
    },
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
