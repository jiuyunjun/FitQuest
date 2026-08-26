# FitQuest Design

## 1. 项目概述

FitQuest 是一个将现实健身行为游戏化的轻量健身产品。

核心目标不是提供更多健身知识，而是解决：

> 用户明明知道应该运动，但缺少即时反馈、兴趣和持续行动动力。

产品通过手机 IMU（加速度计、陀螺仪）识别用户的真实训练动作，并将运动行为实时转化为游戏中的攻击、经验、装备、探索资源等奖励。

第一阶段优先验证一个核心假设：

> 用户是否会因为“想击败 Boss / 获得游戏奖励”，主动多做几分钟运动。

---

## 2. 产品原则

### 2.1 行为优先，而非数据优先

产品不以传统健身 Dashboard 为中心，不强调：

- 卡路里
- BMI
- 大量运动图表
- 复杂训练计划
- 大量健康指标

核心交互应该是：

现实运动 → 即时反馈 → 游戏奖励 → 下一次行动

---

### 2.2 即时反馈

长期目标，例如：

- 减重 20 kg
- 三个月变瘦
- 一个月提高体能

反馈周期过长。

FitQuest 将其转换成：

- 再做 5 个深蹲 Boss 就会死亡
- 再走 8 分钟可以打开宝箱
- 今天完成最低任务即可保住连续冒险
- 再完成一次训练即可升级

---

### 2.3 不因一次中断惩罚用户

传统 Streak 系统容易造成：

> 一天没完成 → 连续记录归零 → 放弃

FitQuest 提供最低任务 / 保命任务。

例如：

正常任务：

- 30 分钟训练

最低任务：

- 3~5 分钟运动

完成最低任务可以保持连续记录，但奖励减少。

---

## 3. MVP 范围

第一版只验证游戏机制和 IMU 自动识别是否足够有趣。

### 3.1 MVP 功能

1. 今日 Boss
2. 实时动作识别
3. 动作计数
4. Boss HP / Damage
5. XP / Level
6. 连续冒险 Streak
7. 最低任务
8. 基础历史记录

暂不实现：

- 饮食记录
- 社交
- 好友排行榜
- AI 私教
- 复杂训练计划
- GPS 大地图探索
- Apple Watch / Wear OS
- 50+ 种动作识别
- 完整健康管理

---

## 4. 核心用户流程

```text
打开 FitQuest
    ↓
看到今日 Boss
    ↓
选择 / 自动推荐训练
    ↓
允许 Motion Sensor 权限
    ↓
开始训练
    ↓
IMU 实时采集
    ↓
动作识别
    ↓
Rep Counting
    ↓
Boss 实时掉血
    ↓
击败 Boss
    ↓
XP / Loot / Streak
    ↓
结束训练
```

---

## 5. 首页设计

首页不采用传统健身 Dashboard。

示例：

```text
DAY 17

今日 Boss
巨型史莱姆

HP
██████░░░░ 62 / 100

今日完成：

✓ 4200 步
✓ 15 分钟步行
✓ 12 个深蹲

Boss 剩余 HP：27

推荐：
再完成 10 个深蹲

预计伤害：30

[ 开始战斗 ]
```

底部导航建议仅保留：

- 冒险
- 角色
- 图鉴
- 数据

---

## 6. 游戏系统

### 6.1 Boss

每一天生成一个 Boss。

Boss 拥有：

- HP
- 等级
- 类型
- 难度
- 掉落
- 特殊效果

用户通过现实运动造成伤害。

示例：

| 行为        | 基础伤害 |
| ----------- | -------: |
| 深蹲 1 次   |        2 |
| 开合跳 1 次 |        1 |
| 俯卧撑 1 次 |        3 |
| 步行 1 分钟 |        2 |
| 跑步 1 分钟 |        5 |

最终数值需要根据实际留存和运动量调参。

---

### 6.2 Damage

初期：

```text
Damage = BaseDamage × QualityMultiplier
```

例如：

```text
标准深蹲
BaseDamage = 5

动作质量 = 0.9

Damage = 4.5
```

