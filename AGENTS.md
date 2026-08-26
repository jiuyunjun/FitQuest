# AGENTS.md

给在这个仓库里干活的 AI agent 和新同事看的约定。**动手前先读完。**

---

## 0. 一句话

FitQuest 不是「一个能识别健身动作的 App」，是「一个把现实运动变成游戏操作的系统」。
所有取舍以 `DESIGN.md` 为准，代码只是实现手段。

---

## 1. 编码：全链路 UTF-8

Windows 环境最容易踩的坑，所有中文都在这里丢。

**读写文件一律 UTF-8（无 BOM）**，源码、`package.json`、`README.md`、`DESIGN.md` 都是。

PowerShell 的坑：

```powershell
# ❌ Set-Content / Add-Content 默认写系统 ANSI（中文变乱码）
Set-Content src/foo.ts $content

# ✅ 显式指定
Set-Content src/foo.ts $content -Encoding utf8
Out-File -Encoding utf8
```

Git Bash 里用 heredoc 或 python 写文件是安全的，不需要额外处理。

**`.bat` 文件例外，要三件事一起做**，少一件中文就炸：

1. 第二行 `chcp 65001 >nul`
2. 文件本身存成 UTF-8
3. 换行必须 **CRLF**（LF 的 `.bat` 在某些 `goto` / 多行块下会解析错乱）

`.gitattributes` 里已经标了 `startup.bat -text`，clone 到任何机器都不会被改成 LF。
新增 `.bat` / `.cmd` 记得同样加一行。

其余源码在仓库里存 LF，Git 的 `core.autocrlf` 会在检出时转成 CRLF，
所以 `git add` 时那一堆 `LF will be replaced by CRLF` 是**正常的**，不要去"修"它。

---

## 2. 提交：每次改动一个 commit

**改完一件事就提交，不要攒。** 一个 commit 只做一件事。

```bash
git add -A
git commit -F - <<'MSG'
一行祈使句标题，说清做了什么

为什么这么做、影响了哪些层、有什么已知限制。
中文正文，不用 emoji，不用 "feat:" 前缀。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

规则：

- **提交前必须 `npm run check` 通过**，见第 3 节
- 消息用中文，标题不超过一行，正文说清「为什么」而不是复述 diff
- 结尾带 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- 不要 `--amend` 已推送的 commit，加新的
- 不要 `--no-verify` 跳过钩子
- `node_modules/`、`dist/`、`scripts/.repcheck.mjs`、`scripts/.smoke.mjs` 已在 `.gitignore`，
  别硬加进来

推送：`git push`，远程是 `origin` → `github.com/jiuyunjun/FigQuest`
（仓库名是 `FigQuest`，项目名是 `FitQuest`，历史笔误，不是你看错了。）

---

## 3. 验证：`npm run check`

三步串起来，任何一步失败都不许提交：

```bash
npm run check
# = tsc --noEmit  →  npm run repcheck  →  npm run smoke
```

| 步骤 | 查什么 | 失败意味着 |
| --- | --- | --- |
| `tsc --noEmit` | 类型 | 严格模式，`noUnusedLocals` 开着 |
| `npm run repcheck` | 计数与质量评分 | 改了状态机 / 阈值 / 评分公式后必跑 |
| `npm run smoke` | 7 个屏幕在 Node 里渲染 | 组件运行时崩溃 |

**改了 `src/exercise/` 下任何东西，必须贴出 `repcheck` 的前后对比。**
当前基线（合成波形）：

```
squat 2.4s x20 amp3.4  -> reps 20, avgQ 0.96
squat 1.6s x20 amp4.5  -> reps 20, avgQ 0.87
squat 3.5s x10 amp5.0  -> reps 10, avgQ 0.98
squat idle             -> reps 0     ← 误触发必须保持 0
squat walking          -> reps 0     ← 误触发必须保持 0
jack  0.8s x20 amp5    -> reps 17, avgQ 0.76
jack  idle             -> reps 0
```

**误触发那两行掉到非 0，就是回归，不管计数变得多准。**
游戏有奖励，误判等于送作弊通道，宁可漏计也不要多计。

新增动作 / 改阈值时，在 `scripts/repcheck.ts` 里加对应的 negative case，别只加正样本。

---

## 4. 分层：别越界

```
sensor/    → 拿原始 IMU，只有这一层知道 DeviceMotion / 微信 API 的存在
signal/    → 滤波、基线、采样率、滑窗。纯函数，不认识游戏
exercise/  → 状态机数次数 + 质量评分。不认识 Boss
ml/        → 只回答"这是什么动作"，不数次数、不评质量
game/      → Boss / 伤害 / XP / Streak / 掉落 / 反作弊。不认识 React
storage/   → 本地存档
ui/        → 只消费上面的结果
app/       → 把它们粘起来（store + useTraining）
```

硬性要求：

- **`game/` 里不许 import React，`ui/` 里不许写游戏数值。**
  伤害公式改在 `DamageCalculator.ts`，不是在组件里。
- **Phase 2 接 ONNX 时，只应该新增 `ml/OnnxClassifier.ts` 并改 `app/useTraining.ts`。**
  如果你发现必须改 `game/` 才能接模型，说明分层被破坏了，停下来先修分层。
- `signal/window.ts` 的 `SlidingWindow` 已按 100×6 预留，别改签名。

---

## 5. 隐私：原始 IMU 不出设备

- **原始 IMU 不落盘、不上传、不进 localStorage。** 只存动作结果
  （`{ exercise, reps, duration, quality }`）。
- 要做数据采集训练模型，必须单独走用户明确同意，不能混进正常训练流程。
- `storage/SaveRepository.ts` 是唯一的持久化入口，别在组件里直接摸 `localStorage`。

---

## 6. UI：设计系统是硬约束

唯一来源是 Claude Design 项目「FitQuest 设计系统」，落地在 `src/ui/tokens.ts`。

- **颜色只能从 `C` 里取，字体只能从 `F` 里取。** 不要写字面量色值。
  （`#c9634f` 这个 Boss HP 色是设计稿里的 prop 默认值，是唯一例外，已注明。）
