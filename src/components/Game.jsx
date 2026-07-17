import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import ChessEngine from '../utils/chessEngine'
import AIPlayer from '../utils/aiPlayer'
import { obfuscateBoard } from '../utils/blindMode'
import Board from './Board'
import { ChessPiece } from './ChessPieces'
import ChessClock from './ChessClock'
import * as SFX from '../utils/sounds'
import { toggleMute } from '../utils/sounds'
import './Game.css'

const PV = { q:9, r:5, b:3, n:3, p:1 }

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
  const [goText, setGoText] = useState('')
  const [flip, setFlip] = useState(false)
  const [blindBrd, setBlindBrd] = useState(null)
  const [promo, setPromo] = useState(null) // { from, to }
  const [aiSt, setAiSt] = useState('…')
  const [muted, setMuted] = useState(false)
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

  const routeState = loc.state || window.__coipoRouteState || {}
  const isHost = routeState.isHost ?? true
  const isHostRef = useRef(isHost)

  const vsPC  = mode === 'vspc' || mode === 'pc-levels'
  const solo  = mode === 'solo'
  const blind = mode === 'blind'
  const online = mode === 'pvp' || mode === 'blind'
  const local = vsPC || solo

  // Init
  useEffect(() => {
    const st = routeState || {}
    const pc = st.playerColor || 'w'
    if (online) {
      const p = st.peerManager || window.__coipoPeerManager
      if (!p) { nav('/'); return }
      pm.current = p; setPColor(pc); setMyTurn(pc === 'w')
      p.onData(d => peerData(d))
    } else if (vsPC && mode === 'pc-levels') setShowDiff(true)
    if (vsPC) { const a = new AIPlayer('medium'); ai.current = a; a.init().then(()=>setAiSt('SF')).catch(()=>setAiSt('local')) }
    engine.reset(); refresh()
    setMoveTimes([])
    moveStartRef.current = Date.now()
    setClockRunning(false)
    // Play game start sound after first user interaction
    const playStart = () => { SFX.gameStart(); window.removeEventListener('click', playStart) }
    window.addEventListener('click', playStart, { once: true })
    return () => {
      pm.current?.disconnect()
      if (window.__coipoPeerManager === pm.current) {
        delete window.__coipoPeerManager
      }
      ai.current?.destroy()
      window.removeEventListener('click', playStart)
    }
  }, [])

  // IA trigger
  useEffect(() => {
    if (vsPC && !myTurn && (status === 'PLAYING' || status === 'CHECK') && !aiThk && !promo) {
      const t = setTimeout(() => makeAI(), 200); return () => clearTimeout(t)
    }
  }, [myTurn, status, aiThk, promo])

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

  const refresh = useCallback(() => {
    const b = engine.getBoard(), t = engine.getTurn(), s = engine.getGameStatus()
    const lm = engine.moveHistory.length > 0 ? engine.moveHistory[engine.moveHistory.length-1] : null
    let ck = []
    if (engine.isInCheck()) {
      for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (b[r][c]?.type==='k' && b[r][c]?.color===t) ck.push(String.fromCharCode(97+c)+(8-r))
    }
    setBrd(b); setTurn(t); setLastM(lm); setChk(ck); setStatus(s)
    setCaps({...engine.capturedPieces}); setHist([...engine.moveHistory])
    if (blind && pm.current) setBlindBrd(obfuscateBoard(b, pColor))
    if (s !== 'PLAYING') gameOver(s)
    setSel(null); setLegal([])
  }, [engine, blind, pColor])

  const peerData = useCallback((d) => {
    if (!d?.type) return
    switch (d.type) {
      case 'MOVE': if(d.data){const r=engine.move(d.data.from,d.data.to,d.data.promotion);if(r){SFX.move();setMoveTimes(prev => [...prev, null]);setMyTurn(true);refresh()}}break
      case 'RESIGN': setGoText('El rival se rindió'); setShowGO(true); SFX.gameOver(); break
      case 'DRAW_OFFER': if(window.confirm('🤝 ¿Aceptas tablas?')){pm.current?.sendDrawAccept();setGoText('Tablas');setShowGO(true)}break
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
          if (r.captured) SFX.capture()
          else if (r.flags?.includes('k')) SFX.castle()
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

  // Click en casilla
  const clickSq = useCallback((sq) => {
    if (!myTurn && !solo) return
    if ((status !== 'PLAYING' && status !== 'CHECK') || aiThk || promo) return

    const p = engine.getPiece(sq)

    if (sel) {
      if (sel === sq) { setSel(null); setLegal([]); return }
      if (legal.some(m => m.to === sq)) { doMove(sel, sq); return }
      if (p && own(p)) { setSel(sq); setLegal(engine.getLegalMoves(sq).map(m=>({...m,to:m.to,from:m.from}))); return }
      // Click en casilla no legal → sonido error
      SFX.error()
      setSel(null); setLegal([]); return
    }

    if (p && own(p)) {
      setSel(sq); setLegal(engine.getLegalMoves(sq).map(m=>({...m,to:m.to,from:m.from})))
    }
  }, [sel, legal, myTurn, solo, status, aiThk, promo, engine, pColor, online])

  const own = (p) => {
    const cur = engine.getTurn()
    if (solo) return p.color === cur
    if (online) return p.color === pColor
    return p.color === cur
  }

  // Drop
  const drop = useCallback((from, to) => {
    if (!myTurn && !solo) return
    if ((status !== 'PLAYING' && status !== 'CHECK') || aiThk || promo) return
    doMove(from, to)
  }, [myTurn, solo, status, aiThk, promo])

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

  const afterMove = (mv) => {
    if (mv.captured) SFX.capture()
    else if (mv.flags?.includes('k')) SFX.castle()
    else SFX.move()
    const te = new ChessEngine(); te.loadFEN(engine.getFEN())
    if (te.isInCheck()) setTimeout(() => SFX.check(), 120)
    setSel(null); setLegal([])
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

  const gameOver = useCallback((st) => {
    let r = ''; const w = engine.getTurn()==='w'?'Negras':'Blancas'
    if (st==='CHECKMATE') r=`Jaque mate. ${w} ganan.`
    else if (st==='STALEMATE') r='Ahogado. Tablas.'
    else if (st==='DRAW') r='Tablas.'
    else return
    SFX.gameOver(); setGoText(r); setTimeout(()=>setShowGO(true), 500)
  }, [engine])

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
  const newGame = () => { aiCancelRef.current = true; engine.reset(); setSel(null); setLegal([]); setLastM(null); setChk([]); setStatus('PLAYING'); setShowGO(false); setGoText(''); setMyTurn(true); setAiThk(false); setPromo(null); setClockRunning(false); setMoveTimes([]); moveStartRef.current = Date.now(); clockRef.current?.resetClock(); refresh(); SFX.gameStart() }
  const goHome = () => { aiCancelRef.current = true; pm.current?.disconnect(); nav('/') }
  const undo = () => { if (!local || hist.length===0 || aiThk) return; aiCancelRef.current = true; engine.undo(); if (vsPC && hist.length >= 2) engine.undo(); setMoveTimes(prev => prev.slice(0, vsPC ? -2 : -1)); moveStartRef.current = Date.now(); refresh(); setMyTurn(true); setAiThk(false); setPromo(null); SFX.undo() }

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

  // Material
  const matVal = (c) => c.reduce((s,p)=>s+(PV[p]||0),0)
  const wCap = matVal(caps.b), bCap = matVal(caps.w)
  const adv = wCap - bCap

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
          {vsPC && mode==='pc-levels' && <button className="gicn" onClick={()=>setShowDiff(true)} title="Dificultad">🎯</button>}
          <button className="gicn" onClick={()=>setShowClockSelect(true)} title={online && !isHost ? 'Solo el anfitrión puede cambiar el tiempo' : 'Reloj'} disabled={online && !isHost}>⏱️</button>
          <button className="gicn" onClick={()=>{const m=toggleMute();setMuted(m)}} title={muted?'Activar sonido':'Silenciar'}>{muted?'🔇':'🔊'}</button>
          <button className="gicn" onClick={()=>setFlip(!flip)} title="Girar">{flip?'⬇':'🔄'}</button>
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
            flipped={flip}
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

          <div className="gboard-wrap">
            <Board
              board={blind&&blindBrd?blindBrd:brd}
              flipped={flip}
              selected={sel}
              legalMoves={legal}
              lastMove={lastM}
              checkSq={chk}
              onSquareClick={clickSq}
              onPieceDrop={drop}
              isSelectable={myTurn||solo}
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

        {/* Columna derecha: historial */}
        <div className="gright">
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
                            {wt != null && <span className="gtime">{fmtTime(wt)}</span>}
                          </td>
                          <td className={`gs ${i+1===hist.length-1?'gs-last':''}`}>
                            {hist[i+1]?.san||''}
                            {bt != null && <span className="gtime">{fmtTime(bt)}</span>}
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

          {/* Controles rápidos */}
          <div className="gacts">
            {local && <button className="gact" onClick={undo} disabled={hist.length===0} title="Deshacer">↩</button>}
            <button className="gact" onClick={newGame} title="Nueva partida">🔄</button>
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

      {/* ═══ GAME OVER ═══ */}
      {showGO && (
        <div className="mover">
          <div className="min goin">
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
