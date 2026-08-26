import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserSensorAdapter } from '../sensor/BrowserSensorAdapter'
import { MockSensorAdapter } from '../sensor/MockSensorAdapter'
import type { PermissionState, SensorAdapter } from '../sensor/SensorAdapter'
import { SampleRateMeter } from '../signal/rate'
import { createDetector } from '../exercise'
import type { ExerciseId, RepEvent } from '../exercise/types'
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

const useMock = typeof location !== 'undefined' && new URLSearchParams(location.search).has('mock')

export function useTraining(exercise: ExerciseId, boss: Boss) {
  const adapter = useMemo<SensorAdapter>(
    () => (useMock ? new MockSensorAdapter() : new BrowserSensorAdapter()),
    [],
  )
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

  const startedAt = useRef(0)
  const hitId = useRef(0)
  const damageRef = useRef(0)
  const bossRef = useRef(boss)
  bossRef.current = boss

  const registerRep = useCallback(
    (rep: RepEvent) => {
      const confidence = antiCheat.observe(rep, performance.now())
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
      setHits((h) => [...h, feedback].slice(-4))
      window.setTimeout(() => {
        setHits((h) => h.filter((x) => x.id !== feedback.id))
      }, 900)
    },
    [antiCheat, exercise],
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
    startedAt.current = performance.now()
    setRunning(true)

    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'manual')
      return permission
    }

    setStatus('calibrating')
    adapter.start((sample) => {
      meter.push(sample.timestamp)
      const rep = detector.push(sample)
      if (rep) registerRep(rep)
    })
    return permission
  }, [adapter, antiCheat, detector, meter, registerRep])

  const stop = useCallback(() => {
    adapter.stop()
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
    const timer = window.setInterval(() => {
      setElapsed(Math.round((performance.now() - startedAt.current) / 1000))
      const rate = meter.hz
      setHz(rate)
      setStatus((s) => {
        if (s === 'denied' || s === 'manual') return s
        if (rate === 0) return 'calibrating'
        return rate < 25 ? 'low_rate' : 'ok'
      })
    }, 500)
    return () => window.clearInterval(timer)
  }, [meter, running])

  useEffect(() => () => adapter.stop(), [adapter])

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
    start,
    stop,
    manualRep,
  }
}
