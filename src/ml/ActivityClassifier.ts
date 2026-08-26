import type { SensorSample } from '../sensor/SensorAdapter'

export type ActivityType =
  | 'idle'
  | 'walking'
  | 'running'
  | 'squat'
  | 'jumping_jack'
  | 'push_up'
  | 'sit_up'

export interface ActivityPrediction {
  activity: ActivityType
  confidence: number
}

/**
 * 模型只回答「这是什么动作」，次数由 exercise/ 的状态机负责，
 * 质量由 quality.ts 负责。三者分开，换算法时不用动游戏逻辑。
 *
 * MVP 不接模型：训练前由用户显式选择动作，等价于置信度 1 的固定预测。
 * Phase 2 接 ONNX 1D-CNN 时新增 OnnxClassifier 实现本接口，
 * 在 useTraining 里替换即可。
 */
export interface ActivityClassifier {
  predict(samples: readonly SensorSample[]): Promise<ActivityPrediction>
}

/** 用户已经选了动作，不做识别。 */
export class FixedClassifier implements ActivityClassifier {
  constructor(private activity: ActivityType) {}

  async predict(): Promise<ActivityPrediction> {
    return { activity: this.activity, confidence: 1 }
  }
}
