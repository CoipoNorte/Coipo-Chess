/**
 * EvalGraph.jsx — Material evaluation graph using pure SVG
 * Shows advantage fluctuation over the course of the game.
 * No external charting libraries needed.
 */
import { useMemo } from 'react'
import './EvalGraph.css'

const WIDTH = 200
const HEIGHT = 80
const PADDING = { top: 8, right: 4, bottom: 8, left: 4 }
const INNER_W = WIDTH - PADDING.left - PADDING.right
const INNER_H = HEIGHT - PADDING.top - PADDING.bottom
const CENTER_Y = PADDING.top + INNER_H / 2
const MAX_EVAL = 12 // max material advantage to display

export default function EvalGraph({ evalHistory = [], currentMove = -1 }) {
  const points = useMemo(() => {
    if (!evalHistory.length) return []
    const n = evalHistory.length
    // Start at 0 (beginning of game)
    const data = [0, ...evalHistory]
    return data.map((val, i) => {
      const x = PADDING.left + (i / Math.max(data.length - 1, 1)) * INNER_W
      const clamped = Math.max(-MAX_EVAL, Math.min(MAX_EVAL, val))
      const normalized = (clamped / MAX_EVAL) // -1 to 1
      const y = CENTER_Y - normalized * (INNER_H / 2)
      return { x, y, val, idx: i }
    })
  }, [evalHistory])

  // Build SVG path
  const linePath = useMemo(() => {
    if (!points.length) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  }, [points])

  // Area fill path (close to bottom)
  const areaPath = useMemo(() => {
    if (!points.length) return ''
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const lastX = points[points.length - 1].x
    const firstX = points[0].x
    return `${line} L ${lastX.toFixed(1)} ${CENTER_Y} L ${firstX.toFixed(1)} ${CENTER_Y} Z`
  }, [points, CENTER_Y])

  // Current move dot
  const currentPoint = currentMove >= 0 && currentMove < evalHistory.length
    ? points[currentMove + 1] // +1 because points[0] is the initial 0
    : null

  // Determine who's ahead
  const lastEval = evalHistory.length > 0 ? evalHistory[evalHistory.length - 1] : 0
  const evalLabel = lastEval > 0.5 ? `+${lastEval.toFixed(1)}` : lastEval < -0.5 ? lastEval.toFixed(1) : '0.0'
  const evalClass = lastEval > 0.5 ? 'eval-white' : lastEval < -0.5 ? 'eval-black' : 'eval-equal'

  return (
    <div className="eval-graph">
      <div className="eval-graph-header">
        <span className="eval-graph-title">📊 Evaluación</span>
        <span className={`eval-graph-value ${evalClass}`}>{evalLabel}</span>
      </div>
      <svg
        className="eval-graph-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,215,0,0.3)" />
          </linearGradient>
        </defs>
        {/* Center line (0) */}
        <line
          x1={PADDING.left}
          y1={CENTER_Y}
          x2={WIDTH - PADDING.right}
          y2={CENTER_Y}
          className="eval-center-line"
        />

        {/* White advantage zone (top half) */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={INNER_W}
          height={INNER_H / 2}
          className="eval-zone-white"
        />

        {/* Black advantage zone (bottom half) */}
        <rect
          x={PADDING.left}
          y={CENTER_Y}
          width={INNER_W}
          height={INNER_H / 2}
          className="eval-zone-black"
        />

        {/* Area fill */}
        {points.length > 1 && (
          <path d={areaPath} className="eval-area" />
        )}

        {/* Line */}
        {points.length > 1 && (
          <path d={linePath} className="eval-line" fill="none" />
        )}

        {/* Current move dot */}
        {currentPoint && (
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r={3}
            className="eval-dot"
          />
        )}
      </svg>
      <div className="eval-graph-labels">
        <span className="eval-label-top">♔ Blancas</span>
        <span className="eval-label-bottom">♚ Negras</span>
      </div>
    </div>
  )
}
