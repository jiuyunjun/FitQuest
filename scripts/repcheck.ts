import { SquatStateMachine } from '../src/exercise/SquatStateMachine'
import { JumpingJackStateMachine } from '../src/exercise/JumpingJackStateMachine'

function run(det: any, periodS: number, amp: number, count: number, hz = 50) {
  let reps = 0
  let qsum = 0
  const dt = 1000 / hz
  // 先给 2 秒静止让基线收敛
  for (let i = 0; i < hz * 2; i++) {
    det.push({ timestamp: i * dt, ax: 0, ay: 9.8, az: 0, gx: 0, gy: 0, gz: 0 })
  }
  const t0 = hz * 2 * dt
  const total = Math.round(count * periodS * hz)
  for (let i = 0; i < total; i++) {
    const t = i * dt
    const phase = (t / 1000 / periodS) * Math.PI * 2
    const s = {
      timestamp: t0 + t,
      ax: 0.1 * Math.sin(phase * 2),
      ay: 9.8 - amp * Math.sin(phase),
      az: 0.1 * Math.cos(phase),
      gx: 0, gy: 0, gz: 0,
    }
    const r = det.push(s)
    if (r) { reps++; qsum += r.quality }
  }
  return { reps, avgQ: reps ? +(qsum / reps).toFixed(2) : 0 }
}

console.log('squat 2.4s x20 amp3.4 ->', run(new SquatStateMachine(), 2.4, 3.4, 20))
console.log('squat 1.6s x20 amp4.5 ->', run(new SquatStateMachine(), 1.6, 4.5, 20))
console.log('squat 3.5s x10 amp5.0 ->', run(new SquatStateMachine(), 3.5, 5.0, 10))
console.log('squat idle(amp0.4) x20 ->', run(new SquatStateMachine(), 2.4, 0.4, 20))
console.log('squat walking(0.6s amp1.2)x40 ->', run(new SquatStateMachine(), 0.6, 1.2, 40))
console.log('jack 0.8s x20 amp5 ->', run(new JumpingJackStateMachine(), 0.8, 5, 20))
console.log('jack idle amp0.5 x20 ->', run(new JumpingJackStateMachine(), 0.8, 0.5, 20))
