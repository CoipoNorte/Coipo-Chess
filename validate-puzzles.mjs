/**
 * Validation script for curated puzzles.
 * Run: node validate-puzzles.mjs
 * 
 * Tests that every curated puzzle's SAN moves can be converted to UCI
 * using the chess.js library, matching what puzzleGenerator.js does at runtime.
 */
import { Chess } from 'chess.js'

// ─── Copy of convertSanToUci from puzzleGenerator.js ───
function convertSanToUci(fen, sanMoves) {
  const game = new Chess(fen)
  const uciMoves = []
  for (const san of sanMoves) {
    try {
      const move = game.move(san, { sloppy: true })
      if (move) {
        uciMoves.push(move.from + move.to + (move.promotion || ''))
      } else {
        return { ok: false, error: `Invalid SAN move: "${san}" in position ${game.fen()}`, uciMoves, failedAt: san }
      }
    } catch (e) {
      return { ok: false, error: `Error parsing SAN move: "${san}" — ${e.message}`, uciMoves, failedAt: san }
    }
  }
  return { ok: true, uciMoves }
}

// ─── Copy of CURATED_PUZZLES from puzzleGenerator.js ───
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
  // ─── QUEEN SACRIFICE (Sacrificio de dama) ───
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
//  RUN VALIDATION
// ══════════════════════════════════════════════════════════════

console.log('╔══════════════════════════════════════════════════╗')
console.log('║  🧩 Curated Puzzle Validation Script            ║')
console.log('╚══════════════════════════════════════════════════╝')
console.log()

let pass = 0
let fail = 0
const failures = []

for (const puzzle of CURATED_PUZZLES) {
  const result = convertSanToUci(puzzle.fen, puzzle.moves)

  if (result.ok) {
    pass++
    console.log(`  ✅ ${puzzle.id.padEnd(5)} ${puzzle.name.padEnd(28)} [${puzzle.theme}] — ${puzzle.moves.length} SAN → ${result.uciMoves.length} UCI`)
  } else {
    fail++
    failures.push({ ...puzzle, error: result.error, failedAt: result.failedAt, partialUci: result.uciMoves })
    console.log(`  ❌ ${puzzle.id.padEnd(5)} ${puzzle.name.padEnd(28)} [${puzzle.theme}]`)
    console.log(`     FEN: ${puzzle.fen}`)
    console.log(`     SAN: ${puzzle.moves.join(' ')}`)
    console.log(`     Error: ${result.error}`)
    if (result.uciMoves.length > 0) {
      console.log(`     Partial UCI: ${result.uciMoves.join(' ')}`)
    }
    console.log()
  }
}

console.log()
console.log('══════════════════════════════════════════════════')
console.log(`  Total: ${CURATED_PUZZLES.length} puzzles`)
console.log(`  ✅ Passed: ${pass}`)
console.log(`  ❌ Failed: ${fail}`)
console.log('══════════════════════════════════════════════════')

if (failures.length > 0) {
  console.log()
  console.log('📋 FAILURES SUMMARY:')
  console.log()
  for (const f of failures) {
    console.log(`  ${f.id} (${f.name}):`)
    console.log(`    FEN:    ${f.fen}`)
    console.log(`    SAN:    ${f.moves.join(' ')}`)
    console.log(`    Failed: ${f.failedAt}`)
    console.log(`    Error:  ${f.error}`)
    console.log()
  }
}

// Exit with error code if any failures
if (fail > 0) {
  process.exit(1)
}
