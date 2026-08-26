import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playHit } from '../platform/audio'
import { isDebug, now } from '../platform/env'
import { repTick } from '../platform/haptics'
import { keepScreenOn } from '../platform/screen'
import { createSensorAdapter } from '../sensor/createSensorAdapter'
import type { PermissionState, SensorAdapter, SensorSample } from '../sensor/SensorAdapter'
import { SampleRateMeter } from '../signal/rate'
import { createDetector, qualityTier } from '../exercise'
import type { DetectorDebug, ExerciseId, QualityBreakdown, RepEvent } from '../exercise/types'
import { AntiCheat } from '../game/AntiCheat'
import { calcDamage } from '../game/DamageCalculator'
import type { Boss } from '../game/Boss'

export type SensorStatus = 'idle' | 'calibrating' | 'ok' | 'low_rate' | 'denied' | 'manual'

export interface HitFeedback {
  id: number
  damage: number
  critical: boolean
  weakness: boolean
  quality: number
}

/**
 * 一次 rep 的完整评分链路，debug 模式专用。
 *
 * 「计数在涨但血条不动」只有三种可能，这个结构一次分清：
 * quality < 0.6 判 MISS（看 breakdown 是哪一项拖垮的）、
 * confidence < 0.5 被反作弊掐掉、或者 Boss 血本来就是 0。
 */
export interface RepDiagnostic {
  quality: number
  breakdown: QualityBreakdown
  confidence: number
  damage: number
  bossHpBefore: number
}

export function useTraining(exercise: ExerciseId, boss: Boss) {
  const adapter = useMemo<SensorAdapter>(() => createSensorAdapter(), [])
  const detector = useMemo(() => createDetector(exercise), [exercise])
  const antiCheat = useMemo(() => new AntiCheat(), [])
  const meter = useMemo(() => new SampleRateMeter(), [])

  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<SensorStatus>('idle')
  const [hz, setHz] = useState(0)
  const [reps, setReps] = useState(0)
  const [damageDealt, setDamageDealt] = useState(0)
  const [qualitySum, setQualitySum] = useState(0)
  const [hits, setHits] = useState<HitFeedback[]>([])
  const [elapsed, setElapsed] = useState(0)

  // 标定用的原始读数。采样是 50Hz，直接 setState 会把渲染打爆，
  // 所以只写 ref，由下面 500ms 的心跳统一取一帧出来渲染。
  const debug = isDebug()
  const [sample, setSample] = useState<SensorSample | null>(null)
  const sampleRef = useRef<SensorSample | null>(null)
  const [detail, setDetail] = useState<{ state: string; d: DetectorDebug } | null>(null)
  /** 最近一次 rep 的评分拆解。血条不动时，答案基本都在这里。 */
  const [lastRep, setLastRep] = useState<RepDiagnostic | null>(null)

  const startedAt = useRef(0)
  const hitId = useRef(0)
  const damageRef = useRef(0)
  const bossRef = useRef(boss)
  bossRef.current = boss

  const registerRep = useCallback(
    (rep: RepEvent) => {
      // 手机在裤兜里屏幕是看不见的，震动 + 音效是唯一还通着的反馈通道。
      // 放在最前面：先出反馈，再算伤害，避免计算把手感拖慢。
      const tier = qualityTier(rep.quality)
      repTick(tier)
      playHit(tier)

      const confidence = antiCheat.observe(rep, now())
      const remaining = Math.max(0, bossRef.current.hp - damageRef.current)
      const res = calcDamage(exercise, rep.quality, bossRef.current, confidence)
      const applied = Math.min(res.damage, remaining)
      damageRef.current = Math.round((damageRef.current + applied) * 10) / 10

      setReps((r) => r + 1)
      setQualitySum((q) => q + rep.quality)
      setDamageDealt(damageRef.current)
      hitId.current++
      const feedback: HitFeedback = {
        id: hitId.current,
        damage: applied,
        critical: res.critical,
        weakness: res.weakness,
        quality: rep.quality,
      }
      if (debug) {
        setLastRep({
          quality: rep.quality,
          breakdown: rep.breakdown,
          confidence: Math.round(confidence * 100) / 100,
          damage: applied,
          bossHpBefore: remaining,
        })
      }
      setHits((h) => [...h, feedback].slice(-4))
      setTimeout(() => {
        setHits((h) => h.filter((x) => x.id !== feedback.id))
      }, 900)
    },
    [antiCheat, debug, exercise],
  )

  const start = useCallback(async () => {
    const permission: PermissionState = adapter.isSupported()
      ? await adapter.requestPermission()
      : 'unsupported'

    detector.reset()
    antiCheat.reset()
    meter.reset()
    damageRef.current = 0
    setReps(0)
    setDamageDealt(0)
    setQualitySum(0)
    setElapsed(0)
    startedAt.current = now()
    setRunning(true)
    keepScreenOn(true)

    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'manual')
      return permission
    }

    setStatus('calibrating')
    adapter.start((s) => {
      meter.push(s.timestamp)
      if (debug) sampleRef.current = s
      const rep = detector.push(s)
      if (rep) registerRep(rep)
    })
    return permission
  }, [adapter, antiCheat, detector, meter, registerRep])

  const stop = useCallback(() => {
    adapter.stop()
    keepScreenOn(false)
    setRunning(false)
    setStatus('idle')
  }, [adapter])

  /** 权限被拒或机型不支持时的降级路径：手动点一次算一次，质量固定 0.8。 */
  const manualRep = useCallback(() => {
    registerRep({
      index: 0,
      durationMs: 2000,
      quality: 0.8,
      breakdown: { rom: 0.8, tempo: 0.8, stability: 0.8, completion: 0.8 },
    })
  }, [registerRep])

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      setElapsed(Math.round((now() - startedAt.current) / 1000))
      const rate = meter.hz
      setHz(rate)
      if (debug) {
        setSample(sampleRef.current)
        setDetail({ state: detector.stateName, d: detector.debug })
      }
      setStatus((s) => {
        if (s === 'denied' || s === 'manual') return s
        if (rate === 0) return 'calibrating'
        return rate < 25 ? 'low_rate' : 'ok'
      })
    }, 500)
    return () => clearInterval(timer)
  }, [debug, detector, meter, running])

  useEffect(
    () => () => {
      adapter.stop()
      keepScreenOn(false)
    },
    [adapter],
  )

  return {
    running,
    status,
    hz,
    reps,
    elapsed,
    damageDealt,
    hits,
    avgQuality: reps > 0 ? Math.round((qualitySum / reps) * 100) / 100 : 0,
    bossHpNow: Math.max(0, Math.round((boss.hp - damageDealt) * 10) / 10),
    phaseProgress: detector.phaseProgress,
    /** 仅 debug 模式有值：真机标定用的原始读数 + 状态机内部量。 */
    sample: debug ? sample : null,
    detail: debug ? detail : null,
    lastRep: debug ? lastRep : null,
    start,
    stop,
    manualRep,
  }
}
