import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import { ChessPiece } from './ChessPieces'
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
}) {
  const boardRef = useRef(null)
  const [drag, setDrag] = useState(null)
  const [hoverSq, setHoverSq] = useState(null)
  const [captureAnim, setCaptureAnim] = useState(null) // { square, color, type }
  const prevLastMove = useRef(null)
  const captureTimerRef = useRef(null)

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

  // ─── Mouse drag ───
  const handleMouseDown = useCallback((e, square) => {
    if (!isSelectable) return
    if (e.button !== 0) return
    const p = board.flat().find((_, i) => {
      const r = Math.floor(i / 8), c = i % 8
      return toSq(r, c) === square
    })
    if (!p) return

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

  // ─── Click (cuando no hay drag) ───
  const handleClick = useCallback((sq) => {
    if (drag) return
    onSquareClick?.(sq)
  }, [onSquareClick, drag])

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
      el.style.transform = `translate(${dx}%, ${dy}%)`
      void el.offsetHeight
      el.style.transition = 'transform 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)'
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

    // Capture animation — ghost of captured piece fades out
    if (lastMove.captured) {
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current)
      setCaptureAnim({ square: lastMove.to, color: lastMove.color === 'w' ? 'b' : 'w', type: lastMove.captured })
      captureTimerRef.current = setTimeout(() => {
        setCaptureAnim(null)
        captureTimerRef.current = null
      }, 400)
    }

    // Phase 3: Clean up inline styles after animation
    animTimerRef.current = setTimeout(() => {
      if (mainEl) mainEl.style.transition = ''
      animTimerRef.current = null
    }, 250)
    if (rookEl) {
      animTimerRef2.current = setTimeout(() => {
        rookEl.style.transition = ''
        animTimerRef2.current = null
      }, 250)
    }

    // Cleanup on unmount or next move
    return () => {
      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null }
      if (animTimerRef2.current) { clearTimeout(animTimerRef2.current); animTimerRef2.current = null }
      if (captureTimerRef.current) { clearTimeout(captureTimerRef.current); captureTimerRef.current = null }
    }
  }, [lastMove])

  const sqSelected = (sq) => selected === sq
  const sqLegal = (sq) => legalMoves.some(m => m.to === sq)
  const sqLast = (sq) => lastMove && (lastMove.from === sq || lastMove.to === sq)
  const sqCheck = (sq) => checkSq.includes(sq)
  const sqHover = (sq) => hoverSq === sq && hoverSq !== selected

  const rows = isWhite ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0]
  const cols = isWhite ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0]

  return (
    <div className={`board ${flipped ? 'flipped' : ''}`} ref={boardRef}>
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

              return (
                <div
                  key={sq}
                  className={[
                    'sq',
                    isLight ? 'sl' : 'sd',
                    sqSelected(sq) ? 'ssel' : '',
                    (sqLast(sq) && !sqSelected(sq)) ? 'slast' : '',
                    sqCheck(sq) ? 'schk' : '',
                    isDragSq ? 'sdrag' : '',
                    isHover ? 'shover' : '',
                  ].filter(Boolean).join(' ')}
                  data-sq={sq}
                  onMouseDown={(e) => handleMouseDown(e, sq)}
                  onTouchStart={(e) => handleTouchStart(e, sq)}
                  onClick={() => handleClick(sq)}
                >
                  {p && !isDragSq && (
                    <span className={`pce ${p.color === 'w' ? 'pw' : 'pb'} ${p._hidden ? 'phid' : ''}`}>
                      {p._hidden
                        ? <ChessPiece color={p.color} type="p" />
                        : <ChessPiece color={p.color} type={p.type} />
                      }
                    </span>
                  )}

                  {isLegal && (
                    <span className={`lm ${p ? 'lmc' : 'lmd'}`} />
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
