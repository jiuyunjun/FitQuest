import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { createSensorAdapter } from '../../sensor/createSensorAdapter'
import type { PermissionState } from '../../sensor/SensorAdapter'
import { Label, Panel, PixelButton } from '../components/Primitives'
import { C, F } from '../tokens'

/**
 * 手机放置位置示意图。原来是 SVG，小程序不支持 svg 标签，
 * 改成绝对定位的实心方块 —— 本来就是 8-bit 硬像素，没有曲线要画。
 * 坐标沿用原来的 24×32 网格，统一乘 SCALE。
 */
const SCALE = 2.75
const BOXES: [number, number, number, number, string][] = [
  [8, 2, 8, 10, C.border],
  [6, 12, 5, 18, C.border],
  [13, 12, 5, 18, C.border],
  [7, 14, 3, 6, C.gold],
]

function Placement() {
  return (
    <View
      style={{
        position: 'relative',
        width: 24 * SCALE,
        height: 32 * SCALE,
        background: C.raised,
        flexShrink: 0,
      }}
    >
      {BOXES.map(([x, y, w, h, fill], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: x * SCALE,
            top: y * SCALE,
            width: w * SCALE,
            height: h * SCALE,
            background: fill,
          }}
        />
      ))}
    </View>
  )
}

/**
 * 第一分钟必须玩起来：不在开场收集身高体重与训练经历。
 * 只做两件事 —— 说清手机放哪，拿到传感器权限（iOS 必须在用户手势里请求）。
 */
export function FirstRun({ onDone }: { onDone: () => void }) {
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [asked, setAsked] = useState(false)

  const request = async () => {
    const adapter = createSensorAdapter()
    const res = adapter.isSupported() ? await adapter.requestPermission() : 'unsupported'
    setPermission(res)
    setAsked(true)
  }

  return (
    <View style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%' }}>
      <View style={{ padding: '28px 18px', overflowY: 'auto', display: 'grid', gap: 20, alignContent: 'start' }}>
        <View style={{ font: `400 14px/1.7 ${F.pixel}`, color: C.gold, textAlign: 'center' }}>
          <View>FIT</View>
          <View>QUEST</View>
        </View>
        <View style={{ font: `900 19px/1.5 ${F.sans}`, color: C.text, textAlign: 'center' }}>
          把现实运动变成游戏操作
        </View>

        <Panel accent={C.gold}>
          <Label color={C.gold}>PLACEMENT · 强约束</Label>
          <View style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Placement />
            <View style={{ display: 'grid', gap: 10 }}>
              <View style={{ font: `700 16px/1.5 ${F.sans}`, color: C.text }}>裤子前侧口袋，屏幕朝外</View>
              <View style={{ font: `400 13px/1.7 ${F.sans}`, color: C.muted }}>
                MVP 只支持这一个位置。同一个深蹲放在不同位置会产生完全不同的波形。
              </View>
            </View>
          </View>
        </Panel>

        <Panel>
          <Label>PERMISSION</Label>
          <View style={{ font: `900 18px/1.5 ${F.sans}`, color: C.text }}>需要运动传感器权限</View>
          <View style={{ font: `400 14px/1.8 ${F.sans}`, color: C.body }}>
            FitQuest 用加速度计和陀螺仪判断你的动作。数据仅在本机处理，不上传原始数据。
          </View>
          <View style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <PixelButton size={10} onClick={request}>
              允许
            </PixelButton>
            <PixelButton size={10} variant="secondary" onClick={onDone}>
              稍后
            </PixelButton>
          </View>
          {asked && (
            <View
              style={{
                font: `400 12px/1.7 ${F.mono}`,
                color: permission === 'granted' ? C.green : C.red,
                borderTop: `2px solid ${C.line}`,
                paddingTop: 12,
              }}
            >
              {permission === 'granted'
                ? '权限已授予 · 可以开始'
                : '未拿到权限 · 战斗页会自动切换到手动计数'}
            </View>
          )}
        </Panel>

        <Panel accent={C.border}>
          <Label>首次奖励</Label>
          <View style={{ display: 'grid', gap: 8, font: `400 13px/1.6 ${F.sans}`, color: C.body }}>
            <View style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>击败第一个 Boss</Text>
              <Text style={{ color: C.green }}>+60 XP</Text>
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>每完成一次动作</Text>
              <Text style={{ color: C.green }}>+2 XP</Text>
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>最低任务 5 分钟</Text>
              <Text style={{ color: C.green }}>+20 XP · 保住 Streak</Text>
            </View>
          </View>
        </Panel>
      </View>

      <View style={{ padding: 16, borderTop: `3px solid ${C.goldDeep}`, background: C.raised }}>
        <PixelButton onClick={onDone} style={{ width: '100%' }}>
          进入冒险
        </PixelButton>
      </View>
    </View>
  )
}
