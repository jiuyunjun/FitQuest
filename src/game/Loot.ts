export interface LootTier {
  tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'GOLD'
  border: string
  rate: number
  label: string
  note: string
}

/** 概率公开显示。任何结果都附带基础 XP，无空箱。 */
export const TIERS: LootTier[] = [
  { tier: 'COMMON', border: '#5c564a', rate: 0.55, label: '木剑', note: '基础 +20 XP' },
  { tier: 'UNCOMMON', border: '#ece6da', rate: 0.28, label: '布甲', note: '基础 +20 XP · 装备 +1' },
  { tier: 'RARE', border: '#8fd8a0', rate: 0.12, label: '药水', note: '基础 +20 XP · 可保住一次 Streak' },
  { tier: 'GOLD', border: '#e0b980', rate: 0.05, label: '金宝箱', note: '基础 +20 XP · 外观 / 称号' },
]

export const PITY_THRESHOLD = 10
export const CHEST_BASE_XP = 20

/** 连续 10 次未出金 → 第 11 次保底。随机只增加上限，不降低下限。 */
export function rollChest(pity: number): { tier: LootTier; pity: number } {
  if (pity >= PITY_THRESHOLD) return { tier: TIERS[3], pity: 0 }
  const r = Math.random()
  const tier = r < 0.55 ? TIERS[0] : r < 0.83 ? TIERS[1] : r < 0.95 ? TIERS[2] : TIERS[3]
  return { tier, pity: tier === TIERS[3] ? 0 : pity + 1 }
}
