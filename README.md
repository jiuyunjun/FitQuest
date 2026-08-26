# FitQuest MVP

把现实运动变成游戏操作。手机 IMU 实时识别深蹲 / 开合跳，每一次动作对今日 Boss 造成伤害。

UI 完全按 Claude Design 的「FitQuest 设计系统」实现：8-bit RPG，硬边框 + 硬投影，无圆角、无渐变、无模糊阴影。

## 跑起来

```bash
npm install
npm run dev          # 桌面调试
npm run dev:https    # 手机调试（DeviceMotion 需要安全上下文）
```

桌面没有 IMU，加 `?mock=1` 会用合成的 50Hz 深蹲波形驱动整条链路：

```
http://localhost:5173/?mock=1
```

手机上用 `npm run dev:https`，访问终端里打印的 `https://<局域网 IP>:5173`，接受自签证书警告。
iOS 必须在用户手势里请求权限——首屏的「允许」按钮和战斗页的开始都满足这一点。

验证计数与质量评分：

```bash
npm run repcheck
```

当前合成波形结果：深蹲 20/20、10/10 计数准确，静止与走路 0 误触发；开合跳 17/20（正弦波不是真实落地波形，需要真机数据再调阈值）。

## MVP 做了什么

- 今日 Boss（按日期确定性生成，同一天刷新不变）、HP、弱点动作 ×1.5
- DeviceMotion 采样 → 低通 → 基线 → 状态机 → Rep Counting
- 动作质量评分（ROM / Tempo / Stability / Completion）→ MISS / NORMAL / GOOD / CRITICAL
- Damage = BaseDamage × Quality × 弱点 × 暴击 × 反作弊置信度
- XP / 等级 / 连续冒险 Streak / 最低任务（5 分钟保住记录，不清零）
- 掉落与开箱：概率公开、保底 11 次必出金、无空箱
- 图鉴、角色属性（由真实行为累积）、周训练数据
- 权限被拒或机型不支持时的手动计数降级路径
- 采样率 < 25Hz 时明确提示「计数可能不准」，不静默继续

## 刻意没做

饮食、社交、好友榜、AI 私教、GPS 地图、ONNX 模型、后端同步。
MVP 只验证一件事：**Boss 只剩 10 HP 时，用户会不会再做 5 个深蹲。**

## 代码结构

```
src/
  sensor/     SensorAdapter 抽象 + Browser / Mock 实现
  signal/     低通、滑动均值、采样率统计、滑窗
  exercise/   深蹲 / 开合跳状态机、质量评分
  game/       Boss、伤害、XP、Streak、掉落、反作弊
  storage/    本地存档（原始 IMU 不落盘、不上传）
  ui/         设计系统 token + 元件 + 屏幕
  app/        游戏状态、训练会话 hook
```

`signal/window.ts` 里的 `SlidingWindow` 已经按 100×6 预留，接 ONNX 1D-CNN 时
只需要新增 `ml/OnnxClassifier.ts` 并在 `useTraining` 里把 rule-based 状态机换掉，
`exercise/` 与 `game/` 不用改。

## 已知限制

- 只支持一个手机位置：**裤子前侧口袋，屏幕朝外**。换位置波形完全不同。
- 俯卧撑在这个位置无法可靠识别，只提供手动计数。
- 阈值是按合成波形调的，真机数据到手后需要重新标定 `SquatStateMachine` 的
  `enterDepth` / `bottomDepth` 和 `JumpingJackStateMachine` 的 `peakThreshold`。
- 反作弊只降低伤害、不封禁，摇手机仍能刷到部分 XP。
