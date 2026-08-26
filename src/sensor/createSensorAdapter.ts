import { isWeapp, useMockSensor } from '../platform/env'
import { BrowserSensorAdapter } from './BrowserSensorAdapter'
import { MockSensorAdapter } from './MockSensorAdapter'
import type { SensorAdapter } from './SensorAdapter'
import { WeappSensorAdapter } from './WeappSensorAdapter'

/**
 * 唯一一处知道「现在跑在哪个 Runtime」的地方。
 * 上层（useTraining / exercise / game）只认 SensorAdapter 接口。
 */
export function createSensorAdapter(): SensorAdapter {
  if (useMockSensor()) return new MockSensorAdapter()
  return isWeapp ? new WeappSensorAdapter() : new BrowserSensorAdapter()
}
