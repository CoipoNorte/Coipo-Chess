import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import ChessEngine from '../utils/chessEngine'
import AIPlayer from '../utils/aiPlayer'
import { obfuscateBoard } from '../utils/blindMode'
import { resolveBoardOrientation } from '../utils/boardOrientation'
import Board from './Board'
import { ChessPiece } from './ChessPieces'
import ChessClock from './ChessClock'
import EvalGraph from './EvalGraph'
import * as SFX from '../utils/sounds'
import { toggleMute, setVolume as setSFXVolume, setProfile as setSFXProfile } from '../utils/sounds'
import { getCustomizationConfig, BOARD_THEMES, AMBIENT_THEMES, SOUND_PROFILES, saveCustomizationConfig } from '../utils/customization'
import './Game.css'

const PV = { q:9, r:5, b:3, n:3, p:1 }
const TIME_THRESHOLDS = { fast: 3, slow: 15, verySlow: 30 }
const timeClass = (t) => {
  if (t == null) return ''
  if (t < TIME_THRESHOLDS.fast) return 'gtime-fast'
  if (t < TIME_THRESHOLDS.slow) return ''
  if (t < TIME_THRESHOLDS.verySlow) return 'gtime-slow'
  return 'gtime-very-slow'
}


export default function Game() {
  const { mode } = useParams()
  const loc = useLocation()
  const nav = useNavigate()

  const eng = useRef(new ChessEngine())
  const [engine] = useState(() => eng.current)
  const ai = useRef(null)
  const pm = useRef(null)
  const histRef = useRef(null)
  const clockRef = useRef(null)
  const aiCancelRef = useRef(false) // Cancel pending AI move on undo/newGame

  // Estado
  const [brd, setBrd] = useState([])
  const [turn, setTurn] = useState('w')
  const [sel, setSel] = useState(null)
  const [legal, setLegal] = useState([])
  const [lastM, setLastM] = useState(null)
  const [chk, setChk] = useState([])
  const [status, setStatus] = useState('PLAYING')
  const [caps, setCaps] = useState({ w:[], b:[] })
  const [hist, setHist] = useState([])
  const [pColor, setPColor] = useState('w')
  const [myTurn, setMyTurn] = useState(true)
  const [aiThk, setAiThk] = useState(false)
  const [aiDiff, setAiDiff] = useState('medium')
  const [showDiff, setShowDiff] = useState(false)
  const [showGO, setShowGO] = useState(false)
  const [showThemeSelect, setShowThemeSelect] = useState(false)
  const [showCustomSelect, setShowCustomSelect] = useState(false)

  const [goText, setGoText] = useState('')
  const [flip, setFlip] = useState(false)
  const [ambientTheme, setAmbientTheme] = useState('none')
  const [soundProfile, setSoundProfile] = useState('wood')
  const [boardTheme, setBoardTheme] = useState(() => localStorage.getItem('coipo-board-theme') || 'classic')
  const [blindBrd, setBlindBrd] = useState(null)
  const boardFlipped = resolveBoardOrientation(pColor, flip)
  const [promo, setPromo] = useState(null) // { from, to }
  const [aiSt, setAiSt] = useState('…')
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1.0)
  const changeBoardTheme = (id) => { setBoardTheme(id); localStorage.setItem('coipo-board-theme', id); setShowThemeSelect(false) }
  const [clockTime, setClockTime] = useState(300) // 5 minutes default
  const [clockIncrement, setClockIncrement] = useState(0)
  const [clockRunning, setClockRunning] = useState(false)
  const [showClockSelect, setShowClockSelect] = useState(false)
  const [moveTimes, setMoveTimes] = useState([]) // seconds per move
  const moveStartRef = useRef(null) // Date.now() when current turn starts
  const [chatMsgs, setChatMsgs] = useState([]) // { text, me, time }
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const chatRef = useRef(null)
  const [matPulse, setMatPulse] = useState(false)
  const [evalHistory, setEvalHistory] = useState([])
  const [showDrawOffer, setShowDrawOffer] = useState(false)
  const [pendingDrawFn, setPendingDrawFn] = useState(null)
  const [premove, setPremove] = useState(null) // { from, to }
  const [premoveSrc, setPremoveSrc] = useState(null) // source square during premove selection
  const [onlineStatus, setOnlineStatus] = useState('connected') // 'connected' | 'reconnecting' | 'lost'
  const [hintMove, setHintMove] = useState(null) // { from, to } - suggested move from AI
  const [capturableSq, setCapturableSq] = useState([]) // squares with capturable opponent pieces

  // ─── Move navigation ───
  const fenHistoryRef = useRef([]) // FENs after each move (index 0 = after move 1)
  const [viewingMove, setViewingMove] = useState(-1) // -1 = current position, 0..n = move index
  const savedBoardRef = useRef(null) // snapshot of brd when viewing history
  const savedTurnRef = useRef(null)

  // ─── Hint timeout ref ───
  const hintTimerRef = useRef(null)
  // Cleanup hint timer on unmount
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    }
  }, [])

  const prevAdvRef = useRef(0)
  const matPulseTimerRef = useRef(null)

  useEffect(() => {
    const handleKeys = (e) => {
      // Escape always works
      if (e.key === 'Escape') {
        if (showGO) setShowGO(false)
        else if (showThemeSelect) setShowThemeSelect(false)
        else if (showClockSelect) setShowClockSelect(false)
        else if (showDiff) setShowDiff(false)
        else if (showCustomSelect) setShowCustomSelect(false)
        else if (chatOpen) setChatOpen(false)
        else if (premove || premoveSrc) { setPremove(null); setPremoveSrc(null) }
        else if (hintMove) { setHintMove(null) }
        return
      }

      // ─── Keyboard shortcuts ───
      const isCtrl = e.ctrlKey || e.metaKey

      // Ctrl+Z: undo (local modes)
      if (isCtrl && e.key === 'z') {
        e.preventDefault()
        if (local) undo()
        return
      }

      // H/h: hint (vsPC mode)
      if ((e.key === 'h' || e.key === 'H') && !isCtrl && vsPC) {
        e.preventDefault()
        if (hintMove) { setHintMove(null); return }
        if (!aiThk) getHint()
        return
      }

      // R/r: resign
      if ((e.key === 'r' || e.key === 'R') && !isCtrl && status === 'PLAYING') {
        e.preventDefault()
        resign()
        return
      }

      // N/n: new game (when game over)
      if ((e.key === 'n' || e.key === 'N') && !isCtrl && showGO) {
        e.preventDefault()
        newGame()
        return
      }

      // ←/→: navigate moves
      if (e.key === 'ArrowLeft' && hist.length > 0) {
        e.preventDefault()
        navigateToMove(viewingMove - 1)
        return
      }
      if (e.key === 'ArrowRight' && hist.length > 0) {
        e.preventDefault()
        navigateToMove(viewingMove + 1)
        return
      }
    }
    window.addEventListener('keydown', handleKeys)
    return () => window.removeEventListener('keydown', handleKeys)
  }, [showGO, showThemeSelect, showClockSelect, showDiff, showCustomSelect, chatOpen, premove, premoveSrc, hintMove, vsPC, aiThk, local, status, hist.length, viewingMove])

  const routeState = loc.state || window.__coipoRouteState || {}
  const isHost = routeState.isHost ?? true
  const isHostRef = useRef(isHost)

  const vsPC  = mode === 'vspc' || mode === 'pc-levels'
  const solo  = mode === 'solo'
  const blind = mode === 'blind'
  const online = mode === 'pvp' || mode === 'blind'
  const local = vsPC || solo
  const premoveEnabled = online || vsPC
  const isViewingHistory = viewingMove >= 0 && viewingMove < hist.length

  // Init
  useEffect(() => {
    const st = routeState || {}
    const pc = st.playerColor || 'w'
    const stDiff = st.aiDifficulty || 'medium'
    if (aiDiff !== stDiff) setAiDiff(stDiff)
    if (online) {
      const p = st.peerManager || window.__coipoPeerManager
      if (!p) { nav('/'); return }
      pm.current = p; setPColor(pc); setMyTurn(pc === 'w')
      p.onData(d => peerDataRef.current?.(d))
      p.onDisconnected(() => {
        setOnlineStatus('reconnecting')
        setGoText('Conexión perdida — reconectando...')
        // If reconnection fails after timeout, show game over
        const reconnectTimeout = setTimeout(() => {
          if (!p.isConnected()) {
            setOnlineStatus('lost')
            setGoText('Se perdió la conexión con el rival')
            setShowGO(true)
            SFX.gameOver()
          }
        }, 10000)
        // Clear timeout if they reconnect before it fires
        const cleanup = () => {
          clearTimeout(reconnectTimeout)
          setOnlineStatus('connected')
          setGoText('')
        }
        p.onConnected(cleanup)
      })
      setOnlineStatus('connected')
    } else {
      // Clean stale P2P state for local/AI modes
      try {
        delete window.__coipoRouteState
        delete window.__coipoPeerManager
      } catch(e) {}
    }
    if (vsPC) { const a = new AIPlayer(stDiff || 'medium'); ai.current = a; a.init().then(()=>setAiSt('SF')).catch(()=>setAiSt('local')) }
    // Cargar configuración de personalización modular
    const customConfig = getCustomizationConfig()
    setBoardTheme(customConfig.boardTheme || 'classic')
    setSoundProfile(customConfig.soundProfile || 'wood')
    setAmbientTheme(customConfig.ambientTheme || 'none')
    setSoundProfile(customConfig.soundProfile || 'wood')
    setVolume(customConfig.volume ?? 1.0)
    setSFXVolume(customConfig.volume ?? 1.0)
    setSFXProfile(customConfig.soundProfile || 'wood')

    engine.reset(); refresh(pc)
    setFlip(false)
    fenHistoryRef.current = []
    setViewingMove(-1)
    setHintMove(null)
    setCapturableSq([])
    console.log('[Game] Init mode:', mode, 'vsPC:', vsPC, 'pc:', pc, 'board:', engine.getBoard().length)
    setMoveTimes([])
    moveStartRef.current = Date.now()
    setClockRunning(false)
    // Play game start sound after first user interaction
    const playStart = () => { SFX.gameStart(); window.removeEventListener('click', playStart) }
    window.addEventListener('click', playStart, { once: true })
    return () => {
      try { pm.current?.disconnect() } catch(e) {}
      try { delete window.__coipoPeerManager } catch(e) {}
      try { delete window.__coipoRouteState } catch(e) {}
      try { ai.current?.destroy() } catch(e) {}
      window.removeEventListener('click', playStart)
    }
  }, [])

  // IA trigger — stable deps via ref
  const makeAIRef = useRef(null)
  useEffect(() => {
    if (vsPC && !myTurn && (status === 'PLAYING' || status === 'CHECK') && !aiThk && !promo) {
      const t = setTimeout(() => makeAIRef.current?.(), 200); return () => clearTimeout(t)
    }
  }, [myTurn, status, aiThk, promo, vsPC])

  // Premove execution — when myTurn becomes true, execute stored premove
  useEffect(() => {
    if (!myTurn || !premove || promo) return
    if ((status !== 'PLAYING' && status !== 'CHECK') || aiThk) return

    const { from, to } = premove
    setPremove(null)
    setPremoveSrc(null)

    // Verify the move is still legal
    const legalMoves = engine.getLegalMoves(from)
    if (legalMoves.some(m => m.to === to)) {
      // Execute the premove
      const p = engine.getPiece(from)
      if (p?.type === 'p' && ((p.color==='w'&&to[1]==='8')||(p.color==='b'&&to[1]==='1'))) {
        // Pawn promotion — auto queen
        const r = engine.move(from, to, 'q')
        if (r) { SFX.promote(); afterMove(r) }
      } else {
        const r = engine.move(from, to)
        if (r) afterMove(r)
      }
    }
  }, [myTurn])

  // Auto-promo
  useEffect(() => {
    if (!promo) return
    const t = setTimeout(() => {
      const r = engine.move(promo.from, promo.to, 'q')
      if (r) { SFX.promote(); afterMove(r); setPromo(null) }
    }, 2000)
    return () => clearTimeout(t)
  }, [promo])

  // Auto-scroll historial
  useEffect(() => {
    if (histRef.current) histRef.current.scrollTop = histRef.current.scrollHeight
  }, [hist.length])

  // Material (debe ir antes del useEffect que usa adv)
  const matVal = (c) => c.reduce((s,p)=>s+(PV[p]||0),0)
  const wCap = matVal(caps.b), bCap = matVal(caps.w)
  const adv = wCap - bCap

  // Material pulse animation when advantage changes significantly
  useEffect(() => {
    const diff = Math.abs(adv - prevAdvRef.current)
    if (diff >= 2 && adv !== 0) {
      setMatPulse(true)
      if (matPulseTimerRef.current) clearTimeout(matPulseTimerRef.current)
      matPulseTimerRef.current = setTimeout(() => setMatPulse(false), 900)
    }
    prevAdvRef.current = adv
    return () => { if (matPulseTimerRef.current) clearTimeout(matPulseTimerRef.current) }
  }, [adv])

  // Recalcular blind board al cambiar rotación o color local
  useEffect(() => {
    if (blind && engine) {
      setBlindBrd(obfuscateBoard(engine.getBoard(), pColor))
    }
  }, [flip, pColor, blind, engine])

  // Aplicar tema ambiente al body
  useEffect(() => {
    const theme = AMBIENT_THEMES.find(a => a.id === ambientTheme)
    if (theme) {
      document.body.style.background = theme.color
      document.body.style.backgroundImage = theme.bgImage
      document.body.style.backgroundAttachment = 'fixed'
    }
    return () => {
      document.body.style.background = ''
      document.body.style.backgroundImage = ''
    }
  }, [ambientTheme])

  // Sincronizar perfil de sonido con SFX module
  useEffect(() => {
    setSFXProfile(soundProfile)
  }, [soundProfile])

  // Monitoreo de conexión P2P usando el heartbeat de peerManager
  const peerDataRef = useRef(null)
  useEffect(() => {
    if (!online) return
    const interval = setInterval(() => {
      try {
        if (!pm.current) return
        if (!pm.current.isConnected()) {
          setOnlineStatus('reconnecting')
          // Try to recover from __coipoRouteState
          const stRecovered = loc.state || window.__coipoRouteState || {}
          const p = pm.current || stRecovered.peerManager || window.__coipoPeerManager
          if (p && p !== pm.current) {
            pm.current = p
            const cb = peerDataRef.current
            p.onData(d => cb(d))
          }
        } else {
          setOnlineStatus(prev => prev === 'reconnecting' ? 'connected' : prev)
        }
      } catch (e) {
        console.warn('Error al verificar conexión P2P:', e)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [online, nav, loc])

  const gameOver = useCallback((st) => {
    let r = ''; const w = engine.getTurn()==='w'?'Negras':'Blancas'
    if (st==='CHECKMATE') { r=`Jaque mate. ${w} ganan.`; SFX.checkmate(); setTimeout(()=>SFX.victory(), 600); setTimeout(()=>SFX.gameOver(), 400) }
    else if (st==='STALEMATE') { r='Ahogado. Tablas.'; SFX.gameOver() }
    else if (st==='DRAW') { r='Tablas.'; SFX.gameOver() }
    else return
    setGoText(r); setTimeout(()=>setShowGO(true), 500)
  }, [engine])

  const refresh = useCallback((playerColorOverride = pColor) => {
    const b = engine.getBoard(), t = engine.getTurn(), s = engine.getGameStatus()
    const lm = engine.moveHistory.length > 0 ? engine.moveHistory[engine.moveHistory.length-1] : null
    let ck = []
    if (engine.isInCheck()) {
      for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (b[r][c]?.type==='k' && b[r][c]?.color===t) ck.push(String.fromCharCode(97+c)+(8-r))
    }
    setBrd(b); setTurn(t); setLastM(lm); setChk(ck); setStatus(s)
    setCaps({...engine.capturedPieces}); setHist([...engine.moveHistory])
    if (blind) setBlindBrd(obfuscateBoard(b, playerColorOverride))
    if (s !== 'PLAYING') gameOver(s)
    setSel(null); setLegal([])
  }, [engine, blind, pColor, gameOver])

  const peerData = useCallback((d) => {
    if (!d?.type) return
    switch (d.type) {
      case 'MOVE': if(d.data){const r=engine.move(d.data.from,d.data.to,d.data.promotion);if(r){if(r.captured)playCaptureSound(r.captured);else if(r.flags?.includes('k'))SFX.castle();else SFX.move();if(engine.isInCheck())setTimeout(()=>SFX.check(),120);setMoveTimes(prev => [...prev, null]);setMyTurn(true);refresh()}}break
      case 'RESIGN': setGoText('El rival se rindió'); setShowGO(true); SFX.gameOver(); break
      case 'DRAW_OFFER':
        setPendingDrawFn(() => () => {
          pm.current?.sendDrawAccept()
          setGoText('Tablas')
          setShowGO(true)
          setShowDrawOffer(false)
        })
        setShowDrawOffer(true)
        break
      case 'DRAW_ACCEPT': setGoText('Tablas'); setShowGO(true); break
      case 'CLOCK_SYNC':
        if (d.data) {
          setClockTime(d.data.time)
          setClockIncrement(d.data.increment)
        }
        break
      case 'CHAT':
        if (d.data) {
          setChatMsgs(prev => [...prev, { text: d.data, me: false, time: Date.now() }])
          setChatOpen(true)
        }
        break
    }
  }, [engine, refresh])

  peerDataRef.current = peerData

  const makeAI = useCallback(async () => {
    if (!ai.current) {ai.current=new AIPlayer(aiDiff);await ai.current.init()}
    aiCancelRef.current = false
    setAiThk(true)
    setPromo(null)
    try {
      const m = await ai.current.getBestMove(engine.getFEN())
      // Check if game state changed during AI thinking (undo/newGame)
      if (aiCancelRef.current) { setAiThk(false); return }
      if (m) {
        const r = engine.move(m.from, m.to, m.promotion)
        if (r) {
          if (r.captured) {
            const isImportant = r.captured === 'q' || r.captured === 'r'
            if (isImportant) SFX.importantCapture()
            else SFX.capture()
          } else if (r.flags?.includes('k')) SFX.castle()
          else SFX.move()
          if (engine.isInCheck()) setTimeout(() => SFX.check(), 120)
          setMoveTimes(prev => [...prev, null])
          refresh()
          setMyTurn(true)
          setAiThk(false)
          return
        }
      }
      // AI failed to produce a valid move — restore turn so human can continue
      console.warn('AI no pudo generar un movimiento válido')
      refresh()
      setMyTurn(true)
    } catch(e) {
      if (aiCancelRef.current) { setAiThk(false); return }
      console.error(e)
      refresh()
      setMyTurn(true)
    }
    setAiThk(false)
  }, [engine, aiDiff, refresh])

  makeAIRef.current = makeAI

  // Click en casilla
  // ─── Navigate to a specific move in history ───
  const navigateToMove = useCallback((idx) => {
    if (hist.length === 0) return
    // Clamp
    const clamped = Math.max(-1, Math.min(idx, hist.length - 1))
    setViewingMove(clamped)

    if (clamped === -1) {
      // Return to current position — restore from engine's current state
      refresh()
    } else {
      // Replay moves up to the selected index from the start
      const savedEngine = new ChessEngine()
      savedEngine.reset()
      for (let i = 0; i <= clamped; i++) {
        const m = hist[i]
        savedEngine.move(m.from, m.to, m.promotion)
      }
      const b = savedEngine.getBoard()
      const t = savedEngine.getTurn()
      let ck = []
      if (savedEngine.isInCheck()) {
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (b[r][c]?.type==='k' && b[r][c]?.color===t) ck.push(String.fromCharCode(97+c)+(8-r))
      }
      setBrd(b)
      setTurn(t)
      setChk(ck)
      setLastM(hist[clamped])
      setSel(null)
      setLegal([])
      setCapturableSq([])
    }
  }, [hist, refresh])

  // ─── Get hint from AI ───
  const getHint = useCallback(async () => {
    if (!vsPC || aiThk || (status !== 'PLAYING' && status !== 'CHECK')) return
    // Clear previous hint after 5s
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)

    // Resolve AI player if not ready
    if (!ai.current) {
      ai.current = new AIPlayer(aiDiff)
      await ai.current.init()
    }

    try {
      const best = await ai.current.getBestMove(engine.getFEN())
      if (best) {
        setHintMove({ from: best.from, to: best.to })
        SFX.hover()
        hintTimerRef.current = setTimeout(() => setHintMove(null), 5000)
      }
    } catch (e) {
      console.warn('Hint failed:', e)
    }
  }, [vsPC, aiThk, status, aiDiff, engine])

  const clickSq = useCallback((sq) => {
    // Block moves while viewing history or game not active
    if ((status !== 'PLAYING' && status !== 'CHECK') || aiThk || promo || isViewingHistory) return

    // Clear hint on any click
    if (hintMove) setHintMove(null)

    const p = engine.getPiece(sq)
    const isMyPiece = p && premoveEnabled
      ? p.color === pColor
      : p && own(p)

    // ── PREMOVE: cuando no es mi turno ──
    if (!myTurn && !solo && premoveEnabled) {
      if (premoveSrc) {
        if (sq === premoveSrc) {
          setPremoveSrc(null)
          setPremove(null)
          SFX.error()
          return
        }
        setPremove({ from: premoveSrc, to: sq })
        setPremoveSrc(null)
        return
      }
      if (isMyPiece) {
        setPremoveSrc(sq)
        return
      }
      if (premove && sq === premove.to) {
        setPremove(null)
        setPremoveSrc(null)
        return
      }
      return
    }

    if (!myTurn && !solo) return

    // ── NORMAL: cuando es mi turno ──
    if (sel) {
      if (sel === sq) { setSel(null); setLegal([]); setCapturableSq([]); return }
      if (legal.some(m => m.to === sq)) { doMove(sel, sq); return }
      if (p && own(p)) { setSel(sq); setLegal(engine.getLegalMoves(sq).map(m=>({...m,to:m.to,from:m.from}))); return }
      SFX.error()
      setSel(null); setLegal([]); return
    }

    if (p && own(p)) {
      const moves = engine.getLegalMoves(sq).map(m=>({...m,to:m.to,from:m.from}))
      setSel(sq); setLegal(moves)
      // Compute capturable squares
      const captures = moves.filter(m => engine.getPiece(m.to))
      setCapturableSq(captures.map(m => m.to))
    } else {
      setCapturableSq([])
    }
  }, [sel, legal, myTurn, solo, status, aiThk, promo, engine, pColor, online, premove, premoveSrc, premoveEnabled])

  const own = (p) => {
    const cur = engine.getTurn()
    if (solo) return p.color === cur
    if (online) return p.color === pColor
    return p.color === cur
  }

  // Drop
  const drop = useCallback((from, to) => {
    if ((status !== 'PLAYING' && status !== 'CHECK') || aiThk || promo || isViewingHistory) return

    if (hintMove) setHintMove(null)

    // Premove via drag
    if (!myTurn && !solo && premoveEnabled) {
      setPremove({ from, to })
      return
    }

    if (!myTurn && !solo) return
    doMove(from, to)
  }, [myTurn, solo, status, aiThk, promo, premoveEnabled, hintMove])

  // Ejecutar movimiento
  const doMove = (from, to, prom = null) => {
    const p = engine.getPiece(from)
    if (p?.type === 'p' && ((p.color==='w'&&to[1]==='8')||(p.color==='b'&&to[1]==='1'))) {
      if (!prom) { setPromo({ from, to }); return }
      const r = engine.move(from, to, prom)
      if (r) { afterMove(r); setPromo(null) }
      else SFX.error()
      return
    }
    const r = engine.move(from, to, prom)
    if (r) afterMove(r)
    else SFX.error()
  }

  const changePromo = (pt) => {
    if (!promo) return
    const r = engine.move(promo.from, promo.to, pt)
    if (r) { SFX.promote(); afterMove(r); setPromo(null) }
  }

  // Helper: play the right capture sound based on piece value
  const playCaptureSound = (capturedType) => {
    if (capturedType === 'q' || capturedType === 'r') SFX.importantCapture()
    else SFX.capture()
  }

  const afterMove = (mv) => {
    // Determine capture type: queen=9, rook=5 → important capture
    if (mv.captured) playCaptureSound(mv.captured)
    else if (mv.flags?.includes('k')) SFX.castle()
    else SFX.move()
    // Track eval history (material advantage after each move)
    const curWCap = matVal(engine.capturedPieces.b)
    const curBCap = matVal(engine.capturedPieces.w)
    setEvalHistory(prev => [...prev, curWCap - curBCap])
    const te = new ChessEngine(); te.loadFEN(engine.getFEN())
    if (te.isInCheck()) setTimeout(() => SFX.check(), 120)
    setSel(null); setLegal([])
    setCapturableSq([])
    setHintMove(null)
    // Save FEN for navigation (store after this move)
    fenHistoryRef.current.push(engine.getFEN())
    setViewingMove(-1)
    // Record move time
    if (moveStartRef.current) {
      const elapsed = (Date.now() - moveStartRef.current) / 1000
      setMoveTimes(prev => [...prev, Math.round(elapsed * 10) / 10])
    }
    // Add increment and switch clock
    if (clockRunning) {
      const prevTurn = mv.color === 'w' ? 'w' : 'b'
      clockRef.current?.addIncrement(prevTurn)
    }
    if (online && pm.current) { pm.current.sendMove(mv); setMyTurn(false) }
    if (solo) setMyTurn(p => !p)
    if (vsPC) setMyTurn(false)
    // Start clock on first move
    if (!clockRunning && hist.length === 0) setClockRunning(true)
    refresh()
  }

  const resign = () => {
    if (online) pm.current?.sendResign()
    const w = engine.getTurn()==='w'?'Negras':'Blancas'
    setGoText(`Te rendiste. ${w} ganan.`); setShowGO(true); SFX.gameOver()
  }
  const drawOffer = () => { if (online) pm.current?.sendDrawOffer() }
  const changeClock = (time, increment) => {
    setClockTime(time)
    setClockIncrement(increment)
    setClockRunning(false)
    clockRef.current?.resetClock()
    syncClock(time, increment)
  }
  const newGame = () => { aiCancelRef.current = true; engine.reset(); setFlip(false); setSel(null); setLegal([]); setPremove(null); setPremoveSrc(null); setLastM(null); setChk([]); setStatus('PLAYING'); setShowGO(false); setGoText(''); setMyTurn(true); setAiThk(false); setPromo(null); setHintMove(null); setCapturableSq([]); fenHistoryRef.current = []; setViewingMove(-1); setClockRunning(false); setMoveTimes([]); setEvalHistory([]); moveStartRef.current = Date.now(); clockRef.current?.resetClock(); refresh(); SFX.gameStart() }
  const goHome = () => { aiCancelRef.current = true; try { pm.current?.disconnect() } catch(e) {}; nav('/') }
  const undo = () => { if (!local || hist.length===0 || aiThk) return; aiCancelRef.current = true; engine.undo(); if (vsPC && hist.length >= 2) engine.undo(); setMoveTimes(prev => prev.slice(0, vsPC ? -2 : -1)); setEvalHistory(prev => prev.slice(0, prev.length - (vsPC ? 2 : 1))); fenHistoryRef.current = fenHistoryRef.current.slice(0, vsPC ? -2 : -1); setViewingMove(-1); moveStartRef.current = Date.now(); refresh(); setMyTurn(true); setAiThk(false); setPromo(null); setPremove(null); setPremoveSrc(null); setHintMove(null); setCapturableSq([]); SFX.undo() }

  const lastSAN = hist.length > 0 ? hist[hist.length-1].san : null
  const mIcon = blind?'🕶️':vsPC?'🤖':solo?'🧠':'👥'
  const mName = blind?'A Ciegas':vsPC?`vs PC` :solo?'Vs Ti Mismo':'Online'

  // Start move timer when it's human's turn
  useEffect(() => {
    if (status === 'PLAYING' && (myTurn || solo)) {
      moveStartRef.current = Date.now()
    }
  }, [myTurn, solo, status])

  // Send chat message
  const sendChat = useCallback(() => {
    const text = chatInput.trim()
    if (!text || !online || !pm.current) return
    pm.current.sendChat(text)
    setChatMsgs(prev => [...prev, { text, me: true, time: Date.now() }])
    setChatInput('')
  }, [chatInput, online])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chatMsgs.length])

  // Sync clock to guest when host changes it
  const syncClock = useCallback((time, increment) => {
    if (online && isHostRef.current && pm.current) {
      pm.current.sendClockSync(time, increment)
    }
  }, [online])

  // Clock time-up handler
  const handleTimeUp = useCallback((color) => {
    setClockRunning(false)
    const winner = color === 'w' ? 'Negras' : 'Blancas'
    setGoText(`Tiempo. ${winner} ganan.`)
    setShowGO(true)
    SFX.gameOver()
  }, [])

  // ─── Accept draw from modal ───
  const acceptDraw = useCallback(() => {
    if (pendingDrawFn) pendingDrawFn()
    setShowDrawOffer(false)
    setPendingDrawFn(null)
  }, [pendingDrawFn])

  const declineDraw = useCallback(() => {
    setShowDrawOffer(false)
    setPendingDrawFn(null)
    // Could send decline message here if needed
  }, [])

  // ─── PGN Export ───
  const generatePGN = useCallback(() => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`
    const tcParts = []
    if (clockTime > 0) {
      tcParts.push(`${clockTime}`)
      if (clockIncrement > 0) tcParts.push(`${clockIncrement}`)
    }
    const tc = tcParts.join('+')
    const result = status === 'CHECKMATE'
      ? (engine.getTurn() === 'w' ? '0-1' : '1-0')
      : status === 'STALEMATE' || status === 'DRAW' ? '1/2-1/2'
      : '*'
    const headers = [
      `[Event "Coipo Chess"]`,
      `[Site "freebuff.com"]`,
      `[Date "${dateStr}"]`,
      `[Round "-"]`,
      `[White "${pColor==='w'?'Tú':'Rival'}"]`,
      `[Black "${pColor==='b'?'Tú':'Rival'}"]`,
      `[Result "${result}"]`,
      tc ? `[TimeControl "${tc}"]` : null,
    ].filter(Boolean).join('\n')
    const moves = []
    for (let i = 0; i < hist.length; i++) {
      let token = ''
      if (i % 2 === 0) token = `${Math.floor(i/2)+1}. `
      token += hist[i].san
      const t = moveTimes[i]
      if (t != null) {
        if (t >= 60) {
          const m = Math.floor(t / 60)
          const s = Math.round(t % 60)
          token += ` {${m}:${String(s).padStart(2,'0')}}`
        } else {
          token += ` {${t < 10 ? t.toFixed(1) : Math.round(t)}s}`
        }
      }
      moves.push(token)
    }
    return `${headers}\n\n${moves.join(' ')} ${result}`
  }, [hist, moveTimes, clockTime, clockIncrement, status, engine, pColor])

  const downloadPGN = useCallback(() => {
    const pgn = generatePGN()
    const blob = new Blob([pgn], { type: 'application/x-chess-pgn' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coipo-chess-${new Date().toISOString().slice(0,10)}.pgn`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatePGN])

  // ─── Game Stats ───
  const gameStats = (() => {
    const myIdx = pColor === 'w' ? 0 : 1
    const oppIdx = 1 - myIdx
    const myTimes = moveTimes.filter((_, i) => i % 2 === myIdx).filter(t => t != null)
    const oppTimes = moveTimes.filter((_, i) => i % 2 === oppIdx).filter(t => t != null)
    const avg = (arr) => arr.length ? arr.reduce((s, t) => s + t, 0) / arr.length : 0
    const fmt = (t) => t >= 60 ? `${Math.floor(t/60)}:${String(Math.round(t%60)).padStart(2,'0')}` : t < 10 ? `${t.toFixed(1)}s` : `${Math.round(t)}s`
    const myAvg = avg(myTimes)
    const oppAvg = avg(oppTimes)
    // Find fastest/slowest across all moves
    let fastest = { idx: -1, time: Infinity }, slowest = { idx: -1, time: 0 }
    moveTimes.forEach((t, i) => {
      if (t == null) return
      if (t < fastest.time) fastest = { idx: i, time: t }
      if (t > slowest.time) slowest = { idx: i, time: t }
    })
    const totalMoves = hist.length
    const totalMovesCount = Math.ceil(totalMoves / 2)
    // Estimated accuracy: heuristic based on move time consistency + capture efficiency
    const myCaptures = caps[pColor === 'w' ? 'b' : 'w'].length
    const oppCaptures = caps[pColor === 'b' ? 'b' : 'w'].length
    const captureRatio = myCaptures + oppCaptures > 0 ? myCaptures / (myCaptures + oppCaptures) : 0.5
    const timeConsistency = myTimes.length > 1 ? 1 - Math.min(1, (Math.max(...myTimes) - Math.min(...myTimes)) / Math.max(myAvg, 1)) : 0.5
    const estAccuracy = Math.round(Math.min(99, Math.max(20, (captureRatio * 40 + timeConsistency * 30 + Math.min(30, myAvg > 0 ? 30 : 15)))))
    return {
      totalMoves: totalMovesCount,
      myAvg, oppAvg, fmt,
      fastest: fastest.idx >= 0 ? { san: hist[fastest.idx]?.san, move: Math.floor(fastest.idx/2)+1, time: fastest.time, color: fastest.idx % 2 === 0 ? 'w' : 'b' } : null,
      slowest: slowest.idx >= 0 ? { san: hist[slowest.idx]?.san, move: Math.floor(slowest.idx/2)+1, time: slowest.time, color: slowest.idx % 2 === 0 ? 'w' : 'b' } : null,
      estAccuracy,
      myCaptures, oppCaptures,
    }
  })()

  // Turno actual para promo
  const pColor2 = turn === 'w' ? 'w' : 'b'

  return (
    <div className="game">
      {/* ═══ TOP BAR ═══ */}
      <div className="gbar">
        <div className="gbl">
          <span className="gmode">{mIcon} {mName}</span>
          {vsPC && <span className="gaib">{aiSt}</span>}
        </div>
        <div className="gbc">
          <span className={`gk ${turn==='w'?'gkw':'gkb'}`}>
            <ChessPiece color={turn} type="k" />
          </span>
          <span className={`gt ${status==='CHECK'?'gcheck':''}`}>
            {status==='CHECK'?'⚠️ Jaque':`${turn==='w'?'Blancas':'Negras'}`}
          </span>
          {aiThk && <span className="gthink">🤔</span>}
        </div>
        <div className="gbr">
          {online && (
            <>
              <span className="gcolor-indicator" title={`Tus piezas: ${pColor === 'w' ? 'Blancas' : 'Negras'}`}>
                <ChessPiece color={pColor} type="k" />
                <span className="gcolor-label">{pColor === 'w' ? 'Blancas' : 'Negras'}</span>
              </span>
              <span className={`gstatus ${onlineStatus === 'connected' ? 'gstatus-ok' : onlineStatus === 'reconnecting' ? 'gstatus-warn' : 'gstatus-err'}`} title={{
                connected: 'Conectado',
                reconnecting: 'Reconectando...',
                lost: 'Conexión perdida'
              }[onlineStatus]}>
                {onlineStatus === 'connected' ? '🟢' : onlineStatus === 'reconnecting' ? '🟡' : '🔴'}
              </span>
            </>
          )}
          {vsPC && <button className="gicn" onClick={()=>setShowDiff(true)} title="Dificultad">🎯</button>}
          {vsPC && <button className={`gicn ${hintMove ? 'gicn-hint' : ''}`} onClick={() => { if (hintMove) setHintMove(null); else getHint() }} title={hintMove ? 'Quitar pista' : 'Pista (H)'}>{hintMove ? '✨' : '💡'}</button>}
          {premoveEnabled && <button className={`gicn ${premove ? 'gicn-prem' : ''}`} onClick={() => { setPremove(null); setPremoveSrc(null) }} title={premove ? `Premove: ${premove.from}→${premove.to} (toca para cancelar)` : 'Premove'}>{premove ? '⏭' : '⏩'}</button>}
          <button className="gicn" onClick={()=>setShowClockSelect(true)} title={online && !isHost ? 'Solo el anfitrión puede cambiar el tiempo' : 'Reloj'} disabled={online && !isHost}>⏱️</button>
          <button className={`gicn ${muted?'gicn-muted':''}`} onClick={()=>{const m=toggleMute();setMuted(m)}} title={muted?'Activar sonido':'Silenciar'}>{muted ? '🔇' : volume < 0.33 ? '🔈' : volume < 0.66 ? '🔉' : '🔊'}</button>
          <button className="gicn" onClick={()=>setFlip(!flip)} title="Girar">{flip?'⬇':'🔄'}</button>
          <button className="gicn" onClick={()=>setShowThemeSelect(true)} title="Tema del tablero">🎨</button>
          <button className="gicn" onClick={() => setShowCustomSelect(true)} title="Personalización completa">⚙️</button>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="gmain">
        {/* Columna izquierda: capturas + jugador */}
        <div className="gleft">
          {/* Reloj de ajedrez */}
          <ChessClock
            ref={clockRef}
            initialTime={clockTime}
            increment={clockIncrement}
            activeTurn={clockRunning ? turn : null}
            running={clockRunning && status === 'PLAYING'}
            onTimeUp={handleTimeUp}
            flipped={boardFlipped}
          />

          <div className="pbar pb-down">
            <span className="pname">Negras</span>
            <span className="pmat">{adv < 0 ? <b>{adv}</b> : ''}</span>
            <span className="ppcs">
              {[...caps.w].sort((a,b)=>(PV[b]||0)-(PV[a]||0)).map((p,i) => (
                <span key={i} className="pc">
                  <ChessPiece color="w" type={p} />
                </span>
              ))}
            </span>
          </div>

          {/* Material advantage bar */}
          {(() => {
            const maxAdv = 20
            const pct = Math.min(Math.abs(adv) / maxAdv, 1) * 50
            const isWhite = adv > 0
            const show = adv !== 0
            return (
              <div style={{ width: '100%', maxWidth: 'var(--board-size)' }}>
                <div className="mat-bar-wrap">
                  <div className="mat-bar-center" />
                  <div className={`mat-bar-fill mat-bar-white ${matPulse && show && isWhite ? 'mat-bar-glow-white mat-bar-pulse' : ''}`} style={{ left: '50%', width: show && isWhite ? `${pct}%` : '0%' }} />
                  <div className={`mat-bar-fill mat-bar-black ${matPulse && show && !isWhite ? 'mat-bar-glow-black mat-bar-pulse' : ''}`} style={{ right: '50%', width: show && !isWhite ? `${pct}%` : '0%' }} />
                </div>
                <div className={`mat-bar-value ${show && Math.abs(adv) >= 3 ? 'mat-bar-value-ahead' : 'mat-bar-value-equal'} ${matPulse && show ? 'mat-bar-pulse' : ''}`}>
                  {show ? (isWhite ? `Blancas +${adv}` : `Negras +${Math.abs(adv)}`) : 'Material igualado'}
                </div>
              </div>
            )
          })()}

          <div className="gboard-wrap">
            <Board
              board={blind&&blindBrd?blindBrd:brd}
              flipped={boardFlipped}
              selected={sel}
              legalMoves={legal}
              lastMove={lastM}
              checkSq={chk}
              onSquareClick={clickSq}
              onPieceDrop={drop}
              isSelectable={myTurn||solo}
              isCheckmate={status === 'CHECKMATE'}
              boardTheme={boardTheme}
              premove={premove}
              premoveSrc={premoveSrc}
              hintMove={isViewingHistory ? null : hintMove}
              capturableSq={capturableSq}
            />

            {/* Barra promoción */}
            {promo && (
              <div className="promobar">
                <span className="plbl">Ascender</span>
                {['q','r','b','n'].map(pt => (
                  <button key={pt} className="pbtn" onClick={()=>changePromo(pt)}>
                    <ChessPiece color={pColor2} type={pt} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pbar pb-up">
            <span className="pname">Blancas</span>
            <span className="pmat">{adv > 0 ? <b>+{adv}</b> : ''}</span>
            <span className="ppcs">
              {[...caps.b].sort((a,b)=>(PV[b]||0)-(PV[a]||0)).map((p,i) => (
                <span key={i} className="pc">
                  <ChessPiece color="b" type={p} />
                </span>
              ))}
            </span>
          </div>
        </div>

        {/* Columna derecha: gráfico + historial */}
        <div className="gright">
          <EvalGraph evalHistory={evalHistory} currentMove={hist.length - 1} />
          <div className="ghist" ref={histRef}>
            {hist.length === 0 ? (
              <div className="gempty">
                <span><ChessPiece color="b" type="p" /></span>
                <p>Juega tu primer movimiento</p>
              </div>
            ) : (
              <table className="gtbl">
                <tbody>
                  {(() => {
                    const rows = []
                    for (let i=0; i<hist.length; i+=2) {
                      const n = Math.floor(i/2)+1
                      const fmtTime = (t) => {
                        if (t == null) return ''
                        if (t >= 60) {
                          const m = Math.floor(t / 60)
                          const s = Math.round(t % 60)
                          return `${m}:${String(s).padStart(2, '0')}`
                        }
                        return t < 10 ? `${t.toFixed(1)}s` : `${Math.round(t)}s`
                      }

                      const wt = moveTimes[i]
                      const bt = moveTimes[i+1]
                      rows.push(
                        <tr key={i} className={i===hist.length-1||i===hist.length-2?'gtr-last':''}>
                          <td className="gn">{n}.</td>
                          <td className={`gs ${i===hist.length-1?'gs-last':''}`}>
                            {hist[i].san}
                            {wt != null && <span className={`gtime ${timeClass(wt)}`}>{fmtTime(wt)}</span>}
                          </td>
                          <td className={`gs ${i+1===hist.length-1?'gs-last':''}`}>
                            {hist[i+1]?.san||''}
                            {bt != null && <span className={`gtime ${timeClass(bt)}`}>{fmtTime(bt)}</span>}
                          </td>
                        </tr>
                      )
                    }
                    return rows
                  })()}
                </tbody>
              </table>
            )}
          </div>

          {/* Último movimiento */}
          <div className="glast">
            {lastSAN ? <><span className="glbl">Último</span><strong>{lastSAN}</strong></> : <span className="glbl">—</span>}
          </div>

          {/* Navegación de jugadas */}
          {hist.length > 0 && (
            <div className="gnav">
              <button className="gnav-btn" onClick={() => navigateToMove(-1)} title="Ir al final (posición actual)" disabled={!isViewingHistory}>⏭</button>
              <button className="gnav-btn" onClick={() => navigateToMove(viewingMove + 1)} title="Siguiente jugada" disabled={viewingMove >= hist.length - 1}>⏩</button>
              <span className="gnav-pos">{isViewingHistory ? viewingMove + 1 : hist.length}/{hist.length}</span>
              <button className="gnav-btn" onClick={() => navigateToMove(viewingMove - 1)} title="Jugada anterior" disabled={viewingMove <= 0}>⏪</button>
              <button className="gnav-btn" onClick={() => navigateToMove(0)} title="Ir al inicio" disabled={viewingMove <= 0}>⏮</button>
            </div>
          )}

          {/* Controles rápidos */}
          <div className="gacts">
            {local && !isViewingHistory && <button className="gact" onClick={undo} disabled={hist.length===0} title="Deshacer (Ctrl+Z)">↩</button>}
            <button className="gact" onClick={newGame} title="Nueva partida (N)">🔄</button>
            <button className="gact" onClick={downloadPGN} disabled={hist.length===0} title="Exportar PGN">📋</button>
            {online && <button className="gact gact-chat" onClick={()=>setChatOpen(!chatOpen)} title="Chat">💬 {chatMsgs.length > 0 && !chatOpen && <span className="chat-dot" />}</button>}
          {online && <button className="gact gact-d" onClick={drawOffer} title="Ofrecer tablas">🤝</button>}
          </div>
          <div className="gacts2">
            <button className="gact gact-r" onClick={resign} title="Rendirse">🏳️ Rendirse</button>
            <button className="gact" onClick={goHome} title="Salir">🏠 Salir</button>
          </div>
        </div>
      </div>

      {/* ═══ CHAT PANEL ═══ */}
      {online && chatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-title">💬 Chat</span>
            <button className="chat-close" onClick={()=>setChatOpen(false)}>✕</button>
          </div>
          <div className="chat-messages" ref={chatRef}>
            {chatMsgs.length === 0 && <div className="chat-empty">Envía un mensaje para empezar</div>}
            {chatMsgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.me ? 'chat-me' : 'chat-them'}`}>
                <span className="chat-bubble">{m.text}</span>
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={(e)=>{e.preventDefault();sendChat()}}>
            <input
              type="text"
              value={chatInput}
              onChange={(e)=>setChatInput(e.target.value)}
              placeholder="Escribe..."
              maxLength={200}
              autoFocus
            />
            <button type="submit" disabled={!chatInput.trim()}>➤</button>
          </form>
        </div>
      )}

      {/* ═══ MODAL TEMAS ═══ */}
      {showThemeSelect && (
        <div className="mover" onClick={()=>setShowThemeSelect(false)}>
          <div className="min" onClick={e=>e.stopPropagation()}>
            <h3>🎨 Tema del tablero</h3>
            <div className="dopts">
              {BOARD_THEMES.map(t => (
                <button key={t.id} className={`dopt ${boardTheme===t.id?'dact':''}`} onClick={()=>changeBoardTheme(t.id)}>
                  <span className="doi">{t.icon}</span>
                  <span className="don">{t.name}</span>
                  <span className="dod">{t.d}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL RELOJ ═══ */}
      {showClockSelect && (
        <div className="mover" onClick={()=>setShowClockSelect(false)}>
          <div className="min" onClick={e=>e.stopPropagation()}>
            <h3>⏱️ Tiempo{online && !isHost ? ' (solo el anfitrión)' : ''}</h3>
            <div className="dopts">
              {[
                {id:'1+0',t:60,i:0,n:'1 min',d:'Bullet'},
                {id:'3+0',t:180,i:0,n:'3 min',d:'Blitz'},
                {id:'5+0',t:300,i:0,n:'5 min',d:'Blitz'},
                {id:'5+3',t:300,i:3,n:'5+3',d:'Blitz con incremento'},
                {id:'10+0',t:600,i:0,n:'10 min',d:'Rápida'},
                {id:'15+10',t:900,i:10,n:'15+10',d:'Rápida con incremento'},
                {id:'none',t:0,i:0,n:'Sin reloj',d:'Juego libre'},
              ].map(c => (
                <button key={c.id} className={`dopt ${clockTime===c.t&&clockIncrement===c.i?'dact':''}`} onClick={()=>{changeClock(c.t, c.i);setShowClockSelect(false)}} disabled={online && !isHost}>
                  <span className="doi">⏱️</span>
                  <span className="don">{c.n}</span>
                  <span className="dod">{c.d}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL OFERTA DE TABLAS (reemplaza window.confirm) ═══ */}
      {showDrawOffer && (
        <div className="mover" onClick={declineDraw}>
          <div className="min" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '280px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🤝</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>Oferta de tablas</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Tu oponente ha ofrecido tablas
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btnp" onClick={acceptDraw}>✅ Aceptar</button>
              <button className="btng" onClick={declineDraw}>❌ Rechazar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DIFICULTAD ═══ */}
      {showDiff && (
        <div className="mover" onClick={()=>setShowDiff(false)}>
          <div className="min" onClick={e=>e.stopPropagation()}>
            <h3>🎯 Dificultad</h3>
            <div className="dopts">
              {[
                {id:'easy',i:'🟢',n:'Fácil',d:'Novato · Depth 4'},
                {id:'medium',i:'🟡',n:'Medio',d:'Aficionado · Depth 10'},
                {id:'hard',i:'🔴',n:'Difícil',d:'Experto · Depth 18'},
              ].map(d => (
                <button key={d.id} className={`dopt ${aiDiff===d.id?'dact':''}`} onClick={()=>{setAiDiff(d.id);setShowDiff(false);ai.current?.setDifficulty(d.id);if(ai.current)ai.current.difficulty=d.id}}>
                  <span className="doi">{d.i}</span>
                  <span className="don">{d.n}</span>
                  <span className="dod">{d.d}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL PERSONALIZACIÓN COMPLETA ═══ */}
      {showCustomSelect && (
        <div className="mover" onClick={() => setShowCustomSelect(false)}>
          <div className="min" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', width: '92%' }}>
            <h3>⚙️ Personalización completa</h3>
            <div style={{ marginBottom: '14px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Totalmente modular — ideal para futuros mods gráficos
            </div>

            {/* Tablero */}
            <div className="pz-filter-section">
              <span className="pz-filter-label">Tablero</span>
              <div className="pz-filter-chips">
                {BOARD_THEMES.map(t => (
                  <button key={t.id} className={`pz-chip ${boardTheme === t.id ? 'pz-chip-active' : ''}`}
                    onClick={() => { setBoardTheme(t.id); localStorage.setItem('coipo-board-theme', t.id); }}>
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambiente */}
            <div className="pz-filter-section">
              <span className="pz-filter-label">Ambiente</span>
              <div className="pz-filter-chips">
                {AMBIENT_THEMES.map(a => (
                  <button key={a.id} className={`pz-chip ${ambientTheme === a.id ? 'pz-chip-active' : ''}`}
                    onClick={() => setAmbientTheme(a.id)}>
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sonido */}
            <div className="pz-filter-section">
              <span className="pz-filter-label">Perfil de sonido</span>
              <div className="pz-filter-chips">
                {SOUND_PROFILES.map(s => (
                  <button key={s.id} className={`pz-chip ${soundProfile === s.id ? 'pz-chip-active' : ''}`}
                    onClick={() => setSoundProfile(s.id)}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Volumen */}
            <div className="pz-filter-section">
              <span className="pz-filter-label">Volumen</span>
              <div className="vol-slider-wrap">
                <span className="vol-icon">{volume === 0 ? '🔇' : volume < 0.33 ? '🔈' : volume < 0.66 ? '🔉' : '🔊'}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    setVolume(v)
                    setSFXVolume(v)
                    if (v > 0 && muted) {
                      const m = toggleMute()
                      setMuted(m)
                    }
                  }}
                  className="vol-slider"
                />
                <span className="vol-pct">{Math.round((muted ? 0 : volume) * 100)}%</span>
              </div>
            </div>

            {/* Guardar */}
            <button className="pz-apply" onClick={() => {
              saveCustomizationConfig({ boardTheme, ambientTheme, soundProfile, pieceStyle: 'standard', animations: true, volume })
              setShowCustomSelect(false)
            }} style={{ marginTop: '4px' }}>
              💾 Guardar configuración
            </button>
          </div>
        </div>
      )}

      {/* ═══ GAME OVER ═══ */}
      {showGO && (
        <div className="mover" onClick={() => setShowGO(false)}>
          <div className="min goin" onClick={e => e.stopPropagation()}>
            <div className="goic">{goText.includes('Tablas')?'🤝':goText.includes('rendiste')?'🏳️':'👑'}</div>
            <h3>Fin</h3>
            <p className="got">{goText}</p>
            <p className="god">{gameStats.totalMoves} mov.</p>

            {/* Stats panel */}
            <div className="go-stats">
              <div className="go-stat-row">
                <div className="go-stat">
                  <span className="go-stat-label">Tú</span>
                  <span className="go-stat-value">{gameStats.fmt(gameStats.myAvg)}</span>
                  <span className="go-stat-sub">promedio</span>
                </div>
                <div className="go-stat-divider">vs</div>
                <div className="go-stat">
                  <span className="go-stat-label">Rival</span>
                  <span className="go-stat-value">{gameStats.fmt(gameStats.oppAvg)}</span>
                  <span className="go-stat-sub">promedio</span>
                </div>
              </div>

              {gameStats.fastest && (
                <div className="go-stat-highlight go-fast">
                  <span>⚡</span> Rápido: {gameStats.fastest.san} ({gameStats.fmt(gameStats.fastest.time)})
                </div>
              )}
              {gameStats.slowest && (
                <div className="go-stat-highlight go-slow">
                  <span>🐌</span> Lento: {gameStats.slowest.san} ({gameStats.fmt(gameStats.slowest.time)})
                </div>
              )}

              <div className="go-stat-acc">
                <span className="go-acc-label">Precisión estimada</span>
                <div className="go-acc-bar">
                  <div className="go-acc-fill" style={{ width: `${gameStats.estAccuracy}%` }} />
                </div>
                <span className="go-acc-val">{gameStats.estAccuracy}%</span>
              </div>

              <div className="go-stat-caps">
                <span>Piezas capturadas: {gameStats.myCaptures} — {gameStats.oppCaptures}</span>
              </div>
            </div>

            <div className="goacts">
              <button className="btnp" onClick={newGame}>🔄 Nueva</button>
              <button className="btng" onClick={goHome}>🏠 Inicio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
