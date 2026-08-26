import { EXERCISES } from '../exercise'
import type { ExerciseId } from '../exercise/types'
import type { Boss } from './Boss'

export interface DamageResult {
  damage: number
  critical: boolean
  weakness: boolean
}

/**
 * Damage = BaseDamage × QualityMultiplier × 弱点加成
 * 质量 <0.6 判 MISS，不造成伤害但仍计入 rep 统计。
 */
export function calcDamage(
  exercise: ExerciseId,
  quality: number,
  boss: Boss,
  confidence = 1,
): DamageResult {
  const base = EXERCISES[exercise].baseDamage
  if (quality < 0.6 || confidence < 0.5) {
    return { damage: 0, critical: false, weakness: false }
  }
  const critical = quality > 0.95
  const weakness = boss.def.weak === exercise
  let dmg = base * quality * confidence
  if (critical) dmg *= 1.5
  if (weakness) dmg *= 1.5
  return {
    damage: Math.round(dmg * 10) / 10,
    critical,
    weakness,
  }
}

/** 首页“再做 N 个就能击杀”所需的预估，用平均质量 0.85 估算。 */
export function repsToKill(exercise: ExerciseId, boss: Boss): number {
  const per = calcDamage(exercise, 0.85, boss).damage
  if (per <= 0) return Infinity
  return Math.ceil(boss.hp / per)
}
