/**
 * 🧩 Puzzle.jsx — Infinite Chess Puzzle Mode
 * 
 * Lichess-style puzzle trainer with:
 * - Infinite puzzle generation (curated + Lichess API)
 * - Theme filtering (fork, pin, skewer, etc.)
 * - Difficulty rating system
 * - Performance tracking (streaks, stats)
 * - Hints and solution reveal
 * - Beautiful animations
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ChessEngine from '../utils/chessEngine'
import { getPuzzleGenerator, PUZZLE_THEMES, RATING_RANGES } from '../utils/puzzleGenerator'
import Board from './Board'
import { ChessPiece } from './ChessPieces'
import * as SFX from '../utils/sounds'
import './Puzzle.css'

// Pure helper — lives outside component to avoid re-creation
function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === 'k' && board[r][c]?.color === color) {
        return [String.fromCharCode(97 + c) + (8 - r)]
      }
    }
  }
  return []
}

export default function Puzzle() {
  const nav = useNavigate()
  const gen = useRef(getPuzzleGenerator())

  // Puzzle state
  const [puzzle, setPuzzle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [solution, setSolution] = useState([]) // Array of UCI moves: [player0, opp1, player2, opp3, ...]
  const [nextMoveIdx, setNextMoveIdx] = useState(0) // Index into solution[] for the NEXT move to play/expect
  const [playerColor, setPlayerColor] = useState('w')

  // Board state
  const [brd, setBrd] = useState([])
  const [turn, setTurn] = useState('w')
  const [sel, setSel] = useState(null)
  const [legal, setLegal] = useState([])
  const [lastM, setLastM] = useState(null)
  const [chk, setChk] = useState([])
  const [flip, setFlip] = useState(false)

  // UI state
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null
  const [showWrongOverlay, setShowWrongOverlay] = useState(false)
  const wrongOverlayTimerRef = useRef(null)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [promo, setPromo] = useState(null) // { from, to } when promotion needed
  const promoTimerRef = useRef(null)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [difficulty, setDifficulty] = useState('any')
  const [themeFilter, setThemeFilter] = useState('any')
  const [preferOnline, setPreferOnline] = useState(false)

  // Stats
  const [stats, setStats] = useState(() => gen.current.getStats())
  const [showStats, setShowStats] = useState(false)

  const engineRef = useRef(null)
  const intervalRef = useRef(null)
  const autoTimerRef = useRef(null)
  const puzzleRef = useRef(null)
  const timerValRef = useRef(0) // Ref mirror of timer for useCallback deps

  // ─── Helpers ───
  const _applyMoveToBoard = (eng) => {
    setBrd(eng.getBoard())
    setTurn(eng.getTurn())
    setChk(eng.isInCheck() ? findKing(eng.getBoard(), eng.getTurn()) : [])
  }

  const _parseUci = useCallback((uci) => ({
    from: uci.substring(0, 2),
    to: uci.substring(2, 4),
    promotion: uci.length > 4 ? uci[4] : null,
  }), [])

  const _isPlayerTurn = (idx) => idx % 2 === 0 // Even indices = player moves

  // ─── Load next puzzle ───
  const loadNextPuzzle = useCallback(async (opts = {}) => {
    setLoading(true)
    setResult(null)
    setShowWrongOverlay(false)
    if (wrongOverlayTimerRef.current) { clearTimeout(wrongOverlayTimerRef.current); wrongOverlayTimerRef.current = null }
    setShowHint(false)
    setShowSolution(false)
    setTimer(0)
    timerValRef.current = 0
    setMoveCount(0)
    setNextMoveIdx(0)
    setSel(null)
    setLegal([])
    setLastM(null)
    setChk([])
    setRunning(false)
    setPromo(null)
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)

    // Try up to 5 puzzles to find one with a valid solution
    for (let attempt = 0; attempt < 5; attempt++) {
      const p = await gen.current.getNextPuzzle({
        difficulty: opts.difficulty ?? difficulty,
        theme: opts.theme ?? themeFilter,
        preferOnline: opts.preferOnline ?? preferOnline,
      })

      if (!p) { setLoading(false); return }

      // Validate: solution must have at least 2 moves (1 player + 1 opponent)
      if (!p.moves || p.moves.length < 2) {
        console.warn('Puzzle has too few moves, trying next...', p.id)
        continue
      }

      // Parse FEN and set up engine
      const eng = new ChessEngine()
      eng.loadFEN(p.fen)

      // Verify the solution moves are actually legal in this position
      let valid = true
      const testEng = new ChessEngine()
      testEng.loadFEN(p.fen)
      for (const uci of p.moves) {
        const from = uci.substring(0, 2)
        const to = uci.substring(2, 4)
        const promo = uci.length > 4 ? uci[4] : null
        const r = testEng.move(from, to, promo)
        if (!r) {
          console.warn('Invalid move in puzzle solution:', uci, 'at position', testEng.getFEN())
          valid = false
          break
        }
      }
      if (!valid) continue

      // Puzzle is valid! Set it up
      engineRef.current = eng

      const fenParts = p.fen.split(' ')
      const turn = fenParts[1] === 'w' ? 'w' : 'b'
      const pColor = p.playerColor || turn

      // Parse solution moves
      const sol = p.moves.map(_parseUci)

      setPuzzle(p)
      puzzleRef.current = p
      setSolution(sol)
      setPlayerColor(pColor)
      setTurn(turn)
      setBrd(eng.getBoard())
      setFlip(pColor === 'b')
      setLoading(false)

      if (turn === pColor) {
        setRunning(true)
      }
      return
    }

    // All attempts failed — show loading error
    setLoading(false)
  }, [difficulty, themeFilter, preferOnline])

  // Initialize
  useEffect(() => {
    loadNextPuzzle()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer — use ref to avoid re-creating _tryMove every second
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        timerValRef.current += 1
        setTimer(timerValRef.current)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  // ─── Auto-play opponent's move ───
  const autoPlayOpponent = useCallback((idx) => {
    if (idx >= solution.length) return
    const eng = engineRef.current
    if (!eng) return

    const move = solution[idx]

    autoTimerRef.current = setTimeout(() => {
      const r = eng.move(move.from, move.to, move.promotion)
      if (r) {
        _applyMoveToBoard(eng)
        setLastM(r)
        setMoveCount(c => c + 1)
        if (r.captured) SFX.capture()
        else SFX.move()
        if (eng.isInCheck()) setTimeout(() => SFX.check(), 120)
        setNextMoveIdx(idx + 1)
        // After opponent moves, start timer for player's turn
        setRunning(true)
      }
    }, 400)
  }, [solution])

  // ─── When nextMoveIdx changes, check if we need to auto-play ───
  useEffect(() => {
    if (nextMoveIdx >= solution.length || result) return

    if (!_isPlayerTurn(nextMoveIdx)) {
      // It's the opponent's turn — auto-play
      setRunning(false)
      autoPlayOpponent(nextMoveIdx)
    } else if (nextMoveIdx > 0) {
      // It's the player's turn after an opponent move — start timer
      setRunning(true)
    }
  }, [nextMoveIdx, result, solution, autoPlayOpponent])

  // ─── Detect if a move is a pawn promotion ───
  const _isPromotion = useCallback((from, to) => {
    const eng = engineRef.current
    if (!eng) return false
    const p = eng.getPiece(from)
    if (!p || p.type !== 'p') return false
    return (p.color === 'w' && to[1] === '8') || (p.color === 'b' && to[1] === '1')
  }, [])

  // ─── Player tries a move ───
  const _tryMove = useCallback((from, to, promotionChoice) => {
    if (result || !puzzleRef.current || showSolution) return
    if (turn !== playerColor) return
    if (nextMoveIdx >= solution.length) return

    const eng = engineRef.current
    if (!eng) return

    const expected = solution[nextMoveIdx]

    // Check if move matches expected (from + to)
    if (from !== expected.from || to !== expected.to) {
      // Wrong destination — wrong move
      setResult('wrong')
      setShowWrongOverlay(true)
      setRunning(false)
      // Auto-dismiss overlay after 3 seconds
      if (wrongOverlayTimerRef.current) clearTimeout(wrongOverlayTimerRef.current)
      wrongOverlayTimerRef.current = setTimeout(() => { setShowWrongOverlay(false); wrongOverlayTimerRef.current = null }, 3000)
      gen.current.recordResult(puzzleRef.current, false, timerValRef.current)
      setStats(gen.current.getStats())
      SFX.error()
      setSel(null); setLegal([])
      return
    }

    // Move destination matches — now handle promotion
    const expectedPromo = expected.promotion || null
    const isPromoMove = !!expectedPromo || _isPromotion(from, to)

    if (isPromoMove && !expectedPromo && _isPromotion(from, to)) {
      // Move is a promotion but solution doesn't expect one (shouldn't happen with correct data)
      // Auto-promote to queen
    }

    if (expectedPromo) {
      // Solution expects a promotion
      if (!promotionChoice) {
        // Player hasn't chosen a piece yet — show promotion bar
        setPromo({ from, to })
        return
      }
      // Player chose a piece — check if it matches the expected promotion
      if (promotionChoice !== expectedPromo) {
      // Wrong promotion piece
      setResult('wrong')
      setShowWrongOverlay(true)
      setRunning(false)
      // Auto-dismiss overlay after 3 seconds
      if (wrongOverlayTimerRef.current) clearTimeout(wrongOverlayTimerRef.current)
      wrongOverlayTimerRef.current = setTimeout(() => { setShowWrongOverlay(false); wrongOverlayTimerRef.current = null }, 3000)
        gen.current.recordResult(puzzleRef.current, false, timerValRef.current)
        setStats(gen.current.getStats())
        SFX.error()
        setSel(null); setLegal([])
        setPromo(null)
        return
      }
    }

    // Move is correct (including promotion piece if applicable)
    const actualPromo = promotionChoice || expectedPromo || undefined
    const r = eng.move(from, to, actualPromo)
    if (r) {
      _applyMoveToBoard(eng)
      setLastM(r)
      setMoveCount(c => c + 1)
      setSel(null); setLegal([])
      setPromo(null)
      if (promoTimerRef.current) { clearTimeout(promoTimerRef.current); promoTimerRef.current = null }
      if (r.captured) SFX.capture()
      else if (actualPromo) SFX.promote()
      else SFX.move()
      if (eng.isInCheck()) setTimeout(() => SFX.check(), 120)

      const nextIdx = nextMoveIdx + 1
      setNextMoveIdx(nextIdx)

      if (nextIdx >= solution.length) {
        // Puzzle solved!
        setResult('correct')
        setRunning(false)
        gen.current.recordResult(puzzleRef.current, true, timerValRef.current)
        setStats(gen.current.getStats())
        SFX.promote()
        autoTimerRef.current = setTimeout(() => loadNextPuzzle(), 2500)
      }
    }
  }, [result, showSolution, turn, playerColor, nextMoveIdx, solution, loadNextPuzzle, _isPromotion])

  // ─── Click on square ───
  const clickSq = useCallback((sq) => {
    if (result || loading || !puzzle || showSolution) return
    if (turn !== playerColor) return
    if (nextMoveIdx >= solution.length) return
    if (promo) return // Don't allow clicks while promotion bar is showing

    const eng = engineRef.current
    if (!eng) return
    const p = eng.getPiece(sq)

    if (sel) {
      if (sel === sq) { setSel(null); setLegal([]); return }
      if (legal.some(m => m.to === sq)) {
        // Check if this is a promotion move
        if (_isPromotion(sel, sq)) {
          setPromo({ from: sel, to: sq })
        } else {
          _tryMove(sel, sq)
        }
        return
      }
      if (p && p.color === playerColor) {
        setSel(sq)
        setLegal(eng.getLegalMoves(sq).map(m => ({ ...m, to: m.to, from: m.from })))
        return
      }
      SFX.error()
      setSel(null); setLegal([])
      return
    }

    if (p && p.color === playerColor) {
      setSel(sq)
      setLegal(eng.getLegalMoves(sq).map(m => ({ ...m, to: m.to, from: m.from })))
    }
  }, [sel, legal, result, loading, puzzle, turn, playerColor, showSolution, nextMoveIdx, solution, _tryMove, _isPromotion, promo])

  // Cleanup overlay timer on unmount
  useEffect(() => {
    return () => { if (wrongOverlayTimerRef.current) clearTimeout(wrongOverlayTimerRef.current) }
  }, [])

  // ─── Change promotion piece (called from promotion bar) ───
  const changePromo = useCallback((pt) => {
    if (!promo) return
    _tryMove(promo.from, promo.to, pt)
  }, [promo, _tryMove])

  // ─── Drop piece ───
  const drop = useCallback((from, to) => {
    if (result || loading || !puzzle || showSolution) return
    if (turn !== playerColor) return
    if (promo) return
    if (_isPromotion(from, to)) {
      setPromo({ from, to })
    } else {
      _tryMove(from, to)
    }
  }, [result, loading, puzzle, turn, playerColor, showSolution, _tryMove, _isPromotion, promo])

  // ─── Auto-promo timeout (like Game.jsx) ───
  useEffect(() => {
    if (!promo) return
    const t = setTimeout(() => {
      // Auto-promote to queen if player doesn't choose within 5 seconds
      changePromo('q')
    }, 5000)
    promoTimerRef.current = t
    return () => { if (promoTimerRef.current) { clearTimeout(promoTimerRef.current); promoTimerRef.current = null } }
  }, [promo, changePromo])

  // ─── Actions ───
  const revealSolution = () => {
    setResult(null)
    setShowWrongOverlay(false)
    setShowSolution(true)
    setRunning(false)
    // Replay the full solution from the start
    const eng = new ChessEngine()
    eng.loadFEN(puzzle.fen)
    engineRef.current = eng

    let delay = 0
    puzzle.moves.forEach((uci, i) => {
      delay += i === 0 ? 300 : 500
      const m = _parseUci(uci)
      setTimeout(() => {
        const r = eng.move(m.from, m.to, m.promotion)
        if (r) {
          _applyMoveToBoard(eng)
          setLastM(r)
        }
      }, delay)
    })
  }

  const skipPuzzle = () => {
    gen.current.recordResult(puzzleRef.current, false, timer)
    setStats(gen.current.getStats())
    loadNextPuzzle()
  }

  const getHint = () => {
    if (!puzzle || nextMoveIdx >= solution.length) return
    setShowHint(true)
    setTimeout(() => setShowHint(false), 2500)
  }

  // ─── Rendering ───
  const boardFlipped = playerColor === 'b' ? !flip : flip
  const themeInfo = puzzle?.theme ? PUZZLE_THEMES[puzzle.theme] : null
  const ratingInfo = Object.values(RATING_RANGES).find(r => puzzle?.rating >= r.min && puzzle?.rating <= r.max)
    || RATING_RANGES.easy

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
  }

  const accuracy = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0

  if (loading && !puzzle) {
    return (
      <div className="puzzle">
        <div className="pz-loading">
          <div className="pz-spinner" />
          <p>Cargando puzzle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="puzzle">
      {/* ═══ TOP BAR ═══ */}
      <div className="pz-bar">
        <div className="pz-bar-left">
          <button className="pz-back" onClick={() => nav('/')} title="Inicio">← Inicio</button>
          <span className="pz-title">🧩 Puzzle</span>
        </div>
        <div className="pz-bar-right">
          <button className="pz-icon-btn" onClick={() => setShowStats(!showStats)} title="Estadísticas">📊</button>
          <button className="pz-icon-btn" onClick={() => setShowFilters(!showFilters)} title="Filtros">⚙️</button>
          <span className="pz-user-rating" title="Tu rating">⭐ {stats.rating || 1500}</span>
          <span className="pz-streak" title="Racha actual">🔥 {stats.streak}</span>
        </div>
      </div>

      {/* ═══ FILTER PANEL ═══ */}
      {showFilters && (
        <div className="pz-filters">
          <div className="pz-filter-section">
            <span className="pz-filter-label">Dificultad</span>
            <div className="pz-filter-chips">
              <button className={`pz-chip ${difficulty === 'any' ? 'pz-chip-active' : ''}`}
                onClick={() => setDifficulty('any')}>Todas</button>
              {Object.entries(RATING_RANGES).map(([key, val]) => (
                <button key={key} className={`pz-chip ${difficulty === key ? 'pz-chip-active' : ''}`}
                  onClick={() => setDifficulty(key)}>
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pz-filter-section">
            <span className="pz-filter-label">Tema</span>
            <div className="pz-filter-chips">
              <button className={`pz-chip ${themeFilter === 'any' ? 'pz-chip-active' : ''}`}
                onClick={() => setThemeFilter('any')}>Todos</button>
              {Object.entries(PUZZLE_THEMES).map(([key, val]) => (
                <button key={key} className={`pz-chip ${themeFilter === key ? 'pz-chip-active' : ''}`}
                  onClick={() => setThemeFilter(key)}>
                  {val.icon} {val.name}
                </button>
              ))}
            </div>
          </div>
          <div className="pz-filter-section">
            <label className="pz-toggle">
              <input type="checkbox" checked={preferOnline} onChange={e => setPreferOnline(e.target.checked)} />
              <span>🌐 Buscar puzzles online (Lichess)</span>
            </label>
          </div>
          <button className="pz-apply" onClick={() => { setShowFilters(false); loadNextPuzzle() }}>
            Aplicar filtros
          </button>
        </div>
      )}

      {/* ═══ STATS PANEL ═══ */}
      {showStats && (
        <div className="pz-stats-panel">
          <h4>📊 Tu rendimiento</h4>
          {/* Rating display */}
          {(() => {
            const ratingClass = gen.current.getRatingClass(stats.rating || 1500)
            const change = stats.ratingChange || 0
            return (
              <div className="pz-rating-display">
                <div className="pz-rating-main">
                  <span className="pz-rating-icon">{ratingClass.icon}</span>
                  <span className="pz-rating-value" style={{ color: ratingClass.color }}>{stats.rating || 1500}</span>
                  <span className="pz-rating-label" style={{ color: ratingClass.color }}>{ratingClass.label}</span>
                </div>
                {change !== 0 && (
                  <span className="pz-rating-change" style={{ color: change > 0 ? '#4CAF50' : '#F44336' }}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                )}
              </div>
            )
          })()}
          <div className="pz-stats-grid">
            <div className="pz-stat-box">
              <span className="pz-stat-num">{stats.total}</span>
              <span className="pz-stat-lbl">Intentados</span>
            </div>
            <div className="pz-stat-box">
              <span className="pz-stat-num" style={{ color: '#4CAF50' }}>{stats.solved}</span>
              <span className="pz-stat-lbl">Resueltos</span>
            </div>
            <div className="pz-stat-box">
              <span className="pz-stat-num" style={{ color: '#F44336' }}>{stats.failed}</span>
              <span className="pz-stat-lbl">Fallidos</span>
            </div>
            <div className="pz-stat-box">
              <span className="pz-stat-num" style={{ color: '#FFD700' }}>{accuracy}%</span>
              <span className="pz-stat-lbl">Precisión</span>
            </div>
            <div className="pz-stat-box">
              <span className="pz-stat-num" style={{ color: '#FF6A00' }}>🔥 {stats.bestStreak}</span>
              <span className="pz-stat-lbl">Mejor racha</span>
            </div>
            <div className="pz-stat-box">
              <span className="pz-stat-num">{formatTime(Math.round(stats.avgSolveTime || 0))}</span>
              <span className="pz-stat-lbl">Tiempo medio</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PUZZLE INFO ═══ */}
      {puzzle && (
        <div className="pz-info">
          <div className="pz-info-left">
            <span className="pz-rating" style={{ background: `${ratingInfo.color}22`, color: ratingInfo.color }}>
              {ratingInfo.icon} {puzzle.rating}
            </span>
            {themeInfo && (
              <span className="pz-theme" style={{ background: `${themeInfo.color}22`, color: themeInfo.color }}>
                {themeInfo.icon} {themeInfo.name}
              </span>
            )}
          </div>
          <div className="pz-info-right">
            <span className="pz-timer">⏱ {formatTime(timer)}</span>
            <span className="pz-moves">♟ {moveCount} jugadas</span>
          </div>
        </div>
      )}

      {/* ═══ MAIN BOARD ═══ */}
      <div className="pz-main">
        <div className="pz-board-area">
          {/* Player label — top */}
          <div className="pz-player pz-player-top">
            <span className="pz-player-name">
              {playerColor === 'w' ? '♚ Negras' : '♔ Blancas'}
              <span className="pz-player-ai">Stockfish</span>
            </span>
          </div>

          {/* Board */}
          <div className="pz-board-wrap">
            {puzzle && (
              <Board
                board={brd}
                flipped={boardFlipped}
                selected={sel}
                legalMoves={legal}
                lastMove={lastM}
                checkSq={chk}
                onSquareClick={clickSq}
                onPieceDrop={drop}
                isSelectable={!result && !showSolution && turn === playerColor && !promo}
                boardTheme="classic"
              />
            )}

            {/* Promotion bar — matches Game.jsx */}
            {promo && (
              <div className="promobar">
                <span className="plbl">Ascender</span>
                {['q','r','b','n'].map(pt => (
                  <button key={pt} className="pbtn" onClick={() => changePromo(pt)}>
                    <ChessPiece color={playerColor} type={pt} />
                  </button>
                ))}
              </div>
            )}

            {/* Result overlay */}
            {result === 'correct' && (
              <div className="pz-result-overlay pz-correct">
                <span className="pz-result-icon">✅</span>
                <span className="pz-result-text">¡Correcto!</span>
                {stats.ratingChange != null && stats.ratingChange !== 0 && (
                  <span className="pz-result-rating" style={{ color: stats.ratingChange > 0 ? '#4CAF50' : '#F44336' }}>
                    {stats.ratingChange > 0 ? '+' : ''}{stats.ratingChange} rating
                  </span>
                )}
              </div>
            )}
            {result === 'wrong' && showWrongOverlay && (
              <div className="pz-result-overlay pz-wrong" onClick={(e) => { e.stopPropagation(); setShowWrongOverlay(false) }} style={{ cursor: 'pointer' }}>
                <button className="pz-close-btn" onClick={(e) => { e.stopPropagation(); setShowWrongOverlay(false) }} title="Cerrar">✕</button>
                <span className="pz-result-icon">❌</span>
                <span className="pz-result-text">Incorrecto</span>
                <span className="pz-result-sub">Toca para cerrar</span>
                {stats.ratingChange != null && stats.ratingChange !== 0 && (
                  <span className="pz-result-rating" style={{ color: '#F44336' }}>
                    {stats.ratingChange} rating
                  </span>
                )}
              </div>
            )}

            {/* Hint overlay */}
            {showHint && solution[nextMoveIdx] && (
              <div className="pz-hint-overlay">
                <span>Mueve desde: {solution[nextMoveIdx].from}</span>
              </div>
            )}
          </div>

          {/* Player label — bottom */}
          <div className="pz-player pz-player-bottom">
            <span className="pz-player-name">
              {playerColor === 'w' ? '♔ Blancas' : '♚ Negras'}
              <span className="pz-player-you">Tú</span>
            </span>
          </div>
        </div>

        {/* ═══ CONTROLS ═══ */}
        <div className="pz-controls">
          {!result && !showSolution && (
            <>
              <button className="pz-btn pz-btn-hint" onClick={getHint} title="Pista">
                💡 Pista
              </button>
              <button className="pz-btn pz-btn-skip" onClick={skipPuzzle} title="Saltar">
                ⏭ Saltar
              </button>
            </>
          )}
          {result === 'wrong' && (
            <>
              <button className="pz-btn pz-btn-retry" onClick={() => {
                // Reset puzzle to initial state for retry
                setResult(null)
                setShowWrongOverlay(false)
                if (wrongOverlayTimerRef.current) { clearTimeout(wrongOverlayTimerRef.current); wrongOverlayTimerRef.current = null }
                setTimer(0)
                setMoveCount(0)
                setNextMoveIdx(0)
                setSel(null)
                setLegal([])
                setLastM(null)
                setChk([])
                setShowHint(false)
                setPromo(null)
                timerValRef.current = 0
                // Re-parse solution and reset engine
                const eng = new ChessEngine()
                eng.loadFEN(puzzle.fen)
                engineRef.current = eng
                setBrd(eng.getBoard())
                setTurn(eng.getTurn())
                setChk(eng.isInCheck() ? findKing(eng.getBoard(), eng.getTurn()) : [])
                setRunning(true)
              }} title="Reintentar">
                🔄 Reintentar
              </button>
              <button className="pz-btn pz-btn-solution" onClick={revealSolution} title="Ver solución">
                👁 Ver solución
              </button>
              <button className="pz-btn pz-btn-next" onClick={() => loadNextPuzzle()} title="Siguiente">
                ⏭ Siguiente
              </button>
            </>
          )}
          {showSolution && (
            <button className="pz-btn pz-btn-next" onClick={() => loadNextPuzzle()} title="Siguiente">
              ⏭ Siguiente puzzle
            </button>
          )}
          <button className="pz-btn pz-btn-flip" onClick={() => setFlip(!flip)} title="Girar tablero">
            🔄
          </button>
        </div>

        {/* ═══ PUZZLE NAME ═══ */}
        {puzzle && (
          <div className="pz-puzzle-name">
            {puzzle.name || `Puzzle #${puzzle.id}`}
            {puzzle.source === 'lichess' && <span className="pz-source">via Lichess</span>}
          </div>
        )}

        {/* ═══ THEME DESCRIPTION ═══ */}
        {themeInfo && (
          <div className="pz-theme-desc" style={{ borderLeftColor: themeInfo.color }}>
            <strong>{themeInfo.icon} {themeInfo.name}:</strong> {themeInfo.desc}
          </div>
        )}
      </div>
    </div>
  )
}
