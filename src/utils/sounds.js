/**
 * sounds.js — Premium Chess Sound Effects v2
 * Web Audio API based, low-latency, inspired by Chess.com & Lichess.
 * Each sound is synthesized procedurally — no external files needed.
 * Enhanced with richer textures and more satisfying wooden impact sounds.
 */

let _ctx = null
let _muted = false
let _volume = 1.0   // 0–1 master volume multiplier
let _profile = 'wood' // active sound profile

export function isMuted() { return _muted }
export function setMuted(v) { _muted = v }
export function toggleMute() { _muted = !_muted; return _muted }
export function getVolume() { return _volume }
export function setVolume(v) { _volume = Math.max(0, Math.min(1, v)) }
export function getProfile() { return _profile }
export function setProfile(p) { _profile = p }

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

/** Guard: returns true if sound should play */
function canPlay() { return !_muted && _volume > 0 }

/** Profile multiplier maps */
const PROF_FREQ = { wood: 1.0, glass: 1.35, metal: 0.85, soft: 0.7 }
const PROF_GAIN = { wood: 1.0, glass: 0.7, metal: 1.3, soft: 0.5 }
const PROF_DUR  = { wood: 1.0, glass: 0.8, metal: 1.25, soft: 0.9 }

/** Apply master volume + profile gain */
function v(gain) { return gain * _volume * (PROF_GAIN[_profile] || 1.0) }

/** Apply profile-based frequency multiplier */
function pfFreq(base) { return base * (PROF_FREQ[_profile] || 1.0) }

/** Apply profile-based duration multiplier */
function pfDur(base) { return base * (PROF_DUR[_profile] || 1.0) }

/** Create a noise buffer for percussive textures */
function noiseBuffer(ctx, duration = 0.05) {
  const sr = ctx.sampleRate
  const len = sr * duration
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

/** Low-pass filtered noise burst (profile-aware) */
function noiseClick(ctx, duration = 0.025, freq = 2000) {
  const dur = duration * (PROF_DUR[_profile] || 1.0)
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, dur)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = freq * (PROF_FREQ[_profile] || 1.0)
  filter.Q.value = 1
  return { src, filter, dur }
}

/**
 * Piece move — satisfying wooden "tock" with resonance
 * A short filtered noise burst + a warm body tone with decay.
 */
export function move() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Wood impact noise — sharp attack, quick decay
  const { src: noise, filter } = noiseClick(ctx, 0.04, 3800)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(v(0.18), t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.05)

  // Warm body resonance — deeper and longer
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(pfFreq(280), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(160), t + 0.08)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(v(0.09), t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.09)

  // Subtle high-frequency click for crispness
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(pfFreq(1200), t)
  osc2.frequency.exponentialRampToValueAtTime(pfFreq(600), t + 0.03)
  const o2Gain = ctx.createGain()
  o2Gain.gain.setValueAtTime(v(0.04), t)
  o2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035)
  osc2.connect(o2Gain).connect(ctx.destination)
  osc2.start(t)
  osc2.stop(t + 0.04)
}

/**
 * Piece capture — heavier impact with more noise and body
 */
export function capture() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Hard impact noise
  const { src: noise, filter } = noiseClick(ctx, 0.07, 5000)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(v(0.30), t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.08)

  // Deep body thud
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pfFreq(160), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(55), t + 0.12)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(v(0.22), t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.13)

  // Secondary crack — wooden snap
  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(pfFreq(900), t)
  osc2.frequency.exponentialRampToValueAtTime(pfFreq(180), t + 0.05)
  const o2Gain = ctx.createGain()
  o2Gain.gain.setValueAtTime(v(0.10), t)
  o2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  osc2.connect(o2Gain).connect(ctx.destination)
  osc2.start(t)
  osc2.stop(t + 0.07)

  // Extra noise layer for texture
  const { src: noise2, filter: filter2 } = noiseClick(ctx, 0.04, 2000)
  const n2Gain = ctx.createGain()
  n2Gain.gain.setValueAtTime(v(0.08), t + 0.01)
  n2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  noise2.connect(filter2).connect(n2Gain).connect(ctx.destination)
  noise2.start(t + 0.01)
  noise2.stop(t + 0.07)
}

