# FitQuest MVP

把现实运动变成游戏操作。手机 IMU 实时识别深蹲 / 开合跳，每一次动作对今日 Boss 造成伤害。

**微信小程序 + H5 双端**，同一套代码（Taro 4 + React）。
`sensor/` 以下的信号处理、计数、游戏逻辑两端完全共享，
只有传感器接入、本地存储、屏幕常亮这几处按平台分流。

UI 完全按 Claude Design 的「FitQuest 设计系统」实现：8-bit RPG，硬边框 + 硬投影，无圆角、无渐变、无模糊阴影。

## 跑起来

Windows 直接双击 `startup.bat`（首次会自动装依赖）：

```
startup.bat          桌面调试 H5，自动开浏览器（mock 传感器）
startup.bat weapp    微信小程序，watch 编译到 dist\weapp
startup.bat phone    手机浏览器调试，https + 局域网
startup.bat build    生产构建（小程序 + H5）
startup.bat check    类型检查 + 计数验证 + 渲染冒烟
```

或者直接用 npm：

```bash
npm install
npm run dev:weapp    # 小程序，watch 编译
npm run dev:h5       # H5，dev server 在 :10086
npm run build        # 两端一起构建
```

### 微信小程序

```bash
npm run dev:weapp
```

然后打开**微信开发者工具** → 导入项目 → 选择本目录（不是 `dist/weapp`，
`project.config.json` 里已经把 `miniprogramRoot` 指向它了）。
AppID 填自己的，或者点「测试号」。代码改动会自动重编译并刷新。

**模拟器没有加速度计**，右上角「普通编译」下拉里选「mock 传感器」这个编译模式
（等价于 `?mock=1`），用合成波形跑通整条链路。**真机预览**才能拿到真实 IMU。

小程序不需要单独申请加速度计权限，没有授权弹窗；
`WeappSensorAdapter.requestPermission()` 是真的启一次传感器来探测，
模拟器和缺传感器的机型会在这里落到手动计数降级路径。

### H5

桌面没有 IMU，加 `?mock=1` 会用合成的 50Hz 深蹲波形驱动整条链路：

```
http://localhost:10086/?mock=1
```

手机上用 `startup.bat phone`（即 `HTTPS=1 npm run dev:h5`），
访问终端里打印的 `https://<局域网 IP>:10086`，接受自签证书警告。
iOS 必须在用户手势里请求权限——首屏的「允许」按钮和战斗页的开始都满足这一点。

### 真机调试面板

编译模式选「传感器标定」（等价于 `?debug=1`），战斗页顶部会多出两块，
**只在这个模式下出现，正式用户看不到**：

1. **原始读数** `ax / ay / az / |a|` —— `|a|` 是状态机真正吃的三轴模长，
   静止时应稳定在 9.8 附近（绿色）。掉到 1.0 左右说明 g→m/s² 换算没生效。
2. **状态机内部量** —— 当前状态（`STANDING` / `DESCENDING` / `BOTTOM` / `ASCENDING`）、
   静止基线、相对基线的偏移 `value`，以及一条带两道阈值线的横杠。

调阈值时唯一有意义的画面是那条横杠：

- 做一个标准动作，亮块要**越过右边的 confirm 线**（越不过 = 漏计）
- 站着不动或原地走，亮块**不许碰到左边的 enter 线**（碰到 = 误计）

光看 reps 数字分不清漏计和误计，看这条横杠能当场分清。

3. **最近一次 rep 的评分链路** —— `q / conf / hp / dmg` 加四项分数拆解，
   最低的那一项标红。**「计数在涨但血条不动」看这一条就够**：
   `dmg` 是 0 时，原因只可能是 `q < 0.6`（判 MISS，看哪一项拖垮的）、
   `conf < 0.5`（被反作弊掐掉）、或者 `hp` 本来就是 0（今日 Boss 已击败）。

震动和音效不是 debug 专属，是正式行为（见上「MVP 做了什么」）。
标定时正好借它定位：该震没震是漏计，没动却震是误计，
比做完一组回头看总数有用得多。

### 验证计数与质量评分

```bash
npm run repcheck
```

当前合成波形结果：深蹲 20/20、10/10 计数准确，静止与走路 0 误触发；开合跳 17/20（正弦波不是真实落地波形，需要真机数据再调阈值）。

## MVP 做了什么

