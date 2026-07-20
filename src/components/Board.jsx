import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import { ChessPiece } from './ChessPieces'
import * as SFX from '../utils/sounds'
import './Board.css'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

function Board({
  board = [],
  flipped = false,
  selected = null,
  legalMoves = [],
  lastMove = null,
  checkSq = [],
  onSquareClick,
  onPieceDrop,
  isSelectable = true,
  isCheckmate = false,
  boardTheme = 'classic',
  premove = null,
  premoveSrc = null,
  hintMove = null,
  capturableSq = [],
}) {
  const boardRef = useRef(null)
  const [drag, setDrag] = useState(null)
  const [hoverSq, setHoverSq] = useState(null)
  const [captureAnim, setCaptureAnim] = useState(null) // { square, color, type }
  const [boardShake, setBoardShake] = useState(false)
  const [captureFlashSq, setCaptureFlashSq] = useState(null)
  const [landAnimSq, setLandAnimSq] = useState(null)
  const [entryDone, setEntryDone] = useState(false)
  const [victorySparkles, setVictorySparkles] = useState([])
  const prevLastMove = useRef(null)
  const captureTimerRef = useRef(null)
  const shakeTimerRef = useRef(null)
  const flashTimerRef = useRef(null)
  const landTimerRef = useRef(null)
  const lastHoveredSqRef = useRef(null) // Throttle: only play hover sound on new piece
  const [keyFocusSq, setKeyFocusSq] = useState(null) // keyboard-focused square

  // Board entry animation
  useEffect(() => {
    const t = setTimeout(() => setEntryDone(true), 1200)
    return () => clearTimeout(t)
  }, [])

  // Victory sparkles on checkmate
  useEffect(() => {
    if (!isCheckmate) return
    const colors = ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#FFB74D', '#CE93D8']
    const sparks = []
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const dist = 40 + Math.random() * 80
      sparks.push({
        x: `${50 + (Math.random() - 0.5) * 60}%`,
        y: `${50 + (Math.random() - 0.5) * 60}%`,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
      })
    }
    setVictorySparkles(sparks)
    const t = setTimeout(() => setVictorySparkles([]), 1500)
    return () => clearTimeout(t)
  }, [isCheckmate])

  const isWhite = !flipped

  // ─── Coord helpers ───
  const sqFromPos = useCallback((clientX, clientY) => {
    if (!boardRef.current) return null
    const el = document.elementFromPoint(clientX, clientY)
    if (!el) return null
    const sqEl = el.closest('[data-sq]')
    return sqEl ? sqEl.dataset.sq : null
  }, [])

  const getCoords = useCallback((row, col) => {
    const r = isWhite ? row : 7 - row
    const c = isWhite ? col : 7 - col
    return { file: FILES[c], rank: RANKS[r] }
  }, [isWhite])

  const toSq = useCallback((row, col) => {
    const { file, rank } = getCoords(row, col)
    return file + rank
  }, [getCoords])

  const pieceAt = useCallback((row, col) => {
    const r = isWhite ? row : 7 - row
    const c = isWhite ? col : 7 - col
    return board?.[r]?.[c] || null
  }, [board, isWhite])

  // ─── Keyboard navigation helpers ───
  const sqToVisual = useCallback((sq) => {
    if (!sq || sq.length < 2) return { vRow: 0, vCol: 0 }
    const file = sq[0], rank = sq[1]
    const boardCol = FILES.indexOf(file)
    const boardRow = RANKS.indexOf(rank)
    return {
      vRow: isWhite ? boardRow : 7 - boardRow,
      vCol: isWhite ? boardCol : 7 - boardCol
    }
  }, [isWhite])

  const visualToSq = useCallback((vRow, vCol) => {
    const br = isWhite ? vRow : 7 - vRow
    const bc = isWhite ? vCol : 7 - vCol
    return FILES[bc] + RANKS[br]
  }, [isWhite])

  // Default entry square for keyboard (center of board, respects flip)
  const defaultKeySq = visualToSq(4, 4)
  // Always keep one square tabbable so Tab can reach the board
  const activeFocusSq = keyFocusSq || defaultKeySq

  // ─── Keyboard handler ───
  const handleKeyDown = useCallback((e) => {
    const sq = keyFocusSq
    if (!sq) return

    const { vRow, vCol } = sqToVisual(sq)
    let nRow = vRow, nCol = vCol

    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); nRow = Math.max(0, vRow - 1); break
      case 'ArrowDown':  e.preventDefault(); nRow = Math.min(7, vRow + 1); break
      case 'ArrowLeft':  e.preventDefault(); nCol = Math.max(0, vCol - 1); break
      case 'ArrowRight': e.preventDefault(); nCol = Math.min(7, vCol + 1); break
      case ' ':
      case 'Enter':
        e.preventDefault()
        onSquareClick?.(sq)
        return
      case 'Escape':
        e.preventDefault()
        setKeyFocusSq(null)
        return
      default:
        return
    }

    const newSq = visualToSq(nRow, nCol)
    if (newSq === sq) return // clamp prevented movement
    setKeyFocusSq(newSq)
    // Move browser focus to the new square element
    const el = boardRef.current?.querySelector(`[data-sq="${newSq}"]`)
    el?.focus()
  }, [keyFocusSq, onSquareClick, sqToVisual, visualToSq])

  // ─── Mouse drag ───
  const handleMouseDown = useCallback((e, square) => {
    if (!isSelectable) return
    if (e.button !== 0) return
    const p = board.flat().find((_, i) => {
      const r = Math.floor(i / 8), c = i % 8
      return toSq(r, c) === square
    })
    if (!p) return

    if (isSelectable) SFX.pickup()

    setDrag({
      square,
      piece: p,
      startX: e.clientX,
      startY: e.clientY,
    })
  }, [isSelectable, board, toSq])

  useEffect(() => {
    if (!drag) return

    const handleMove = (e) => {
      e.preventDefault()
      setDrag(prev => ({ ...prev, currentX: e.clientX, currentY: e.clientY }))
      const sq = sqFromPos(e.clientX, e.clientY)
      if (sq) setHoverSq(sq)
    }

    const handleUp = (e) => {
      const sq = sqFromPos(e.clientX, e.clientY)
      if (sq && sq !== drag.square) {
        onPieceDrop?.(drag.square, sq)
        SFX.drop()
      } else {
        onSquareClick?.(drag.square)
      }
      setDrag(null)
      setHoverSq(null)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [drag, sqFromPos, onPieceDrop, onSquareClick])

  // ─── Touch drag ───
  const handleTouchStart = useCallback((e, square) => {
    if (!isSelectable) return
    const touch = e.touches[0]
    const p = board.flat().find((_, i) => {
      const r = Math.floor(i / 8), c = i % 8
      return toSq(r, c) === square
    })
    if (!p) return
    if (isSelectable) SFX.pickup()
    setDrag({
      square,
      piece: p,
      startX: touch.clientX,
      startY: touch.clientY,
      isTouch: true,
    })
  }, [isSelectable, board, toSq])

  useEffect(() => {
    if (!drag || !drag.isTouch) return

    const handleMove = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      setDrag(prev => ({ ...prev, currentX: touch.clientX, currentY: touch.clientY }))
      const sq = sqFromPos(touch.clientX, touch.clientY)
      if (sq) setHoverSq(sq)
    }

    const handleUp = (e) => {
      const touch = e.changedTouches[0]
      const sq = sqFromPos(touch.clientX, touch.clientY)
      if (sq && sq !== drag.square) {
        onPieceDrop?.(drag.square, sq)
        SFX.drop()
      } else {
        onSquareClick?.(drag.square)
      }
      setDrag(null)
      setHoverSq(null)
    }

    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [drag, sqFromPos, onPieceDrop, onSquareClick])

  // ─── Piece move animation (immediate, no delay) ───
  const animTimerRef = useRef(null)
  const animTimerRef2 = useRef(null)

  useLayoutEffect(() => {
    // Cancel any pending cleanup from previous animation
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    if (animTimerRef2.current) clearTimeout(animTimerRef2.current)

    if (!lastMove || !boardRef.current) {
      if (captureTimerRef.current) { clearTimeout(captureTimerRef.current); captureTimerRef.current = null }
      setCaptureAnim(null)
      prevLastMove.current = lastMove
      return
    }
    if (prevLastMove.current === lastMove) return
    prevLastMove.current = lastMove

    // Helper: animate a single piece from one square to another
    const animatePiece = (fromSquare, toSquare) => {
      const fEl = boardRef.current.querySelector(`[data-sq="${fromSquare}"]`)
      const tEl = boardRef.current.querySelector(`[data-sq="${toSquare}"]`)
      if (!fEl || !tEl) return null

      const fRect = fEl.getBoundingClientRect()
      const tRect = tEl.getBoundingClientRect()
      const dx = (fRect.left - tRect.left) / tRect.width * 100
      const dy = (fRect.top - tRect.top) / tRect.height * 100

      const el = tEl.querySelector('.pce')
      if (!el) return null

      el.style.transition = 'none'
      el.style.transform = `translate(${dx}%, ${dy}%) scale(0.96)`
      void el.offsetHeight
      el.style.transition = 'transform 0.24s cubic-bezier(0.23, 1, 0.32, 1)'
      el.style.transform = ''

      return el
    }

    // Animate the main piece (king/queen/etc)
    const mainEl = animatePiece(lastMove.from, lastMove.to)

    // Detect castling and animate the rook too
    const isCastle = lastMove.flags?.includes('k') || lastMove.flags?.includes('q')
    let rookEl = null
    if (isCastle) {
      const rank = lastMove.from[1] // '1' or '8'
      const isKingside = lastMove.flags.includes('k')
      const rookFrom = isKingside ? `h${rank}` : `a${rank}`
      const rookTo = isKingside ? `f${rank}` : `d${rank}`
      rookEl = animatePiece(rookFrom, rookTo)
    }

    // Capture animation — ghost of captured piece fades out + flash + shake
    if (lastMove.captured) {
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current)
      setCaptureAnim({ square: lastMove.to, color: lastMove.color === 'w' ? 'b' : 'w', type: lastMove.captured })
      // Flash on capture square
      setCaptureFlashSq(lastMove.to)
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => { setCaptureFlashSq(null); flashTimerRef.current = null }, 500)
      // Board shake
      setBoardShake(true)
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current)
      shakeTimerRef.current = setTimeout(() => { setBoardShake(false); shakeTimerRef.current = null }, 400)
      captureTimerRef.current = setTimeout(() => {
        setCaptureAnim(null)
        captureTimerRef.current = null
      }, 400)
    }

    // Landing bounce animation on destination square
    setLandAnimSq(lastMove.to)
    if (landTimerRef.current) clearTimeout(landTimerRef.current)
    landTimerRef.current = setTimeout(() => { setLandAnimSq(null); landTimerRef.current = null }, 350)

    // Phase 3: Clean up inline styles after animation
    animTimerRef.current = setTimeout(() => {
      if (mainEl) mainEl.style.transition = ''
      animTimerRef.current = null
    }, 280)
    if (rookEl) {
      animTimerRef2.current = setTimeout(() => {
        rookEl.style.transition = ''
        animTimerRef2.current = null
      }, 280)
    }

    // Cleanup on unmount or next move
    return () => {
      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null }
      if (animTimerRef2.current) { clearTimeout(animTimerRef2.current); animTimerRef2.current = null }
      if (captureTimerRef.current) { clearTimeout(captureTimerRef.current); captureTimerRef.current = null }
      if (shakeTimerRef.current) { clearTimeout(shakeTimerRef.current); shakeTimerRef.current = null }
      if (flashTimerRef.current) { clearTimeout(flashTimerRef.current); flashTimerRef.current = null }
      if (landTimerRef.current) { clearTimeout(landTimerRef.current); landTimerRef.current = null }
    }
  }, [lastMove])

  const sqSelected = (sq) => selected === sq
  const sqLegal = (sq) => legalMoves.some(m => m.to === sq)
  const sqLast = (sq) => lastMove && (lastMove.from === sq || lastMove.to === sq)
  const sqCheck = (sq) => checkSq.includes(sq)
  const sqHover = (sq) => hoverSq === sq && hoverSq !== selected
  const sqPremove = (sq) => premove && (premove.from === sq || premove.to === sq)
  const sqPremoveSrc = (sq) => premoveSrc === sq
  const sqHint = (sq) => hintMove && (hintMove.from === sq || hintMove.to === sq)
  const sqCapturable = (sq) => capturableSq.includes(sq)
  const isAnyCheck = checkSq.length > 0

  // Siempre iterar de arriba a abajo e izquierda a derecha visualmente.
  // getCoords/pieceAt ya manejan la rotación a través de isWhite.
  const rows = [0, 1, 2, 3, 4, 5, 6, 7]
  const cols = [0, 1, 2, 3, 4, 5, 6, 7]

  return (
    <div className={`board ${flipped ? 'flipped' : ''} ${boardShake ? 'board-shake' : ''}`} ref={boardRef} data-theme={boardTheme}>
      <div className="bgrid">
        {rows.map((r, rIdx) => (
          <div key={r} className="brow">
            {cols.map((c, cIdx) => {
              const sq = toSq(r, c)
              const isLight = (r + c) % 2 === 0
              const p = pieceAt(r, c)
              const isLegal = sqLegal(sq)
              const isDragSq = drag?.square === sq
              const isHover = sqHover(sq)
              const isBottomRow = rIdx === 7
              const isLeftCol = cIdx === 0

              // Stagger delay for entry animation based on position
              const entryDelay = (rIdx * 8 + cIdx) * 12 // ~12ms per square
              const isLanding = landAnimSq === sq
              const isCaptureFlash = captureFlashSq === sq
              // Checkmate defeat: animate the losing king
              const isCheckmateKing = isCheckmate && p?.type === 'k' && checkSq.includes(sq)
              const isCheckRipple = isAnyCheck && sqCheck(sq) && p?.type === 'k'

              return (
                <div
                  key={sq}
                  className={[
                    'sq',
                    isLight ? 'sl' : 'sd',
                    sqSelected(sq) ? 'ssel' : '',
                    (sqLast(sq) && !sqSelected(sq)) ? 'slast' : '',
                    sqCheck(sq) ? 'schk' : '',
                    isCheckRipple ? 'check-ripple' : '',
                    sqCheck(sq) ? 'schk' : '',
                    isCheckRipple ? 'check-ripple' : '',
                    sqPremove(sq) ? 'sprem' : '',
                    sqPremoveSrc(sq) ? 'sprem-src' : '',
                    sqHint(sq) ? 'shint' : '',
                    sqCapturable(sq) ? 'scap' : '',
                    isDragSq ? 'sdrag' : '',
                    isHover ? 'shover' : '',
                    isCaptureFlash ? 'sq-capture-flash' : '',
                  ].filter(Boolean).join(' ')}
                  data-sq={sq}
                  tabIndex={activeFocusSq === sq ? 0 : -1}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (keyFocusSq !== sq) setKeyFocusSq(sq) }}
                  onMouseDown={(e) => handleMouseDown(e, sq)}
                  onTouchStart={(e) => handleTouchStart(e, sq)}
                >                    {p && !isDragSq && (
                    <span
                      className={`pce ${p.color === 'w' ? 'pw' : 'pb'} ${p._hidden ? 'phid' : ''} ${!entryDone ? 'pce-entry' : ''} ${isLanding ? 'pce-land' : ''} ${isCheckmateKing ? 'pce-checkmate-defeat' : ''} ${sqCheck(sq) ? 'pce-check-pulse' : ''}`}
                      style={!entryDone ? { animationDelay: `${entryDelay}ms` } : undefined}
                      onMouseEnter={() => {
                        if (lastHoveredSqRef.current !== sq) {
                          lastHoveredSqRef.current = sq
                          SFX.hover()
                        }
                      }}
                      onMouseLeave={() => {
                        if (lastHoveredSqRef.current === sq) lastHoveredSqRef.current = null
                      }}
                    >
                      {p._hidden
                        ? <ChessPiece color={p.color} type="p" />
                        : <ChessPiece color={p.color} type={p.type} />
                      }
                    </span>
                  )}

                  {isLegal && (
                    <span className={`lm ${p ? 'lmc' : 'lmd'}`} />
                  )}

                  {/* Premove indicator — blue dot on destination */}
                  {premove && premove.to === sq && (
                    <span className="lm lmp" />
                  )}

                  {/* Coordenadas estilo Lichess — usando índices visuales */}
                  {isBottomRow && <span className="sq-file">{FILES[isWhite ? cIdx : 7 - cIdx]}</span>}
                  {isLeftCol && <span className="sq-rank">{RANKS[isWhite ? rIdx : 7 - rIdx]}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Capture ghost — faded captured piece */}
      {captureAnim && (() => {
        const sqEl = boardRef.current?.querySelector(`[data-sq="${captureAnim.square}"]`)
        if (!sqEl) return null
        const rect = sqEl.getBoundingClientRect()
        const boardRect = boardRef.current.getBoundingClientRect()
        const bw = parseFloat(getComputedStyle(boardRef.current).borderWidth) || 0
        const left = rect.left - boardRect.left - bw + rect.width / 2
        const top = rect.top - boardRect.top - bw + rect.height / 2
        return (
          <div
            className="capture-ghost"
            style={{ left, top }}
          >
            <span className={`pce ${captureAnim.color === 'w' ? 'pw' : 'pb'}`}>
              <ChessPiece color={captureAnim.color} type={captureAnim.type} />
            </span>
          </div>
        )
      })()}

      {/* Victory sparkles */}
      {isCheckmate && victorySparkles.map((s, i) => (
        <div
          key={i}
          className="victory-spark"
          style={{
            left: s.x,
            top: s.y,
            '--spark-x': `${s.dx}px`,
            '--spark-y': `${s.dy}px`,
            '--spark-size': `${s.size}px`,
            '--spark-color': s.color,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Floating piece during drag — centered on cursor */}
      {drag && (
        <div
          className="drag-ghost"
          style={{
            left: (drag.currentX ?? drag.startX),
            top: (drag.currentY ?? drag.startY),
          }}
        >
          <span className={`pce ${drag.piece.color === 'w' ? 'pw' : 'pb'}`}>
            <ChessPiece color={drag.piece.color} type={drag.piece.type} />
          </span>
        </div>
      )}
    </div>
  )
}

export default Board
