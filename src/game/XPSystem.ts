/** 奖励行为本身，不把卡路里换算成 XP。 */
export const XP_PER_REP = 2
export const XP_STANDARD_QUEST = 100
export const XP_MINIMAL_QUEST = 20
export const XP_BOSS_KILL = 60

export function xpForLevel(level: number): number {
  return 300 + (level - 1) * 100
}

export function levelFromXp(totalXp: number): { level: number; into: number; need: number } {
  let level = 1
  let remaining = totalXp
  for (;;) {
    const need = xpForLevel(level)
    if (remaining < need) return { level, into: remaining, need }
    remaining -= need
    level++
  }
}
