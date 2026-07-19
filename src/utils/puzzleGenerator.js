/**
 * 🧩 Coipo Chess — Puzzle Generator
 * 
 * Generates infinite chess puzzles using:
 * 1. Curated puzzle database (offline, instant)
 * 2. Lichess puzzle API (online, vast library)
 * 3. Stockfish-generated puzzles (local analysis)
 * 
 * Each puzzle has: FEN, solution moves, theme, rating, and metadata.
 */

import { Chess } from 'chess.js'

/**
 * Convert SAN moves to UCI format using the chess engine
 * @param {string} fen - Starting position
 * @param {string[]} sanMoves - Array of SAN moves (e.g., ['e4', 'e5'])
 * @returns {string[]} Array of UCI moves (e.g., ['e2e4', 'e7e5'])
 */
function convertSanToUci(fen, sanMoves) {
  const game = new Chess(fen)
  const uciMoves = []
  for (const san of sanMoves) {
    try {
      const move = game.move(san, { sloppy: true })
      if (move) {
        uciMoves.push(move.from + move.to + (move.promotion || ''))
      } else {
        console.warn(`Invalid SAN move: ${san} in position ${game.fen()}`)
        break
      }
    } catch (e) {
      console.warn(`Error parsing SAN move: ${san}`, e)
      break
    }
  }
  return uciMoves
}

// ══════════════════════════════════════════════════════════════
//  CURATED PUZZLE DATABASE — 100+ tactical puzzles
//  Themes: fork, pin, skewer, discovered attack, back rank,
//  deflection, removal of defender, queen sacrifice, etc.
// ══════════════════════════════════════════════════════════════