- 硬边框 3px、硬投影 `Npx Npx 0`、**无圆角、无渐变、无模糊阴影、无玻璃质感**
- 进度条分格用 3px gap，不用平滑条；XP 一类才用 `SolidBar`
- 点击目标不低于 44px
- 角色和场景一律用 8×8 像素占位图（`PixelSprite`），
  **禁止 CSS 手绘角色或写复杂 SVG 插画**，等美术替换
- 底部导航 4 项封顶，选中态是金色 + 深色底，不用下划线/圆点

---

## 7. 产品红线：这些改动直接拒绝

来自 `DESIGN.md` §2 / §9（设计系统 09、10、14 节）：

- ❌ 卡路里 / BMI 类健康指标出现在主流程
- ❌ Streak 归零式惩罚文案、"错过就没了"式倒计时压迫
- ❌ 付费抽卡、随机付费道具、绝版限时
- ❌ 近失动画（"差一点就中大奖"）
- ❌ 全球排行榜、"Alice 比你努力"式社交施压
- ❌ 主屏显示"已完成多少"而不是"**还剩多少**"

正向要求：

- 每屏只有一个明确的"继续运动"动作
- 随机只作用于「已完成的运动」，不作用于「是否要运动」；概率公开，无空箱
- 最低任务保 Streak，奖励减少但**不清零**
- 传感器降级要**说出来**：采样率 < 25Hz 明确提示"计数可能不准"，
  权限被拒切手动计数，**绝不静默继续**

---

## 8. 已知限制：别假装解决了

改代码时不要写出暗示这些问题已解决的文案或注释：

- **只支持一个手机位置**：裤子前侧口袋、屏幕朝外。换位置波形完全不同。
- 俯卧撑在这个位置识别不了，只有手动计数。
- 现有阈值是拿**合成正弦波**调的，不是真机数据。开合跳 17/20 已经超出
  `DESIGN.md` §35 的 <5% 误差目标，真机数据到手后要重标
  `SquatStateMachine` 的 `enterDepth` / `bottomDepth`
  和 `JumpingJackStateMachine` 的 `peakThreshold`。
- 质量评分是「基于 IMU waveform 的一致性 / 完整度」，
  **不是医学意义上的动作标准度**，任何 UI 文案都不许这么宣称。
- 反作弊只降伤害不封禁，摇手机仍能刷到部分 XP。

---

## 9. 环境

- Windows 11 / Node 22 / npm 10
- Vite 5 + React 18 + TypeScript 5（strict）
- 手机调试必须 https（`npm run dev:https` 或 `startup.bat phone`），
  DeviceMotion 要安全上下文，局域网 http 拿不到传感器
- 桌面没有 IMU，用 `?mock=1` 走 `MockSensorAdapter` 的合成波形
- iOS 的 `requestPermission()` **必须在用户手势里调**，
  别挪到 `useEffect` 顶层或页面加载时
