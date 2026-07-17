/**
 * ChessClock.jsx — Chess clock with countdown timers
 * Shows two timers, one per player. Active player's timer counts down.
 * Supports increment (time added per move).
 */
import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { clockTick } from '../utils/sounds'
import './ChessClock.css'

/**
 * Format seconds to MM:SS or H:MM:SS
 */
function formatTime(seconds) {
  if (seconds < 0) seconds = 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * ChessClock component
 * @param {number} initialTime - Initial time in seconds per player
 * @param {number} increment - Time increment per move in seconds
 * @param {'w'|'b'|null} activeTurn - Which player's clock is running
 * @param {boolean} running - Whether the clock is running
 * @param {function} onTimeUp - Callback when a player's time runs out (receives 'w' or 'b')
 * @param {boolean} flipped - Whether to swap the display order
 * @param {string} playerW - Name for white player
 * @param {string} playerB - Name for black player
 */
const ChessClock = forwardRef(function ChessClock({
  initialTime = 300,
  increment = 0,
  activeTurn = null,
  running = false,
  onTimeUp,
  flipped = false,
  playerW = 'Blancas',
  playerB = 'Negras',
}, ref) {
  const [times, setTimes] = useState({ w: initialTime, b: initialTime })
  const lastTick = useRef(null)
  const intervalRef = useRef(null)
  const warnedRef = useRef({ w: false, b: false }) // Track if tick sound was played for <10s threshold

  // Reset clock when initialTime changes (new game)
  useEffect(() => {
    setTimes({ w: initialTime, b: initialTime })
    lastTick.current = null
    warnedRef.current = { w: false, b: false }
  }, [initialTime])

  // Add increment to a player's time — exposed via ref
  const addIncrement = useCallback((color) => {
    if (increment > 0) {
      setTimes(prev => ({
        ...prev,
        [color]: prev[color] + increment
      }))
    }
  }, [increment])

  // Reset clock — exposed via ref
  const resetClock = useCallback(() => {
    setTimes({ w: initialTime, b: initialTime })
    lastTick.current = null
    warnedRef.current = { w: false, b: false }
  }, [initialTime])

  useImperativeHandle(ref, () => ({ addIncrement, resetClock }), [addIncrement, resetClock, initialTime])

  // Countdown logic
  useEffect(() => {
    if (!running || !activeTurn) {
      lastTick.current = null
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      if (!lastTick.current) {
        lastTick.current = now
        return
      }
      const delta = (now - lastTick.current) / 1000
      lastTick.current = now

      setTimes(prev => {
        const newTime = prev[activeTurn] - delta
        if (newTime <= 0) {
          clearInterval(intervalRef.current)
          onTimeUp?.(activeTurn)
          return { ...prev, [activeTurn]: 0 }
        }
        // Play tick sound when crossing below 10 seconds
        if (newTime <= 10 && !warnedRef.current[activeTurn]) {
          warnedRef.current[activeTurn] = true
          clockTick()
        }
        // Reset warning if time goes back above 10 (e.g. after increment)
        if (newTime > 10) {
          warnedRef.current[activeTurn] = false
        }
        return { ...prev, [activeTurn]: newTime }
      })
    }, 50) // Update every 50ms for smooth display

    lastTick.current = Date.now()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, activeTurn, onTimeUp])

  const whiteTime = times.w
  const blackTime = times.b
  const isWhiteActive = activeTurn === 'w' && running
  const isBlackActive = activeTurn === 'b' && running
  const isLow = (t) => t <= 30
  const isCritical = (t) => t <= 10

  // Determine display order based on flipped state
  const topTime = flipped ? whiteTime : blackTime
  const bottomTime = flipped ? blackTime : whiteTime
  const topActive = flipped ? isWhiteActive : isBlackActive
  const bottomActive = flipped ? isBlackActive : isWhiteActive
  const topName = flipped ? playerW : playerB
  const bottomName = flipped ? playerB : playerW

  return (
    <div className="chess-clock">
      {/* Top clock (opponent) */}
      <div className={`clock-row ${topActive ? 'clock-active' : ''}`}>
        <span className="clock-name">{topName}</span>
        <span className={`clock-time ${topActive ? 'clock-ticking' : ''} ${isCritical(topTime) ? 'clock-critical' : isLow(topTime) ? 'clock-low' : ''}`}>
          {formatTime(topTime)}
        </span>
      </div>

      {/* Bottom clock (current player) */}
      <div className={`clock-row ${bottomActive ? 'clock-active' : ''}`}>
        <span className="clock-name">{bottomName}</span>
        <span className={`clock-time ${bottomActive ? 'clock-ticking' : ''} ${isCritical(bottomTime) ? 'clock-critical' : isLow(bottomTime) ? 'clock-low' : ''}`}>
          {formatTime(bottomTime)}
        </span>
      </div>
    </div>
  )
})

export default ChessClock