可以增加暴击：

```text
高质量动作
→ Critical Hit
→ 1.5x Damage
```

---

### 6.3 XP

运动行为产生 XP。

XP 用于：

- 玩家等级
- 新地图
- 装备
- Boss 解锁
- 外观
- 称号

不建议直接将卡路里换算为 XP。

原因：

- 卡路里估算误差较大
- 容易导致“运动多少就吃回来多少”的错误激励

应奖励行为本身。

---

### 6.4 Streak

连续完成每日任务可以增加连续冒险天数。

同时提供最低任务。

例如：

```text
标准任务
30 分钟运动
+100 XP

最低任务
5 分钟运动
+20 XP
维持 Streak
```

可限制：

- 最低任务不能连续多天使用
- 每周 / 每月存在使用次数限制

---

### 6.5 健身银行

未来可以加入 Weekly Fitness Bank。

例如：

```text
本周目标
210 分钟

已完成
165 / 210 分钟
```

允许某一天多运动抵消另一天少运动。

避免用户被“每天必须完成”绑死。

---

## 7. 动作识别架构

### 7.1 原则

不要直接让模型负责所有事情。

推荐：

```text
IMU
 ↓
预处理
 ↓
动作分类模型
 ↓
动作类型
 ↓
状态机
 ↓
次数统计
 ↓
动作质量评分
 ↓
游戏奖励
```

职责分离：

模型负责：

> 这是什么动作？

状态机负责：

> 是否完成了一次完整动作？

算法负责：

> 动作质量如何？

---

## 8. Sensor 输入

目标传感器：

```text
Accelerometer
ax ay az

Gyroscope
gx gy gz
```

输入共 6 个 channel。

建议初始采样：

```text
25~50 Hz
```

默认目标：

```text
50 Hz
```

滑动窗口：

```text
2 秒
```

模型输入：

```text
100 × 6
```

即：

```text
[
  ax,
  ay,
  az,
  gx,
  gy,
  gz
]
```

连续 100 个采样点。

---

## 9. IMU 数据处理

建议 Pipeline：

```text
Raw IMU
  ↓
Timestamp 对齐
  ↓
Resampling
  ↓
异常值处理
  ↓
Low-pass Filter
  ↓
Normalization
  ↓
Sliding Window
  ↓
Model
```

需要重点处理：

- 不同手机采样率不同
- Sensor noise
- 手机方向变化
- 坐标轴变化
- 传感器漂移
- 丢帧
- 浏览器调度抖动

---

## 10. 动作分类模型

### 10.1 MVP 推荐

优先使用：

```text
1D CNN
```

而不是一开始采用大型 Transformer 或 LLM。

理由：

- 模型小
- 推理快
- 训练简单
- Web 端容易部署
- WASM 即可运行
- 非常适合 IMU time-series

---

### 10.2 初始类别

第一阶段只做约 5~7 类：

```text
idle
walking
running
squat
jumping_jack
push_up
sit_up
```

如果手机位置不适合某些动作，则先删除对应类别。

优先保证：

> 少量动作识别准确

而不是：

> 支持很多动作但误判严重

---

## 11. Rep Counting

模型不直接输出次数。

例如 Squat：

```text
STANDING
   ↓
DESCENDING
   ↓
BOTTOM
   ↓
ASCENDING
   ↓
STANDING

rep += 1
```

每个动作定义独立状态机。

优势：

- 防止抖动重复计数
- 可定义完整动作
- 可以处理半程动作
- 更容易 debug
- 更容易调整阈值

---

## 12. 动作质量评分

后续支持：

```text
Quality =
ROM
+ Tempo
+ Stability
+ Completion
```

示例：

```text
Squat #12

ROM        92%
Tempo      87%
Stability  81%
Completion 100%

Quality
89%
```

映射游戏：

```text
Quality < 60%
MISS

60~80%
Normal Hit

80~95%
Good Hit

>95%
Critical Hit
```

注意：

IMU 并不能可靠判断所有人体关节角度。

因此不要宣称：

> 可以准确判断医学意义上的标准动作。