/**
 * Check — sharp alert ping with harmonic
 */
export function check() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Sharp ascending tone
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pfFreq(880), t)
  osc.frequency.linearRampToValueAtTime(pfFreq(1320), t + 0.08)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(v(0.18), t)
  gain.gain.setValueAtTime(v(0.18), t + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.2)

  // Second pulse
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(pfFreq(1100), t + 0.1)
  osc2.frequency.linearRampToValueAtTime(pfFreq(1540), t + 0.16)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t)
  g2.gain.setValueAtTime(v(0.14), t + 0.1)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t + 0.1)
  osc2.stop(t + 0.26)

  // Harmonic for richness
  const osc3 = ctx.createOscillator()
  osc3.type = 'triangle'
  osc3.frequency.setValueAtTime(pfFreq(1760), t)
  osc3.frequency.linearRampToValueAtTime(pfFreq(2640), t + 0.06)
  const g3 = ctx.createGain()
  g3.gain.setValueAtTime(v(0.06), t)
  g3.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc3.connect(g3).connect(ctx.destination)
  osc3.start(t)
  osc3.stop(t + 0.13)
}

/**
 * Castle — satisfying two-part sliding sound with resonance
 */
export function castle() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // First slide
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pfFreq(320), t)
  osc.frequency.linearRampToValueAtTime(pfFreq(520), t + 0.07)
  const g1 = ctx.createGain()
  g1.gain.setValueAtTime(v(0.14), t)
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
  osc.connect(g1).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.10)

  // Second slide
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(pfFreq(370), t + 0.06)
  osc2.frequency.linearRampToValueAtTime(pfFreq(570), t + 0.13)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t)
  g2.gain.setValueAtTime(v(0.12), t + 0.06)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t + 0.06)
  osc2.stop(t + 0.15)

  // Subtle noise for texture
  const { src: noise, filter } = noiseClick(ctx, 0.035, 2800)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(v(0.08), t + 0.06)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t + 0.06)
  noise.stop(t + 0.12)

  // Final impact
  const osc3 = ctx.createOscillator()
  osc3.type = 'triangle'
  osc3.frequency.setValueAtTime(pfFreq(200), t + 0.12)
  osc3.frequency.exponentialRampToValueAtTime(pfFreq(100), t + 0.18)
  const g3 = ctx.createGain()
  g3.gain.setValueAtTime(0, t)
  g3.gain.setValueAtTime(v(0.08), t + 0.12)
  g3.gain.exponentialRampToValueAtTime(0.001, t + 0.19)
  osc3.connect(g3).connect(ctx.destination)
  osc3.start(t + 0.12)
  osc3.stop(t + 0.20)
}

/**
 * Promotion — triumphant ascending chord with shimmer
 */
export function promote() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  const notes = [pfFreq(523), pfFreq(659), pfFreq(784), pfFreq(1047)] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    const start = t + i * 0.06
    gain.gain.setValueAtTime(0, t)
    gain.gain.setValueAtTime(v(0.14), start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.37)
  })

  // Shimmer
  const { src: noise, filter } = noiseClick(ctx, 0.1, 6000)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(0, t)
  nGain.gain.setValueAtTime(v(0.06), t + 0.15)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t + 0.15)
  noise.stop(t + 0.42)
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
  osc.frequency.setValueAtTime(pfFreq(440), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(110), t + 0.5)
  const g = ctx.createGain()
  g.gain.setValueAtTime(v(0.14), t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.6)

  // Second tone
  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(pfFreq(330), t + 0.15)
  osc2.frequency.exponentialRampToValueAtTime(pfFreq(82), t + 0.7)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t)
  g2.gain.setValueAtTime(v(0.10), t + 0.15)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.75)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t + 0.15)
  osc2.stop(t + 0.76)

  // Sustained low drone
  const osc3 = ctx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(pfFreq(220), t)
  osc3.frequency.exponentialRampToValueAtTime(pfFreq(55), t + 1.0)
  const g3 = ctx.createGain()
  g3.gain.setValueAtTime(v(0.04), t)
  g3.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
  osc3.connect(g3).connect(ctx.destination)
  osc3.start(t)
  osc3.stop(t + 1.2)
}

