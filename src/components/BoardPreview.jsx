/**
 * BoardPreview — Mini tablero estático para previsualizar el color asignado
 * Muestra la posición inicial, rotada según el color del jugador.
 */
import { ChessPiece } from './ChessPieces'
import './BoardPreview.css'

// Posición inicial — aplanada para iteación simple
const INITIAL_POSITION = [
  { sq: 'a8', p: { color: 'b', type: 'r' } }, { sq: 'b8', p: { color: 'b', type: 'n' } },
  { sq: 'c8', p: { color: 'b', type: 'b' } }, { sq: 'd8', p: { color: 'b', type: 'q' } },
  { sq: 'e8', p: { color: 'b', type: 'k' } }, { sq: 'f8', p: { color: 'b', type: 'b' } },
  { sq: 'g8', p: { color: 'b', type: 'n' } }, { sq: 'h8', p: { color: 'b', type: 'r' } },
  { sq: 'a7', p: { color: 'b', type: 'p' } }, { sq: 'b7', p: { color: 'b', type: 'p' } },
  { sq: 'c7', p: { color: 'b', type: 'p' } }, { sq: 'd7', p: { color: 'b', type: 'p' } },
  { sq: 'e7', p: { color: 'b', type: 'p' } }, { sq: 'f7', p: { color: 'b', type: 'p' } },
  { sq: 'g7', p: { color: 'b', type: 'p' } }, { sq: 'h7', p: { color: 'b', type: 'p' } },
  { sq: 'a2', p: { color: 'w', type: 'p' } }, { sq: 'b2', p: { color: 'w', type: 'p' } },
  { sq: 'c2', p: { color: 'w', type: 'p' } }, { sq: 'd2', p: { color: 'w', type: 'p' } },
  { sq: 'e2', p: { color: 'w', type: 'p' } }, { sq: 'f2', p: { color: 'w', type: 'p' } },
  { sq: 'g2', p: { color: 'w', type: 'p' } }, { sq: 'h2', p: { color: 'w', type: 'p' } },
  { sq: 'a1', p: { color: 'w', type: 'r' } }, { sq: 'b1', p: { color: 'w', type: 'n' } },
  { sq: 'c1', p: { color: 'w', type: 'b' } }, { sq: 'd1', p: { color: 'w', type: 'q' } },
  { sq: 'e1', p: { color: 'w', type: 'k' } }, { sq: 'f1', p: { color: 'w', type: 'b' } },
  { sq: 'g1', p: { color: 'w', type: 'n' } }, { sq: 'h1', p: { color: 'w', type: 'r' } },
]

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

export default function BoardPreview({ playerColor = 'w' }) {
  const isWhite = playerColor === 'w'
  const pieceMap = {}
  INITIAL_POSITION.forEach(({ sq, p }) => { pieceMap[sq] = p })

  const rows = [0, 1, 2, 3, 4, 5, 6, 7]
  const cols = [0, 1, 2, 3, 4, 5, 6, 7]

  return (
    <div className="bp-wrap">
      <div className="bp-board">
        {rows.map((r) => (
          <div key={r} className="bp-row">
            {cols.map((c) => {
              // Board coordinates after potential rotation
              const boardRow = isWhite ? r : 7 - r
              const boardCol = isWhite ? c : 7 - c
              const sq = FILES[boardCol] + RANKS[boardRow]
              const p = pieceMap[sq]
              const isLight = (r + c) % 2 === 0
              const isBottomRow = r === 7

              return (
                <div
                  key={sq}
                  className={`bp-sq ${isLight ? 'bp-sl' : 'bp-sd'}`}
                >
                  {p && (
                    <span className={`bp-pce ${p.color === 'w' ? 'bp-pw' : 'bp-pb'}`}>
                      <ChessPiece color={p.color} type={p.type} />
                    </span>
                  )}
                  {isBottomRow && (
                    <span className="bp-file">{FILES[boardCol]}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