质量评分应定义为：

> 基于 IMU waveform 的动作一致性 / 完整度评分。

---

## 13. 手机位置

这是系统最大的技术约束之一。

IMU 强依赖 Sensor Placement。

例如：

```text
裤兜
手持
上臂
胸前
桌面
```

同一个深蹲会产生完全不同的 waveform。

MVP 应明确规定位置，例如：

> 训练时请将手机放在裤子前侧口袋。

避免第一版试图做到：

> 手机放在哪里都能识别。

---

## 14. Web 推理

推荐技术路线：

```text
PyTorch
   ↓
Export ONNX
   ↓
model.onnx
   ↓
ONNX Runtime Web
   ↓
WASM
```

WebGPU 可以作为后续加速方案，但第一版不依赖。

模型足够小的情况下：

```text
WASM
```

即可满足实时推理。

---

## 15. Web Runtime

建议：

```text
TypeScript
React / Vue
ONNX Runtime Web
Web Worker
IndexedDB
Service Worker
```

其中：

Web Worker：

- Sensor preprocessing
- Model inference
- 避免 UI thread 卡顿

IndexedDB：

- 模型缓存
- 用户本地训练数据
- Session history

Service Worker：

- PWA
- Offline capability
- 静态资源缓存

---

## 16. Web Sensor

普通 H5 可以根据浏览器能力使用：

```text
DeviceMotionEvent
DeviceOrientationEvent
Generic Sensor API
```

需要注意：

- HTTPS
- iOS 权限请求
- Safari 限制
- 后台暂停
- 锁屏暂停
- 不同机型差异

FitQuest Web 版定位：

> 用户主动打开页面进行一段训练。

不定位为：

> 全天后台运动监控。

---

## 17. 小程序方案

微信小程序可以作为 MVP 容器。

推荐：

```text
微信 Sensor API
   ↓
JS preprocessing
   ↓
Rule Engine / Lightweight Model
   ↓
Rep Counting
   ↓
Game Logic
```

第一版甚至可以不用 Neural Network。

对于：

- Squat
- Jumping Jack
- Sit-up

可以先尝试：

```text
Filter
+
Peak Detection
+
State Machine
```

验证产品之后再加入模型。

---

## 18. 小程序与 H5 的关系

不要假设：

```text
微信小程序
=
普通 Browser
```

两者 Runtime 不同。

推荐抽象：

```text
SensorAdapter

├─ BrowserSensorAdapter
└─ WeChatSensorAdapter
```

上层统一：

```ts
interface SensorSample {
  timestamp: number

  ax: number
  ay: number
  az: number

  gx: number
  gy: number
  gz: number
}
```

后续所有算法共用。

---

## 19. 模型与业务解耦

定义统一 Model Interface：

```ts
interface ActivityPrediction {
  activity: ActivityType
  confidence: number
}

interface ActivityClassifier {
  predict(
    samples: SensorSample[]
  ): Promise<ActivityPrediction>
}
```

实现：

```text
RuleClassifier

OnnxClassifier

RemoteClassifier
```

方便后续替换算法。

---

## 20. 推荐代码结构

```text
src/

  sensor/
    SensorAdapter.ts
    BrowserSensorAdapter.ts
    WeChatSensorAdapter.ts

  signal/
    filter.ts
    resample.ts
    normalize.ts
    window.ts

  ml/
    ActivityClassifier.ts
    OnnxClassifier.ts
    RuleClassifier.ts

  exercise/
    SquatStateMachine.ts
    JumpingJackStateMachine.ts
    PushupStateMachine.ts

  quality/
    rom.ts
    tempo.ts
    stability.ts

  game/
    Boss.ts
    DamageCalculator.ts
    XPSystem.ts
    QuestSystem.ts
    StreakSystem.ts

  storage/
    SessionRepository.ts
    UserRepository.ts

  ui/
    ...

```

---

## 21. Backend

MVP Backend 只负责：

```text
User
Game State
Boss
XP
Inventory
History
Leaderboard（未来）
```

不建议上传原始 IMU。

客户端上传：