/**
 * Game start — brief ascending confirmation with warmth
 */
export function gameStart() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pfFreq(440), t)
  osc.frequency.linearRampToValueAtTime(pfFreq(880), t + 0.12)
  const g = ctx.createGain()
  g.gain.setValueAtTime(v(0.12), t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.24)

  // Warm overtone
  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(pfFreq(660), t + 0.05)
  osc2.frequency.linearRampToValueAtTime(pfFreq(1320), t + 0.15)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t)
  g2.gain.setValueAtTime(v(0.06), t + 0.05)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t + 0.05)
  osc2.stop(t + 0.24)
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
  osc.frequency.setValueAtTime(pfFreq(150), t)
  const g = ctx.createGain()
  g.gain.setValueAtTime(v(0.08), t)
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
  osc.frequency.setValueAtTime(pfFreq(660), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(330), t + 0.08)
  const g = ctx.createGain()
  g.gain.setValueAtTime(v(0.08), t)
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
  osc.frequency.setValueAtTime(pfFreq(1200), t)
  const g = ctx.createGain()
  g.gain.setValueAtTime(v(0.14), t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.09)
}

/**
 * Checkmate — dramatic, final, multi-layered
 * A powerful combination of ascending tones, crash, and sustained resonance.
 * Feels like a definitive "game ending" moment.
 */
export function checkmate() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Phase 1: Sharp ascending warning (0-0.1s)
  const warn = ctx.createOscillator()
  warn.type = 'sawtooth'
  warn.frequency.setValueAtTime(pfFreq(400), t)
  warn.frequency.linearRampToValueAtTime(pfFreq(1200), t + 0.1)
  const wGain = ctx.createGain()
  wGain.gain.setValueAtTime(v(0.08), t)
  wGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  warn.connect(wGain).connect(ctx.destination)
  warn.start(t)
  warn.stop(t + 0.16)

  // Phase 2: Heavy impact crash (0.08-0.2s)
  const { src: crash, filter: crashF } = noiseClick(ctx, 0.12, 6000)
  const cGain = ctx.createGain()
  cGain.gain.setValueAtTime(0, t)
  cGain.gain.setValueAtTime(v(0.35), t + 0.08)
  cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  crash.connect(crashF).connect(cGain).connect(ctx.destination)
  crash.start(t + 0.08)
  crash.stop(t + 0.26)

  // Phase 3: Deep bass boom (0.08-0.6s)
  const bass = ctx.createOscillator()
  bass.type = 'sine'
  bass.frequency.setValueAtTime(pfFreq(80), t + 0.08)
  bass.frequency.exponentialRampToValueAtTime(pfFreq(30), t + 0.6)
  const bGain = ctx.createGain()
  bGain.gain.setValueAtTime(0, t)
  bGain.gain.setValueAtTime(v(0.28), t + 0.08)
  bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65)
  bass.connect(bGain).connect(ctx.destination)
  bass.start(t + 0.08)
  bass.stop(t + 0.7)

  // Phase 4: Triumphant minor chord (0.15-0.8s)
  const chord = [pfFreq(261.6), pfFreq(311.1), pfFreq(392), pfFreq(523.3)] // C4, Eb4, G4, C5 — Cm chord
  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    const start = t + 0.15 + i * 0.04
    g.gain.setValueAtTime(0, t)
    g.gain.setValueAtTime(v(0.10), start)
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.65)
    osc.connect(g).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.67)
  })

  // Phase 5: Sustained metallic shimmer (0.2-0.9s)
  const shimmer = ctx.createOscillator()
  shimmer.type = 'triangle'
  shimmer.frequency.setValueAtTime(pfFreq(2000), t + 0.2)
  shimmer.frequency.exponentialRampToValueAtTime(pfFreq(800), t + 0.9)
  const sGain = ctx.createGain()
  sGain.gain.setValueAtTime(0, t)
  sGain.gain.setValueAtTime(v(0.04), t + 0.2)
  sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.95)
  shimmer.connect(sGain).connect(ctx.destination)
  shimmer.start(t + 0.2)
  shimmer.stop(t + 1.0)
}