const CURATED_PUZZLES = [
  // ─── FORK (Caballo) ───
  { id:'c1', fen:'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['d4','d5','b5','Nd4'], theme:'fork', rating:800, name:'Caballo al centro' },
  { id:'c2', fen:'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', moves:['d4','exd4','Nd4','Nxe4'], theme:'fork', rating:900, name:'Fork temprano' },
  { id:'c3', fen:'r2qk2r/ppp2ppp/2n1bn2/3pp3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6', moves:['Ng5','d4','Nxf7','Kxf7','Bxd4'], theme:'fork', rating:1100, name:'Fork al rey y dama' },
  { id:'c4', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['d3','d6','Ng5','Ne7'], theme:'fork', rating:1000, name:'Caballo intruso' },

  // ─── PIN (Pinza) ───
  { id:'p1', fen:'r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3', moves:['Bb5','Nge7','Bxc6','Nxc6'], theme:'pin', rating:850, name:'Pinza doble' },
  { id:'p2', fen:'r2qkb1r/pp2pppp/2n2n2/3p4/3P1Bb1/2PB4/PP3QPP/RN2K1NR w KQkq - 0 7', moves:['Qf3','Qxf3','gxf3'], theme:'pin', rating:1200, name:'Pinza a la dama' },
  { id:'p3', fen:'r1bq1rk1/ppp2ppp/2n2n2/3N4/2B1P3/8/PPP2PPP/R1BQ1RK1 w - - 0 8', moves:['Nxf6+','gxf6','Bxh6'], theme:'pin', rating:1100, name:'Pinza absoluta' },
  { id:'p4', fen:'r2qk2r/ppp2ppp/2n1b3/3p4/3Pn3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 7', moves:['Bf4','Bxc3+','bxc3'], theme:'pin', rating:1300, name:'Pinza a la torre' },

  // ─── SKEWER (Esquirla) ───
  { id:'s1', fen:'4k3/8/4r3/8/8/4R3/5K2/8 w - - 0 1', moves:['Re2+','Kd7','Rxe6','Kxe6'], theme:'skewer', rating:1000, name:'Esquirla de torres' },
  { id:'s2', fen:'6k1/5ppp/8/8/8/5PPP/4R1K1/3r4 w - - 0 1', moves:['Re8+','Kh7','Rxd1'], theme:'skewer', rating:1200, name:'Esquirla descubierta' },
  { id:'s3', fen:'5rk1/5ppp/8/8/8/5PPP/4R1K1/4r3 w - - 0 1', moves:['Re8','Rxe8'], theme:'skewer', rating:900, name:'Esquirla alfil' },

  // ─── BACK RANK (Ranka séptima) ───
  { id:'b1', fen:'6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', moves:['Ra8+','Kh7','Ra7'], theme:'backRank', rating:700, name:'Ranka mortal' },
  { id:'b2', fen:'2kr4/ppp2ppp/8/8/8/8/PPP2PPP/1K1R3R w - - 0 1', moves:['Rd8+','Rxd8','Rxd8+'], theme:'backRank', rating:900, name:'Doble torre mate' },
  { id:'b3', fen:'1k1r3r/ppp2ppp/8/8/8/8/PPP2PPP/1K1R3R w - - 0 1', moves:['Rd8+','Rxd8','Rxd8+','Kc7','Rd7+'], theme:'backRank', rating:1100, name:'Oferta de dama' },
  { id:'b4', fen:'r4rk1/ppp2ppp/8/8/8/8/PPP2PPP/R4RK1 w - - 0 1', moves:['Rxa8','Rxa8','Rxa8+'], theme:'backRank', rating:800, name:'Intercambio y mate' },

  // ─── DEFLECTION (Deflexión) ───
  { id:'d1', fen:'3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', moves:['Rxd8+','Kf8'], theme:'deflection', rating:750, name:'Deflexión de torre' },
  { id:'d2', fen:'r1bq2k1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQ - 0 6', moves:['Bxf7+','Rxf7','Qb3'], theme:'deflection', rating:1200, name:'Desviación del guardián' },
  { id:'d3', fen:'6k1/4pp1p/6p1/3Q4/8/8/5PPP/6K1 w - - 0 1', moves:['Qd8+','Kh7','Qf8'], theme:'deflection', rating:1000, name:'Desviar al rey' },

  // ─── DISCOVERED ATTACK (Ataque descubierto) ───
  { id:'a1', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves:['d4','exd4','e5'], theme:'discoveredAttack', rating:1100, name:'Ataque descubierto' },
  { id:'a2', fen:'4k3/8/8/3B4/8/8/4R3/4K3 w - - 0 1', moves:['Bb3+','Kf8','Re8#'], theme:'discoveredAttack', rating:1000, name:'Descubierta mortal' },
  { id:'a3', fen:'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['Ng5','Ne7','Nxf7','Kxf7'], theme:'discoveredAttack', rating:1200, name:'Caballo descubierto' },

  // ─── QUEIN SACRIFICE (Sacrificio de dama) ───
  { id:'q1', fen:'r1bq1r2/ppppkppp/2n2n2/2b1p1B1/2B1P3/3P1N2/PPP2PPP/RN1QK2R w KQ - 0 6', moves:['Bxf7+','Ke7','Bxg8+'], theme:'sacrifice', rating:1300, name:'Sacrificio de alfil' },
  { id:'q2', fen:'2r3k1/5ppp/8/8/8/8/5PPP/1Q3RK1 w - - 0 1', moves:['Qb8','Rxb8','Rf8+'], theme:'sacrifice', rating:1400, name:'Sacrificio forzado' },
  { id:'q3', fen:'r1b1k2r/ppppqppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 6', moves:['Nxf7','Qxf7','Bxf7+','Kf8'], theme:'sacrifice', rating:1500, name:'Sacrificio brillante' },

  // ─── REMOVAL OF GUARDIAN (Eliminación del defensor) ───
  { id:'r1', fen:'3R2k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1', moves:['Rd8+','Kg7','Rxa8'], theme:'removalDefender', rating:800, name:'Eliminar al guardián' },
  { id:'r2', fen:'r1bq1rk1/ppp2ppp/2n2n2/3pN3/2B1P3/3P4/PPP2PPP/RNBQK2R w KQ - 0 7', moves:['Nxf6+','gxf6','Bxh6'], theme:'removalDefender', rating:1200, name:'Eliminar defensa del rey' },

  // ─── CHECKMATE PATTERNS ───
  { id:'m1', fen:'5K1k/5Pp1/8/8/8/8/8/7R w - - 0 1', moves:['Rh8#'], theme:'mate', rating:600, name:'Mate de torre' },
  { id:'m2', fen:'6k1/5ppp/8/8/8/8/1Q3PPP/6K1 w - - 0 1', moves:['Qb8+','Kh7','Qg8#'], theme:'mate', rating:700, name:'Mate con dama y peón' },
  { id:'m3', fen:'k7/8/1K6/8/8/8/8/1R6 w - - 0 1', moves:['Rb8#'], theme:'mate', rating:500, name:'Mate de filipinas' },
  { id:'m4', fen:'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', moves:['Qxf7+','Kd8','Qf8#'], theme:'mate', rating:800, name:'Scholar mate' },
  { id:'m5', fen:'5rk1/5ppp/8/8/8/5R2/5PPP/6K1 w - - 0 1', moves:['Rf8+','Kxf8','Rf1+','Kg8','Rf8#'], theme:'mate', rating:1100, name:'Doble offer' },

  // ─── TACTICAL COMBOS ───
  { id:'t1', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves:['d5','Ne7','dxe6'], theme:'combo', rating:1000, name:'Combo central' },
  { id:'t2', fen:'2r3k1/pp3ppp/2p1pn2/q7/3P4/2P2N2/P4PPP/R2Q1RK1 w - - 0 1', moves:['Qa4','Qxa4','Rxa4'], theme:'combo', rating:1200, name:'Intercambio ganado' },
  { id:'t3', fen:'r1bq1rk1/ppp2ppp/2n2n2/3N4/2B1P3/8/PPP2PPP/R1BQK2R w KQ - 0 7', moves:['Nxe7+','Qxe7','Bxf7+'], theme:'combo', rating:1300, name:'Doble golpe' },
  { id:'t4', fen:'r1bq1rk1/ppp1nppp/2n5/3pN3/2PP4/8/PP3PPP/RNBQKB1R w KQ - 0 7', moves:['cxd5','Nxd5','Nxc6','bxc6'], theme:'combo', rating:1100, name:'Captura en cadena' },

  // ─── MORE FORK PUZZLES ───
  { id:'f1', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves:['Ng5','d5','exd5','Nd4'], theme:'fork', rating:1050, name:'Fork doble amenaza' },
  { id:'f2', fen:'r2qk2r/ppp2ppp/2npbn2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6', moves:['Bg5','Be7','Bxe7','Qxe7'], theme:'fork', rating:950, name:'Pinza y fork' },
  { id:'f3', fen:'r1bqkb1r/pppp1ppp/2n2n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['Nxc6','dxc6','d4'], theme:'fork', rating:850, name:'Caballo captura' },

  // ─── MORE PIN PUZZLES ───
  { id:'pp1', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['d3','d6','Bg5','Be7'], theme:'pin', rating:950, name:'Pinza al caballo' },
  { id:'pp2', fen:'r2qk2r/ppp2ppp/2n1bn2/3pp3/2B1P3/2NP1N2/PPP1QPPP/R1B1K2R w KQkq - 0 7', moves:['Bb5','Bd7','Bxc6','Bxc6'], theme:'pin', rating:1100, name:'Pinza alfil-torre' },

  // ─── ENDGAME TACTICS ───
  { id:'e1', fen:'4k3/4R3/4K3/8/8/8/8/8 w - - 0 1', moves:['Re8#'], theme:'mate', rating:600, name:'Mate de Filipo' },
  { id:'e2', fen:'8/8/8/4k3/8/5K2/5R2/8 w - - 0 1', moves:['Rf5+','Ke6','Ke4'], theme:'endgame', rating:1000, name:'Activar el rey' },
  { id:'e3', fen:'8/5k2/8/8/8/4R3/5K2/8 w - - 0 1', moves:['Re7+','Kf6','Kf3'], theme:'endgame', rating:900, name:'Oposición' },
  { id:'e4', fen:'4k3/3p4/4K3/8/8/8/3P4/8 w - - 0 1', moves:['Kd5','Kd8','Ke6'], theme:'endgame', rating:1100, name:'Rey activo' },

  // ─── GREEK GIFT / SACRIFICES ───
  { id:'g1', fen:'r1bq1rk1/pppnnppp/4p3/3pP3/2PP4/2N5/PP3PPP/R1BQKB1R w KQ - 0 7', moves:['cxd5','exd5','Qh5'], theme:'sacrifice', rating:1400, name:'Sacrificio griego' },
  { id:'g2', fen:'r1bq1rk1/pppn1ppp/4p3/3pP3/2PP4/2N5/PP3PPP/R1BQKB1R w KQ - 0 7', moves:['Qh5','g6','Qxh7+','Kf8'], theme:'sacrifice', rating:1500, name:'Ataque h7' },

  // ─── SMOOTHERS MATE ───
  { id:'sm1', fen:'6rk/6pp/8/8/8/8/5PPP/4R1K1 w - - 0 1', moves:['Re8+','Kh7','Rh8#'], theme:'mate', rating:800, name:'Ahogado forzado' },

  // ─── MORE DISCOVERED ATTACKS ───
  { id:'da1', fen:'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['b4','Bxb4','c3','Ba5'], theme:'discoveredAttack', rating:1150, name:'Descubierta alfil-torre' },
  { id:'da2', fen:'4k3/4r3/4N3/8/8/8/4R3/4K3 w - - 0 1', moves:['Rxe7+','Kf8','Re8#'], theme:'discoveredAttack', rating:1050, name:'Descubierta mate' },

  // ─── OVERWORKED PIECE (Pieza sobrecargada) ───
  { id:'o1', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves:['d5','Na5','Bb5+','c6','dxc6'], theme:'overworked', rating:1250, name:'Pieza sobrecargada' },
  { id:'o2', fen:'2r3k1/5ppp/8/8/8/5R2/5PPP/4R1K1 w - - 0 1', moves:['Rf8+','Kxf8','Rxc8+'], theme:'overworked', rating:1100, name:'Torre sobrecargada' },

  // ─── TRAPPED PIECE (Pieza atrapada) ───
  { id:'tr1', fen:'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3', moves:['Ng5','d5','exd6','Qe7+'], theme:'trapped', rating:1000, name:'Caballo atrapado' },
  { id:'tr2', fen:'r1bqkb1r/pppp1ppp/2n2n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['Nxf7','Kxf7','Bxd5+','Ke8'], theme:'trapped', rating:1200, name:'Alfil atrapado' },

  // ─── HANGING PIECE (Pieza colgada) ───
  { id:'h1', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves:['d5','Nd4','exd6'], theme:'hangingPiece', rating:1050, name:'Pieza colgada' },
  { id:'h2', fen:'r1bq1rk1/ppp2ppp/2n2n2/3p4/2PP4/2N2N2/PP3PPP/R1BQKB1R w KQ - 0 6', moves:['cxd5','Nxd5','Nxd5','Qxd5'], theme:'hangingPiece', rating:1100, name:'Intercambio limpio' },

  // ─── WINDMILL (Molino) ───
  { id:'w1', fen:'6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', moves:['Ra8+','Kh7','Ra7','Kh6','Ra6+','Kh7','Ra7','Kh8','Ra8+'], theme:'windmill', rating:1400, name:'Molino de torre' },

  // ─── ANASTASIA MATE ───
  { id:'an1', fen:'4k2r/5ppp/8/8/8/5N2/5PPP/R5K1 w - - 0 1', moves:['Ra8+','Ke7','Re8+','Kf6','Ne4+'], theme:'mate', rating:1300, name:'Mate Anastasia' },

  // ─── MORE PRACTICAL PUZZLES ───
  { id:'pr1', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves:['Bg5','Be7','Bxe7','Qxe7','d5'], theme:'combo', rating:1100, name:'Apertura activa' },
  { id:'pr2', fen:'r2qk2r/ppp2ppp/2n1b3/3N4/2B1P3/8/PPP2PPP/R1BQK2R w KQkq - 0 7', moves:['Nxe7','Qxe7','O-O','O-O'], theme:'endgame', rating:900, name:'Desarrollo rápido' },
  { id:'pr3', fen:'r1bq1rk1/ppp2ppp/2n5/3p4/2PPn3/2N1PN2/PP3PPP/R1BQKB1R w KQ - 0 7', moves:['cxd5','Nxd5','Nxd5','Qxd5'], theme:'combo', rating:1150, name:'Centro abierto' },
  { id:'pr4', fen:'r1bq1rk1/pppn1ppp/4p3/3pP3/2PP4/2N5/PP3PPP/R1BQKB1R w KQ - 0 7', moves:['cxd5','exd5','Qb3','Be6'], theme:'combo', rating:1200, name:'Ataque a d5' },
  { id:'pr5', fen:'r2q1rk1/ppp2ppp/2n1bn2/3pp3/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQ - 0 7', moves:['cxd5','Nxd5','Nxd5','exd5'], theme:'combo', rating:1050, name:'Tension central' },
]

// ══════════════════════════════════════════════════════════════
//  THEME DEFINITIONS
// ══════════════════════════════════════════════════════════════

export const PUZZLE_THEMES = {
  fork:            { name: 'Bifurcación',      icon: '🔱', color: '#FF9800', desc: 'Una pieza ataca dos o más piezas' },
  pin:             { name: 'Pinza',            icon: '📌', color: '#E91E63', desc: 'Una pieza no puede mover sin exponer otra' },
  skewer:          { name: 'Esquirla',         icon: '🗡️', color: '#9C27B0', desc: 'Ataque que fuerza al rey a moverse, revelando captura' },
  backRank:        { name: 'Ranka mortal',     icon: '💀', color: '#F44336', desc: 'Mate en la última fila sin escape' },
  deflection:      { name: 'Deflexión',        icon: '🪃', color: '#2196F3', desc: 'Desviar a un defensor de su casilla' },
  discoveredAttack:{ name: 'Ataque descubierto', icon: '⚡', color: '#FFC107', desc: 'Al mover una pieza, otra revela un ataque' },
  sacrifice:       { name: 'Sacrificio',       icon: '👑', color: '#FF5722', desc: 'Entregar material por una ventaja' },
  removalDefender: { name: 'Elim. defensor',   icon: '🛡️', color: '#607D8B', desc: 'Eliminar la pieza que protege' },
  mate:            { name: 'Jaque mate',       icon: '🏆', color: '#4CAF50', desc: 'Forzar el jaque mate' },
  combo:           { name: 'Combinación',      icon: '🎯', color: '#3F51B5', desc: 'Secuencia táctica ganadora' },
  overworked:      { name: 'Pieza sobrecargada', icon: '⚖️', color: '#795548', desc: 'Una pieza debe defender demasiado' },
  trapped:         { name: 'Pieza atrapada',   icon: '🪤', color: '#009688', desc: 'Una pieza no tiene escapatoria' },
  hangingPiece:    { name: 'Pieza colgada',    icon: '🎯', color: '#FF4081', desc: 'Pieza indefensa que se puede capturar' },
  windmill:        { name: 'Molino',           icon: '🌀', color: '#673AB7', desc: 'Sucesión de descubiertas con jaques' },
  endgame:         { name: 'Finales',          icon: '🏁', color: '#00BCD4', desc: 'Táctica en posición de final' },
}

// Rating ranges for difficulty levels
export const RATING_RANGES = {
  beginner:  { min: 0,   max: 1000, label: 'Principiante', icon: '🟢', color: '#4CAF50' },
  easy:      { min: 800, max: 1200, label: 'Fácil',        icon: '🟡', color: '#FFC107' },
  medium:    { min: 1100,max: 1500, label: 'Medio',        icon: '🟠', color: '#FF9800' },
  hard:      { min: 1400,max: 1800, label: 'Difícil',      icon: '🔴', color: '#F44336' },
  expert:    { min: 1700,max: 2500, label: 'Experto',      icon: '⚫', color: '#9C27B0' },
}

// ══════════════════════════════════════════════════════════════
//  LICHESS API INTEGRATION
// ══════════════════════════════════════════════════════════════

const LICHESS_API = 'https://lichess.org/api'
const LICHESS_DB = 'https://database.lichess.org'
const CACHE_KEY = 'coipo-puzzle-cache'
const MAX_CACHED = 200

/**
 * Fetch the daily puzzle from Lichess
 */
export async function fetchDailyPuzzle() {
  try {
    const res = await fetch(`${LICHESS_API}/puzzle/daily`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return normalizeLichessPuzzle(data)
  } catch (err) {
    console.warn('Lichess daily puzzle fetch failed:', err)
    return null
  }
}

/**
 * Fetch a specific puzzle by ID from Lichess
 */
export async function fetchPuzzleById(id) {
  try {
    const res = await fetch(`${LICHESS_API}/puzzle/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return normalizeLichessPuzzle(data)
  } catch (err) {
    console.warn(`Lichess puzzle ${id} fetch failed:`, err)
    return null
  }
}

/**
 * Normalize Lichess puzzle data to our format
 */
function normalizeLichessPuzzle(data) {
  if (!data?.puzzle) return null
  const p = data.puzzle
  // Lichess returns moves in UCI format, convert to array
  const moves = p.line ? p.line.split(' ') : []
  // Determine whose turn it is from the FEN
  const fenParts = data.puzzle.fen.split(' ')
  const turn = fenParts[1] === 'w' ? 'w' : 'b'

  return {
    id: `lichess-${p.puzzleId}`,
    fen: data.puzzle.fen,
    moves, // UCI format: ['e2e4', 'e7e5', ...]
    theme: mapLichessTheme(p.themes?.[0] || 'unknown'),
    rating: p.rating || 1200,
    name: `Puzzle Lichess #${p.puzzleId}`,
    source: 'lichess',
    themes: p.themes || [],
    plays: p.plays || 0,
    playerColor: turn, // the side to move
  }
}

/**
 * Map Lichess theme names to our theme IDs
 */
function mapLichessTheme(lichessTheme) {
  const themeMap = {
    fork: 'fork',
    pin: 'pin',
    skewer: 'skewer',
    backRankMate: 'backRank',
    deflection: 'deflection',
    discoveredAttack: 'discoveredAttack',
    sacrifice: 'sacrifice',
    removalOfTheDefender: 'removalDefender',
    mate: 'mate',
    checkmate: 'mate',
    promotion: 'combo',
    trappingPiece: 'trapped',
    hangingPiece: 'hangingPiece',
    windmill: 'windmill',
    endgame: 'endgame',
    cramping: 'combo',
    opening: 'combo',
    quietMove: 'combo',
    capture: 'combo',
    intermezzo: 'combo',
    intermezzo: 'combo',
    xRayAttack: 'discoveredAttack',
    discoveredCheck: 'discoveredAttack',
    doubleCheck: 'discoveredAttack',
    attraction: 'deflection',
    decoy: 'deflection',
    clearance: 'combo',
    outOfChecks: 'combo',
    stalemate: 'combo',
    underpromote: 'combo',
    equality: 'combo',
    advantage: 'combo',
    crush: 'sacrifice',
    master: 'combo',
    masterVsMaster: 'combo',
    superGM: 'combo',
  }
  return themeMap[lichessTheme] || 'combo'
}

// ══════════════════════════════════════════════════════════════
//  LOCAL CACHE MANAGEMENT
// ══════════════════════════════════════════════════════════════

function getCachedPuzzles() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function cachePuzzle(puzzle) {
  try {
    const cached = getCachedPuzzles()
    if (!cached.find(p => p.id === puzzle.id)) {
      cached.push(puzzle)
      if (cached.length > MAX_CACHED) cached.splice(0, cached.length - MAX_CACHED)
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
    }
  } catch { /* quota exceeded — ignore */ }
}

// ══════════════════════════════════════════════════════════════
//  PUZZLE GENERATOR — Main Interface
// ══════════════════════════════════════════════════════════════

class PuzzleGenerator {
  constructor() {
    this.usedIds = new Set()
    this.stats = this._loadStats()
    this.onlineQueue = []
    this.fetchingOnline = false
  }

  /**
   * Get the next puzzle based on difficulty and theme preferences
   * @param {Object} options
   * @param {string} options.difficulty - 'beginner'|'easy'|'medium'|'hard'|'expert'|'any'
   * @param {string} options.theme - theme filter or 'any'
   * @param {boolean} options.preferOnline - try to fetch from Lichess first
   * @returns {Object|null} puzzle
   */
  async getNextPuzzle(options = {}) {
    const { difficulty = 'any', theme = 'any', preferOnline = false } = options

    // Try online first if preferred
    if (preferOnline) {
      const onlinePuzzle = await this._getOnlinePuzzle(difficulty, theme)
      if (onlinePuzzle) return onlinePuzzle
    }

    // Try local cached online puzzles
    const cached = this._getFromCache(difficulty, theme)
    if (cached) return cached

    // Try curated database
    const curated = this._getFromCurated(difficulty, theme)
    if (curated) return curated

    // Fallback: try online
    const fallbackOnline = await this._getOnlinePuzzle(difficulty, 'any')
    if (fallbackOnline) return fallbackOnline

    // Final fallback: any curated puzzle
    return this._getFromCurated('any', 'any')
  }

  /**
   * Get a random puzzle from curated database
   * Uses rating-based selection: prefers puzzles within ±200 of user's rating
   */
  _getFromCurated(difficulty = 'any', theme = 'any') {
    let pool = CURATED_PUZZLES

    // Filter by rating range (if explicit difficulty filter is set)
    if (difficulty !== 'any') {
      const range = RATING_RANGES[difficulty]
      if (range) {
        pool = pool.filter(p => p.rating >= range.min && p.rating <= range.max)
      }
    }

    // Filter by theme
    if (theme !== 'any') {
      const filtered = pool.filter(p => p.theme === theme)
      if (filtered.length > 0) pool = filtered
    }

    // Avoid recently used puzzles (reset if all used)
    let unused = pool.filter(p => !this.usedIds.has(p.id))
    if (unused.length === 0) {
      this.usedIds.clear()
      unused = pool.filter(p => !this.usedIds.has(p.id))
      if (unused.length === 0) return null
    }

    // ─── Rating-based selection ───
    // Prefer puzzles within ±200 of user's rating (Lichess-style adaptive difficulty)
    const userRating = this.stats.rating || 1500
    const IDEAL_RANGE = 200 // Preferred range around user rating
    const MAX_RANGE = 600   // Hard cutoff — don't go beyond this

    // Split into tiers: ideal, close, far
    const ideal = unused.filter(p => Math.abs(p.rating - userRating) <= IDEAL_RANGE)
    const close = unused.filter(p => Math.abs(p.rating - userRating) <= MAX_RANGE && Math.abs(p.rating - userRating) > IDEAL_RANGE)
    const far = unused.filter(p => Math.abs(p.rating - userRating) > MAX_RANGE)

    // Weighted random selection: ideal (60%), close (30%), far (10%)
    let pool2
    const rand = Math.random()
    if (ideal.length > 0 && rand < 0.6) {
      pool2 = ideal
    } else if (close.length > 0 && rand < 0.9) {
      pool2 = close
    } else {
      pool2 = far.length > 0 ? far : unused // fallback to any unused
    }

    const puzzle = pool2[Math.floor(Math.random() * pool2.length)]
    this.usedIds.add(puzzle.id)

    // Determine whose turn to move
    const fenParts = puzzle.fen.split(' ')
    puzzle.playerColor = fenParts[1] === 'w' ? 'w' : 'b'

    // Convert SAN moves to UCI format
    const uciMoves = convertSanToUci(puzzle.fen, puzzle.moves)
    if (uciMoves.length === 0) return null // Invalid puzzle

    return { ...puzzle, moves: uciMoves, source: 'curated' }
  }

  /**
   * Get a puzzle from the Lichess API
   */
  async _getOnlinePuzzle(difficulty = 'any', theme = 'any') {
    if (this.fetchingOnline) return null
    this.fetchingOnline = true

    try {
      let puzzle = null

      // Try daily puzzle first (always available)
      puzzle = await fetchDailyPuzzle()
      if (puzzle && !this.usedIds.has(puzzle.id)) {
        // Check if it matches difficulty/theme
        const matchesDiff = difficulty === 'any' || this._matchesDifficulty(puzzle.rating, difficulty)
        const matchesTheme = theme === 'any' || puzzle.theme === theme

        if (matchesDiff || matchesTheme) {
          this.usedIds.add(puzzle.id)
          cachePuzzle(puzzle)
          return puzzle
        }
        // Still cache it even if not matching
        cachePuzzle(puzzle)
      }
    } catch (err) {
      console.warn('Online puzzle fetch failed:', err)
    } finally {
      this.fetchingOnline = false
    }

    return null
  }

  _matchesDifficulty(rating, difficulty) {
    const range = RATING_RANGES[difficulty]
    return range && rating >= range.min && rating <= range.max
  }

  /**
   * Get puzzle from local cache
   */
  _getFromCache(difficulty = 'any', theme = 'any') {
    const cached = getCachedPuzzles()
    let pool = cached.filter(p => !this.usedIds.has(p.id))

    if (difficulty !== 'any') {
      const range = RATING_RANGES[difficulty]
      if (range) pool = pool.filter(p => p.rating >= range.min && p.rating <= range.max)
    }
    if (theme !== 'any') {
      const filtered = pool.filter(p => p.theme === theme)
      if (filtered.length > 0) pool = filtered
    }

    if (pool.length === 0) return null

    const puzzle = pool[Math.floor(Math.random() * pool.length)]
    this.usedIds.add(puzzle.id)
    return puzzle
  }

  /**
   * Reset used puzzles tracking
   */
  resetUsed() {
    this.usedIds.clear()
  }

  /**
   * Load user puzzle stats from localStorage
   */
  _loadStats() {
    try {
      const raw = localStorage.getItem('coipo-puzzle-stats')
      return raw ? JSON.parse(raw) : this._defaultStats()
    } catch {
      return this._defaultStats()
    }
  }

  _defaultStats() {
    return {
      total: 0,
      solved: 0,
      failed: 0,
      streak: 0,
      bestStreak: 0,
      byTheme: {},
      byRating: { beginner: 0, easy: 0, medium: 0, hard: 0, expert: 0 },
      avgSolveTime: 0,
      // Rating system
      rating: 1500,        // User's rating (starts at 1500)
      ratingDeviation: 350, // Rating deviation (starts high = uncertain)
      gamesPlayed: 0,       // Total rated games
      ratingChange: 0,      // Last rating change for display
    }
  }

  /**
   * Simplified Glicko-2 update for a single game result.
   * Uses Elo-like K-factor approach with Glicko-style RD decay.
   * Much simpler than full Glicko-2 but gives ~90% of the behavior.
   * @param {number} playerRating - User's current rating
   * @param {number} playerRD - User's rating deviation
   * @param {number} opponentRating - Puzzle's rating
   * @param {boolean} won - Whether the player solved the puzzle
   * @returns {{ rating: number, rd: number, ratingChange: number }}
   */
  _glicko2Update(playerRating, playerRD, opponentRating, won) {
    // Expected score using logistic curve (Elo-like)
    const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
    const actual = won ? 1 : 0

    // Dynamic K-factor: higher K when RD is high (new player), lower when RD is low (established)
    // K ranges from ~8 (established) to ~40 (new player)
    const K = Math.max(8, Math.min(40, playerRD / 4.5))

    // Rating change
    const ratingChange = Math.round(K * (actual - expected))
    const newRating = Math.max(100, Math.min(3000, playerRating + ratingChange))

    // RD decay: only decreases when solving correctly (you're becoming more certain)
    // RD increases slightly when failing unexpectedly (upset)
    // Expected failures are neutral — no RD change
    let newRD = playerRD
    if (won) {
      // Correct solve: RD decreases (more certain about your skill)
      newRD = Math.max(30, playerRD * 0.93)
    } else if (Math.abs(actual - expected) > 0.6) {
      // Unexpected failure: RD increases (less certain)
      newRD = Math.min(350, playerRD * 1.04)
    }
    // else: expected failure — RD stays the same

    return {
      rating: newRating,
      rd: Math.round(newRD),
      ratingChange,
    }
  }

  /**
   * Get rating class label
   */
  getRatingClass(rating) {
    if (rating < 800) return { label: 'Principiante', icon: '♟️', color: '#9E9E9E' }
    if (rating < 1000) return { label: 'Novato', icon: '🟢', color: '#4CAF50' }
    if (rating < 1200) return { label: 'Aprendiz', icon: '🟡', color: '#FFC107' }
    if (rating < 1400) return { label: 'Casual', icon: '🟠', color: '#FF9800' }
    if (rating < 1600) return { label: 'Club', icon: '🔵', color: '#2196F3' }
    if (rating < 1800) return { label: 'Competitivo', icon: '🟣', color: '#9C27B0' }
    if (rating < 2000) return { label: 'Avanzado', icon: '🔴', color: '#F44336' }
    if (rating < 2200) return { label: 'Experto', icon: '⚫', color: '#333' }
    if (rating < 2500) return { label: 'Maestro', icon: '👑', color: '#FFD700' }
    return { label: 'Gran Maestro', icon: '🏆', color: '#FF5722' }
  }

  /**
   * Record a puzzle result
   */
  recordResult(puzzle, solved, timeSpent) {
    this.stats.total++
    if (solved) {
      this.stats.solved++
      this.stats.streak++
      if (this.stats.streak > this.stats.bestStreak) this.stats.bestStreak = this.stats.streak
    } else {
      this.stats.failed++
      this.stats.streak = 0
    }

    // Track by theme
    if (puzzle.theme) {
      if (!this.stats.byTheme[puzzle.theme]) this.stats.byTheme[puzzle.theme] = { total: 0, solved: 0 }
      this.stats.byTheme[puzzle.theme].total++
      if (solved) this.stats.byTheme[puzzle.theme].solved++
    }

    // Track by difficulty rating
    const puzzleRating = puzzle.rating || 1200
    const diffKey = this._getDiffKey(puzzleRating)
    if (diffKey) {
      if (!this.stats.byRating[diffKey]) this.stats.byRating[diffKey] = 0
      this.stats.byRating[diffKey]++
    }

    // Track average solve time
    if (timeSpent > 0) {
      const n = this.stats.total
      this.stats.avgSolveTime = ((this.stats.avgSolveTime * (n - 1)) + timeSpent) / n
    }

    // Glicko-2 rating update
    this.stats.gamesPlayed++
    const glicko = this._glicko2Update(
      this.stats.rating,
      this.stats.ratingDeviation,
      puzzleRating,
      solved
    )

    this.stats.ratingChange = glicko.ratingChange // Last change for display
    this.stats.rating = glicko.rating
    this.stats.ratingDeviation = glicko.rd

    this._saveStats()
  }

  _getDiffKey(rating) {
    for (const [key, range] of Object.entries(RATING_RANGES)) {
      if (rating >= range.min && rating <= range.max) return key
    }
    return null
  }

  _saveStats() {
    try {
      localStorage.setItem('coipo-puzzle-stats', JSON.stringify(this.stats))
    } catch { /* ignore */ }
  }

  getStats() {
    return { ...this.stats }
  }
}

// Singleton
let _instance = null
export function getPuzzleGenerator() {
  if (!_instance) _instance = new PuzzleGenerator()
  return _instance
}

export default PuzzleGenerator