```json
{
  "exercise": "squat",
  "reps": 20,
  "duration": 56,
  "quality": 0.87
}
```

优势：

- 隐私好
- 带宽小
- 延迟低
- Backend 成本低

---

## 22. 原始数据

开发阶段为了训练模型，可以在用户明确同意的情况下收集：

```text
timestamp
ax
ay
az
gx
gy
gz
label
device
placement
```

正式版本默认：

> 原始 IMU 仅在设备本地处理。

如果未来用于训练，应单独获得 consent。

---

## 23. 数据采集

训练 HAR 模型最重要的不是网络结构，而是 Dataset。

第一阶段需要自己采数据。

建议每个动作：

```text
5~10 人
3~5 分钟 / 人
多种速度
多种动作幅度
```

并采：

- 正常动作
- 半程动作
- 停顿
- 错误动作
- 动作切换
- idle
- 走动
- 误触场景

尤其要加入 Negative Samples。

否则真实环境误判率会很高。

---

## 24. Dataset Label

每条 Session 保存：

```json
{
  "activity": "squat",
  "placement": "front_pocket",
  "device": "Pixel",
  "sample_rate": 50,
  "user": "anonymous-001"
}
```

训练前统一：

```text
Resample → 50 Hz
```

---

## 25. Model Metrics

不要只看 Accuracy。

重点看：

```text
Precision
Recall
F1
Confusion Matrix
False Positive Rate
```

尤其关注：

```text
idle → squat
walking → squat
phone shake → exercise
```

这种 False Positive。

因为游戏存在奖励，错误识别会直接导致作弊。

---

## 26. Anti-Cheat

FitQuest 存在天然作弊问题：

用户可以：

> 拿手机摇一摇刷 XP。

第一阶段不需要完全解决，但算法设计要预留：

```text
Pattern Consistency
Frequency Range
Gyroscope Correlation
Duration
Motion Signature
Rep Timing
```

后续可以建立：

```text
Exercise Confidence
+
Anti-cheat Confidence
```

如果异常：

```text
不给奖励
或
降低奖励
```

---

## 27. LLM

第一版不需要接 LLM。

LLM 不应该处理 Raw IMU。

推荐架构：

```text
IMU
↓
Tiny Model
↓
Activity + Reps + Quality
↓
Game / Training Engine
↓
LLM
```

LLM 后期负责：

- 调整每日任务
- 生成训练建议
- 根据完成率调整难度
- 生成 Boss 描述
- 生成 Quest
- 自然语言反馈
- 周总结

示例输入：

```json
{
  "completionRate7d": 0.62,
  "trainingDays7d": 3,
  "today": {
    "squat": 12,
    "walkingMinutes": 15
  },
  "fatigue": "medium"
}
```

而不是发送：

```text
数万条 IMU raw samples
```

---

## 28. Dynamic Difficulty Adjustment

推荐建立 DDA。

目标：

> 每日任务保持在“稍微困难但大概率完成”的范围。

例如：

```text
过去 7 天完成率 < 40%
→ Quest Difficulty -30%

40~70%
→ 保持

70~90%
→ +10%

>90%
→ +20%
```

但调整幅度必须限制，避免 Difficulty oscillation。

---

## 29. Phase 1

目标：

> 验证 IMU + Boss 是否有趣。

实现：

```text
Web / 小程序
↓
Squat
Jumping Jack
Idle
↓
Rule Engine
↓
Rep Counting
↓
Boss
```

此阶段甚至可以完全没有 ML。

---

## 30. Phase 2

如果玩法成立：

加入：

```text
ONNX 1D-CNN

walking
running
squat
jumping_jack
push_up
sit_up
idle
```

并加入：

- Quality
- XP
- Loot
- Level
- Streak

---

## 31. Phase 3

原生 App：

```text
Android
iOS
```

加入：

- TensorFlow Lite
- Core ML
- Health Connect
- HealthKit
- Background workout
- GPS
- Notifications

---

## 32. Phase 4

Wearables：

```text
Apple Watch
Wear OS
```

手表 IMU 特别适合识别：