- 今日 Boss（按日期确定性生成，同一天刷新不变）、HP、弱点动作 ×1.5
- IMU 采样 → 低通 → 基线 → 状态机 → Rep Counting
- 动作质量评分（ROM / Tempo / Stability / Completion）→ MISS / NORMAL / GOOD / CRITICAL
- Damage = BaseDamage × Quality × 弱点 × 暴击 × 反作弊置信度
- XP / 等级 / 连续冒险 Streak / 最低任务（5 分钟保住记录，不清零）
- 掉落与开箱：概率公开、保底 11 次必出金、无空箱
- 图鉴、角色属性（由真实行为累积）、周训练数据
- 权限被拒或机型不支持时的手动计数降级路径
- 采样率 < 25Hz 时明确提示「计数可能不准」，不静默继续
- 训练中申请屏幕常亮：小程序息屏会被挂起，传感器回调直接断
- 每次计数出震动 + 8-bit 打击音（音高随质量分级，暴击是两段上行）。
  手机在裤兜里屏幕看不见，这是唯一还通着的反馈通道，所以 MISS 也给反馈。
  音效是 WebAudio 方波实时合成的，没有音频资源文件

## 刻意没做

饮食、社交、好友榜、AI 私教、GPS 地图、ONNX 模型、后端同步。
MVP 只验证一件事：**Boss 只剩 10 HP 时，用户会不会再做 5 个深蹲。**

小程序侧也没做：微信登录、云开发、分享卡片、订阅消息。存档全在本机。

## 代码结构

```
config/       Taro 构建配置（两端共用一份）
src/
  app.tsx     Taro 应用入口（全局 Provider）
  app.config.ts / pages/index/  唯一一个小程序页面，内部自己路由
  Game.tsx    屏幕切换（冒险 / 角色 / 图鉴 / 数据 / 战斗 / 结算）
  platform/   env（平台判定 + 时钟 + 启动参数）、font、screen
  sensor/     SensorAdapter 抽象 + Browser / Weapp / Mock 实现
  signal/     低通、滑动均值、采样率统计、滑窗
  exercise/   深蹲 / 开合跳状态机、质量评分
  game/       Boss、伤害、XP、Streak、掉落、反作弊
  storage/    本地存档（原始 IMU 不落盘、不上传）
  ui/         设计系统 token + 元件 + 屏幕
scripts/
  shim/       Node 冒烟测试用的 @tarojs/* 替身
```

平台分流只有三处，全部收在接口后面：

| | 小程序 | H5 |
| --- | --- | --- |
| IMU | `wx.startAccelerometer` / `startGyroscope` | `DeviceMotionEvent` |
| 存档 | `wx.setStorageSync` | `localStorage` |
| 常亮 | `wx.setKeepScreenOn` | 不做 |

上层拿到的都是同一个 `SensorSample`，`exercise/` 和 `game/` 不知道自己跑在哪。

`signal/window.ts` 里的 `SlidingWindow` 已经按 100×6 预留，接 ONNX 1D-CNN 时
只需要新增 `ml/OnnxClassifier.ts` 并在 `useTraining` 里把 rule-based 状态机换掉，
`exercise/` 与 `game/` 不用改。

## 已知限制

- 只支持一个手机位置：**裤子前侧口袋，屏幕朝外**。换位置波形完全不同。
- 俯卧撑在这个位置无法可靠识别，只提供手动计数。
- 阈值是按合成波形调的，真机数据到手后需要重新标定 `SquatStateMachine` 的
  `enterDepth` / `bottomDepth` 和 `JumpingJackStateMachine` 的 `peakThreshold`。
- **小程序的传感器读数还没在真机上验过。** 微信给的是 g，`WeappSensorAdapter`
  乘了 9.80665 换算成 m/s² 才和 DeviceMotion 对齐。
  校验方法：编译模式选「传感器标定」（`debug=1`），战斗页顶部会显示实时
  `ax / ay / az / |a|`，手机静止时 `|a|` 应该稳定在 9.8 附近。
  掉到 1.0 左右说明换算没生效 —— 状态机吃的就是这个模长，差 9.8 倍阈值全废。
  单轴符号对 MVP 计数不敏感（模长与符号无关），`AXIS` 常量是给 Phase 2
  接 ONNX 时用的，那时 6 通道原始数据的轴向才要紧。
- 像素字体在小程序上默认不加载：`platform/font.ts` 里的 `PIXEL_FONT_URL` 是空的，
  填之前小程序侧会落到 monospace 兜底。填了还要把域名加进小程序后台的
  downloadFile 合法域名，否则真机静默失败。
- 反作弊只降低伤害、不封禁，摇手机仍能刷到部分 XP。
