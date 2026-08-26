import type { ExerciseId } from '../exercise/types'
import type { DayRecord } from '../game/StreakSystem'

export interface SessionRecord {
  id: string
  date: string
  exercise: ExerciseId
  reps: number
  durationSeconds: number
  quality: number
  damage: number
  xp: number
  bossKilled: boolean
}

export interface InventoryItem {
  id: string
  label: string
  border: string
  from: string
}

export interface SaveState {
  version: 1
  totalXp: number
  pity: number
  bossDate: string
  bossHp: number
  defeatedBossIds: string[]
  pendingChests: number
  inventory: InventoryItem[]
  sessions: SessionRecord[]
  days: DayRecord[]
  onboarded: boolean
}

export const EMPTY_STATE: SaveState = {
  version: 1,
  totalXp: 0,
  pity: 0,
  bossDate: '',
  bossHp: 0,
  defeatedBossIds: [],
  pendingChests: 0,
  inventory: [],
  sessions: [],
  days: [],
  onboarded: false,
}
