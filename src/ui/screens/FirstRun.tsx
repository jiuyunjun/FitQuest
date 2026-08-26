import { useState } from 'react'
import { BrowserSensorAdapter } from '../../sensor/BrowserSensorAdapter'
import type { PermissionState } from '../../sensor/SensorAdapter'
import { Label, Panel, PixelButton } from '../components/Primitives'
import { C, F } from '../tokens'

/**
 * 第一分钟必须玩起来：不在开场收集身高体重与训练经历。
 * 只做两件事 —— 说清手机放哪，拿到传感器权限（iOS 必须在用户手势里请求）。
 */
export function FirstRun({ onDone }: { onDone: () => void }) {
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [asked, setAsked] = useState(false)

  const request = async () => {
    const adapter = new BrowserSensorAdapter()
    const res = adapter.isSupported() ? await adapter.requestPermission() : 'unsupported'
    setPermission(res)
    setAsked(true)
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%' }}>
      <div style={{ padding: '28px 18px', overflowY: 'auto', display: 'grid', gap: 20, alignContent: 'start' }}>
        <div style={{ font: `400 14px/1.7 ${F.pixel}`, color: C.gold, textAlign: 'center' }}>
          FIT
          <br />
          QUEST
        </div>
        <div style={{ font: `900 19px/1.5 ${F.sans}`, color: C.text, textAlign: 'center' }}>
          把现实运动变成游戏操作
        </div>

        <Panel accent={C.gold}>
          <Label color={C.gold}>PLACEMENT · 强约束</Label>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <svg viewBox="0 0 24 32" width="66" height="88" shapeRendering="crispEdges" aria-label="手机放置位置示意">
              <rect x="0" y="0" width="24" height="32" fill={C.raised} />
              <rect x="8" y="2" width="8" height="10" fill={C.border} />
              <rect x="6" y="12" width="5" height="18" fill={C.border} />
              <rect x="13" y="12" width="5" height="18" fill={C.border} />
              <rect x="7" y="14" width="3" height="6" fill={C.gold} />
            </svg>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ font: `700 16px/1.5 ${F.sans}`, color: C.text }}>裤子前侧口袋，屏幕朝外</div>
              <div style={{ font: `400 13px/1.7 ${F.sans}`, color: C.muted }}>
                MVP 只支持这一个位置。同一个深蹲放在不同位置会产生完全不同的波形。
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <Label>PERMISSION</Label>
          <div style={{ font: `900 18px/1.5 ${F.sans}`, color: C.text }}>需要运动传感器权限</div>
          <div style={{ font: `400 14px/1.8 ${F.sans}`, color: C.body }}>
            FitQuest 用加速度计和陀螺仪判断你的动作。数据仅在本机处理，不上传原始数据。
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <PixelButton size={10} onClick={request}>
              允许
            </PixelButton>
            <PixelButton size={10} variant="secondary" onClick={onDone}>
              稍后
            </PixelButton>
          </div>
          {asked && (
            <div
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
            </div>
          )}
        </Panel>

        <Panel accent={C.border}>
          <Label>首次奖励</Label>
          <div style={{ display: 'grid', gap: 8, font: `400 13px/1.6 ${F.sans}`, color: C.body }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>击败第一个 Boss</span>
              <span style={{ color: C.green }}>+60 XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>每完成一次动作</span>
              <span style={{ color: C.green }}>+2 XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>最低任务 5 分钟</span>
              <span style={{ color: C.green }}>+20 XP · 保住 Streak</span>
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ padding: 16, borderTop: `3px solid ${C.goldDeep}`, background: C.raised }}>
        <PixelButton onClick={onDone} style={{ width: '100%' }}>
          进入冒险
        </PixelButton>
      </div>
    </div>
  )
}
