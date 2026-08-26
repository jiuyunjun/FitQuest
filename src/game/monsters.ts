import type { ExerciseId } from '../exercise/types'

export interface MonsterDef {
  id: string
  name: string
  en: string
  lv: number
  hp: number
  /** 弱点动作伤害 ×1.5 */
  weak: ExerciseId
  weakLabel: string
  drop: string
  a: string
  b: string
  c: string
  /** 8×8 像素占位精灵，最终资源由美术替换 */
  p: string[]
}

export const MONSTERS: MonsterDef[] = [
  {
    id: 'slime', name: '巨型史莱姆', en: 'SLIME', lv: 3, hp: 100,
    weak: 'squat', weakLabel: '深蹲', drop: '木剑 / 药水',
    a: '#3f7a52', b: '#2a5238', c: '#8fd8a0',
    p: ['........', '..aaaa..', '.aaaaaa.', 'aabaabaa', 'aaaaaaaa', 'aaaaaaaa', '.acccca.', '..a..a..'],
  },
  {
    id: 'skeleton', name: '骷髅兵', en: 'SKELETON', lv: 4, hp: 120,
    weak: 'jumping_jack', weakLabel: '开合跳', drop: '布甲',
    a: '#d8d2c4', b: '#14120f', c: '#8d8577',
    p: ['..aaaa..', '.aaaaaa.', '.abaaba.', '.aaaaaa.', '..abba..', '.acccca.', '..a..a..', '.a....a.'],
  },
  {
    id: 'bat', name: '暗影蝙蝠', en: 'BAT', lv: 2, hp: 70,
    weak: 'jumping_jack', weakLabel: '开合跳', drop: '药水',
    a: '#8a6ac9', b: '#14120f', c: '#c9a0f0',
    p: ['........', 'a......a', 'aa.aa.aa', 'aaaaaaaa', '.acccca.', '..abba..', '...aa...', '........'],
  },
  {
    id: 'gargoyle', name: '石像鬼', en: 'GARGOYLE', lv: 6, hp: 180,
    weak: 'push_up', weakLabel: '俯卧撑', drop: '石护符',
    a: '#6d6557', b: '#14120f', c: '#b9b2a5',
    p: ['.a....a.', '.aa..aa.', '.aaaaaa.', 'aabaabaa', 'aaaaaaaa', '.acccca.', '.aa..aa.', 'a......a'],
  },
  {
    id: 'flame', name: '火元素', en: 'FLAME', lv: 5, hp: 150,
    weak: 'jumping_jack', weakLabel: '开合跳', drop: '火种',
    a: '#e07a6a', b: '#14120f', c: '#e0b980',
    p: ['...a....', '..aca...', '.aacaa..', 'aaccaaa.', 'aacccaa.', 'aaccaaa.', '.aacaa..', '..aaa...'],
  },
  {
    id: 'sandworm', name: '沙虫', en: 'SANDWORM', lv: 7, hp: 210,
    weak: 'squat', weakLabel: '深蹲', drop: '沙晶',
    a: '#e0b980', b: '#14120f', c: '#6b5326',
    p: ['..aaa...', '.aabaa..', '.aaaaa..', '..acca..', '..acca..', '...aa...', '...ac...', '...aa...'],
  },
  {
    id: 'ice_giant', name: '冰巨人', en: 'ICE GIANT', lv: 9, hp: 300,
    weak: 'squat', weakLabel: '深蹲', drop: '寒霜之心',
    a: '#7fb6d8', b: '#14120f', c: '#d8ecf5',
    p: ['.aaaaaa.', '.abaaba.', '.aaaaaa.', 'aaacccaa', 'aaacccaa', '.aa..aa.', '.aa..aa.', 'aaa..aaa'],
  },
  {
    id: 'shadow_drake', name: '暗影龙', en: 'SHADOW DRAKE', lv: 12, hp: 500,
    weak: 'squat', weakLabel: '组合训练', drop: '龙鳞 / 称号',
    a: '#4a4a6b', b: '#e07a6a', c: '#e0b980',
    p: ['a......a', 'aa....aa', 'aaaaaaaa', 'abaaaaba', 'aaacccaa', '.aaccaa.', '..a..a..', '.a....a.'],
  },
]

export const HERO_SPRITE = {
  a: '#c8a06a', b: '#14120f', c: '#e0b980', d: '#8fd8a0',
  p: ['..aaaa..', '.acccca.', '.abaaba.', '.aaaaaa.', 'ddaaaadd', '.aaaaaa.', '..a..a..', '.aa..aa.'],
}

export function spriteCells(def: { a: string; b: string; c: string; d?: string; p: string[] }): string[] {
  return def.p
    .join('')
    .split('')
    .map((ch) =>
      ch === 'a' ? def.a : ch === 'b' ? def.b : ch === 'c' ? def.c : ch === 'd' ? (def.d ?? 'transparent') : 'transparent',
    )
}