- Curl
- Row
- Shoulder Press
- Pull-up
- Boxing
- Jump Rope

手机 + 手表可以做 sensor fusion。

---

## 33. 最终产品架构

```text
                   ┌───────────────┐
                   │   Sensors     │
                   │ Phone / Watch │
                   └───────┬───────┘
                           ↓
                   ┌───────────────┐
                   │ Signal Layer  │
                   │ Filter/Window │
                   └───────┬───────┘
                           ↓
                   ┌───────────────┐
                   │ TinyML / HAR  │
                   │ Activity      │
                   └───────┬───────┘
                           ↓
                   ┌───────────────┐
                   │ Rep Counter   │
                   │ Quality       │
                   └───────┬───────┘
                           ↓
                   ┌───────────────┐
                   │ Game Engine   │
                   │ Boss / XP     │
                   └───────┬───────┘
                           ↓
             ┌─────────────┴─────────────┐
             ↓                           ↓
      ┌─────────────┐             ┌─────────────┐
      │ Local UI    │             │ Backend     │
      │ Battle      │             │ Sync/User   │
      └─────────────┘             └──────┬──────┘
                                        ↓
                                 ┌─────────────┐
                                 │ LLM Layer   │
                                 │ Coach / DDA │
                                 └─────────────┘
```

---

## 34. 最重要的验证指标

MVP 不应该优先关注模型 Accuracy。

首先关注产品指标：

### 核心指标

> 用户因为 FitQuest 比原本多运动了多少？

可以记录：

```text
Sessions / Week
Exercise Minutes / Week
Average Reps
Quest Completion Rate
D1 / D7 / D30 Retention
Streak Recovery Rate
```

尤其值得观察：

```text
Boss HP 剩余 <20%
```

时，用户是否明显更容易继续运动。

如果是，则说明游戏反馈确实在改变行为。

---

## 35. MVP Success Criteria

可以定义：

```text
测试用户 ≥ 20

连续测试 ≥ 14 天

D7 Retention > 30%

每周平均主动训练次数增加

至少 30% 用户曾因为：
“Boss 快死了”
而额外运动
```

模型识别则要求：

```text
主要动作 F1 > 90%

Rep Count Error < 5%

False Exercise Trigger 尽可能低
```

实际阈值应根据用户测试调整。

---

## 36. 最小可执行版本

如果只用一个周末 / 几天做 Prototype：

只实现：

```text
Web
+
DeviceMotion
+
Squat State Machine
+
Boss HP
```

用户：

```text
打开网页
↓
手机放裤兜
↓
开始
↓
做深蹲
↓
每次深蹲 Boss -5 HP
↓
Boss 死亡
```

如果这个版本本身就不好玩：

> 不应该马上增加 AI、LLM、装备、地图等复杂功能。

如果它已经让用户产生：

> “再做两个，把 Boss 打死。”

那么产品核心机制已经得到第一次验证。

---

## 37. 技术决策总结

### MVP

```text
Frontend:
TypeScript + Web / 微信小程序

Sensor:
Accelerometer + Gyroscope

Detection:
Rules + State Machine

Inference:
无 / ONNX Runtime Web + WASM

Backend:
轻量 API + DB

Raw IMU:
默认不上传
```

### 后续

```text
Training:
PyTorch

Model:
1D-CNN / Tiny HAR

Export:
ONNX

Web:
ONNX Runtime Web

Android:
TFLite / ONNX Runtime Mobile

iOS:
Core ML / ONNX Runtime Mobile

Wearable:
Watch IMU

LLM:
训练计划 / DDA / 文本反馈
```

---

## 38. 产品核心判断

FitQuest 不应被定义为：

> 一个可以识别健身动作的 App。

而应该定义为：

> 一个把现实运动变成游戏操作的系统。

IMU、TinyML、LLM 都只是实现这个体验的技术。

最需要验证的不是：

> 模型能不能识别 30 种动作？

而是：

> 当 Boss 只剩 10 HP 时，用户会不会愿意再做 5 个深蹲？

如果答案是 Yes，则值得继续投入。