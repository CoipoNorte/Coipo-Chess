/**
 * sounds.js — Premium Chess Sound Effects
 * Web Audio API based, low-latency, inspired by Chess.com & Lichess.
 * Each sound is synthesized procedurally — no external files needed.
 */

let _ctx = null
let _muted = false

export function isMuted() { return _muted }
export function setMuted(v) { _muted = v }
export function toggleMute() { _muted = !_muted; return _muted }

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

/** Guard: returns true if sound should play */
function canPlay() { return !_muted }

/** Create a noise buffer for percussive textures */
function noiseBuffer(ctx, duration = 0.05) {
  const sr = ctx.sampleRate
  const len = sr * duration
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

/** Low-pass filtered noise burst */
function noiseClick(ctx, duration = 0.025, freq = 2000) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = freq
  filter.Q.value = 1
  return { src, filter }
}

/**
 * Piece move — satisfying wooden "tock"
 * A short filtered noise burst + a subtle body tone.
 */
export function move() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  const { src: noise, filter } = noiseClick(ctx, 0.03, 3600)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(0.10, t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.04)

  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.05)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(0.06, t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.06)
}

/**
 * Piece capture — heavier impact with more noise
 */
export function capture() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Hard impact noise
  const { src: noise, filter } = noiseClick(ctx, 0.06, 4500)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(0.25, t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.07)

  // Deeper body thud
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, t)
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.1)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(0.18, t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.12)

  // Secondary crack
  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(800, t)
  osc2.frequency.exponentialRampToValueAtTime(200, t + 0.04)
  const o2Gain = ctx.createGain()
  o2Gain.gain.setValueAtTime(0.08, t)
  o2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  osc2.connect(o2Gain).connect(ctx.destination)
  osc2.start(t)
  osc2.stop(t + 0.06)
}

/**
 * Check — sharp alert ping
 */
export function check() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Sharp ascending tone
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, t)
  osc.frequency.linearRampToValueAtTime(1320, t + 0.08)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.setValueAtTime(0.15, t + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.2)

  // Second pulse
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(1100, t + 0.1)
  osc2.frequency.linearRampToValueAtTime(1540, t + 0.16)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t)
  g2.gain.setValueAtTime(0.12, t + 0.1)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t + 0.1)
  osc2.stop(t + 0.26)
}

/**
 * Castle — satisfying two-part sliding sound
 */
export function castle() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // First slide
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, t)
  osc.frequency.linearRampToValueAtTime(500, t + 0.07)
  const g1 = ctx.createGain()
  g1.gain.setValueAtTime(0.12, t)
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(g1).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.09)

  // Second slide
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(350, t + 0.06)
  osc2.frequency.linearRampToValueAtTime(550, t + 0.13)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t)
  g2.gain.setValueAtTime(0.1, t + 0.06)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t + 0.06)
  osc2.stop(t + 0.15)

  // Subtle noise
  const { src: noise, filter } = noiseClick(ctx, 0.03, 2500)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(0.06, t + 0.06)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t + 0.06)
  noise.stop(t + 0.11)
}

/**
 * Promotion — triumphant ascending chord
 */
export function promote() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    const start = t + i * 0.06
    gain.gain.setValueAtTime(0, t)
    gain.gain.setValueAtTime(0.12, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.32)
  })
}

/**
 * Game over — dramatic descending tone
 */
export function gameOver() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Low dramatic tone
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, t)
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.5)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.12, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.6)

  // Second tone
  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(330, t + 0.15)
  osc2.frequency.exponentialRampToValueAtTime(82, t + 0.7)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t)
  g2.gain.setValueAtTime(0.08, t + 0.15)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.75)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t + 0.15)
  osc2.stop(t + 0.76)
}

/**
 * Game start — brief ascending confirmation
 */
export function gameStart() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, t)
  osc.frequency.linearRampToValueAtTime(880, t + 0.12)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.1, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.22)
}

/**
 * Error / illegal move — short buzz
 */
export function error() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(150, t)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.08, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.13)
}

/**
 * Undo — soft descending click
 */
export function undo() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(660, t)
  osc.frequency.exponentialRampToValueAtTime(330, t + 0.08)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.08, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.11)
}

/**
 * Clock low — urgent tick when < 10 seconds remain
 */
export function clockTick() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Short high-pitched tick
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1200, t)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.12, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.09)
}

export default {
  move, capture, check, castle, promote,
  gameOver, gameStart, error, undo, clockTick,
}
