import { MONSTERS, type MonsterDef } from './monsters'

export interface Boss {
  def: MonsterDef
  maxHp: number
  hp: number
  date: string
}

/** 同一天任何时候打开都拿到同一个 Boss，不随刷新变化。 */
function hashDate(date: string): number {
  let h = 2166136261
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 按玩家等级选池：等级越高越可能遇到更硬的 Boss，但不做线性绑定，
 * 保留“今天运气不错，Boss 好打”的波动。
 */
export function generateBoss(date: string, playerLevel: number): Boss {
  const h = hashDate(date)
  const poolSize = Math.min(MONSTERS.length, 3 + Math.floor(playerLevel / 2))
  const def = MONSTERS[h % poolSize]
  const scale = 1 + Math.max(0, playerLevel - 1) * 0.06
  const maxHp = Math.round((def.hp * scale) / 5) * 5
  return { def, maxHp, hp: maxHp, date }
}