/**
 * Hover — ultra-subtle ambient wooden whisper for piece hover
 * Very quiet, very short — just enough to feel tactile feedback.
 */
export function hover() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Tiny noise click — barely audible
  const { src: noise, filter } = noiseClick(ctx, 0.012, 1500)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(v(0.035), t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.02)

  // Micro wooden creak
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pfFreq(600), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(300), t + 0.025)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(v(0.025), t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.035)
}

/**
 * Important capture — heavier, more dramatic than regular capture
 * Used when capturing a queen or rook. More bass, more noise, more presence.
 */
export function importantCapture() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Heavy noise burst
  const { src: noise, filter } = noiseClick(ctx, 0.09, 5500)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(v(0.38), t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.10)

  // Deep body thud — bigger than regular capture
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pfFreq(120), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(35), t + 0.15)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(v(0.28), t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.17)

  // Wood crack — sharper
  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(pfFreq(1100), t)
  osc2.frequency.exponentialRampToValueAtTime(pfFreq(150), t + 0.06)
  const o2Gain = ctx.createGain()
  o2Gain.gain.setValueAtTime(v(0.14), t)
  o2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  osc2.connect(o2Gain).connect(ctx.destination)
  osc2.start(t)
  osc2.stop(t + 0.08)

  // Low resonance tail
  const osc3 = ctx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(pfFreq(200), t + 0.05)
  osc3.frequency.exponentialRampToValueAtTime(pfFreq(80), t + 0.2)
  const o3Gain = ctx.createGain()
  o3Gain.gain.setValueAtTime(0, t)
  o3Gain.gain.setValueAtTime(v(0.12), t + 0.05)
  o3Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
  osc3.connect(o3Gain).connect(ctx.destination)
  osc3.start(t + 0.05)
  osc3.stop(t + 0.23)

  // Extra noise layer for weight
  const { src: noise2, filter: filter2 } = noiseClick(ctx, 0.06, 1500)
  const n2Gain = ctx.createGain()
  n2Gain.gain.setValueAtTime(v(0.10), t + 0.02)
  n2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10)
  noise2.connect(filter2).connect(n2Gain).connect(ctx.destination)
  noise2.start(t + 0.02)
  noise2.stop(t + 0.11)
}

/**
 * Pickup — soft click/cloth sound when lifting a piece
 */
export function pickup() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Soft cloth tear / suction release
  const { src: noise, filter } = noiseClick(ctx, 0.025, 2500)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(v(0.10), t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.035)

  // Subtle wooden tap
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pfFreq(600), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(350), t + 0.025)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(v(0.05), t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.035)
}

/**
 * Drop — wood impact when placing a piece (legal move)
 */
export function drop() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Sharp wood impact
  const { src: noise, filter } = noiseClick(ctx, 0.03, 4000)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(v(0.15), t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t)
  noise.stop(t + 0.04)

  // Body resonance
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(pfFreq(250), t)
  osc.frequency.exponentialRampToValueAtTime(pfFreq(140), t + 0.06)
  const oGain = ctx.createGain()
  oGain.gain.setValueAtTime(v(0.07), t)
  oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  osc.connect(oGain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.075)
}

/**
 * Victory — triumphant fanfare for checkmate
 */
export function victory() {
  if (!canPlay()) return
  const ctx = getCtx()
  const t = ctx.currentTime

  // Ascending arpeggio — C major
  const notes = [pfFreq(523), pfFreq(659), pfFreq(784), pfFreq(1047), pfFreq(1319)]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    const start = t + i * 0.1
    gain.gain.setValueAtTime(0, t)
    gain.gain.setValueAtTime(v(0.16), start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.52)
  })

  // Sparkle shimmer
  const { src: noise, filter } = noiseClick(ctx, 0.15, 7000)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(0, t)
  nGain.gain.setValueAtTime(v(0.08), t + 0.3)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start(t + 0.3)
  noise.stop(t + 0.72)
}

export default {
  move, capture, check, castle, promote,
  gameOver, gameStart, error, undo, clockTick,
  checkmate, importantCapture, pickup, drop, victory,
  isMuted, setMuted, toggleMute,
  getVolume, setVolume, getProfile, setProfile,
}
