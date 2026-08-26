import { JumpingJackStateMachine } from './JumpingJackStateMachine'
import { SquatStateMachine } from './SquatStateMachine'
import type { ExerciseId, RepDetector } from './types'

export interface ExerciseDef {
  id: ExerciseId
  name: string
  en: string
  /** 每次的基础伤害，见 DESIGN.md §6.1 */
  baseDamage: number
  unit: string
  hint: string
  supported: boolean
}

export const EXERCISES: Record<ExerciseId, ExerciseDef> = {
  squat: {
    id: 'squat',
    name: '深蹲',
    en: 'SQUAT',
    baseDamage: 5,
    unit: '次',
    hint: '手机放裤子前侧口袋，屏幕朝外。慢下快起，全程约 2 秒。',
    supported: true,
  },
  jumping_jack: {
    id: 'jumping_jack',
    name: '开合跳',
    en: 'JUMPING JACK',
    baseDamage: 1,
    unit: '次',
    hint: '手机放裤子前侧口袋。落地要实，节奏保持一致。',
    supported: true,
  },
  push_up: {
    id: 'push_up',
    name: '俯卧撑',
    en: 'PUSH UP',
    baseDamage: 3,
    unit: '次',
    hint: 'MVP 未支持该位置的识别，仅可手动计数。',
    supported: false,
  },
}

export function createDetector(id: ExerciseId): RepDetector {
  switch (id) {
    case 'jumping_jack':
      return new JumpingJackStateMachine()
    case 'squat':
    case 'push_up':
    default:
      return new SquatStateMachine()
  }
}

export * from './types'
export { qualityTier } from './quality'
export type { QualityTier } from './quality'
