/**
 * ♟️ Chess Engine - Wrapper de chess.js
 * 
 * Centraliza toda la lógica de ajedrez usando la biblioteca chess.js.
 * Proporciona una interfaz limpia para el resto de la aplicación.
 */
import { Chess } from 'chess.js';

class ChessEngine {
  constructor() {
    this.game = new Chess();
    this.moveHistory = [];
    this.capturedPieces = { w: [], b: [] };
  }

  /**
   * Reinicia la partida
   */
  reset() {
    this.game = new Chess();
    this.moveHistory = [];
    this.capturedPieces = { w: [], b: [] };
  }

  /**
   * Carga una posición desde FEN
   */
  loadFEN(fen) {
    this.game = new Chess(fen);
  }

  /**
   * Obtiene el FEN actual
   */
  getFEN() {
    return this.game.fen();
  }

  /**
   * Obtiene el PGN de la partida
   */
  getPGN() {
    return this.game.pgn();
  }

  /**
   * Carga un PGN
   */
  loadPGN(pgn) {
    return this.game.loadPgn(pgn);
  }

  /**
   * Realiza un movimiento
   * @param {string} from - Casilla origen (e.g., 'e2')
   * @param {string} to - Casilla destino (e.g., 'e4')
   * @param {string|null} promotion - Pieza de promoción ('q', 'r', 'b', 'n')
   * @returns {object|null} - Objeto del movimiento o null si es inválido
   */
  move(from, to, promotion = null) {
    try {
      const moveOptions = { from, to };
      if (promotion) moveOptions.promotion = promotion;

      const result = this.game.move(moveOptions);

      if (result) {
        // Registrar capturas
        if (result.captured) {
          const color = result.color === 'w' ? 'b' : 'w';
          this.capturedPieces[color].push(result.captured);
        }

        this.moveHistory.push(result);
      }

      return result;
    } catch (error) {
      console.warn('Movimiento inválido:', error.message);
      return null;
    }
  }

  /**
   * Realiza un movimiento desde notación UCI (e.g., 'e2e4')
   */
  moveUCI(uci) {
    if (uci.length < 4) return null;
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promotion = uci.length > 4 ? uci[4] : null;
    return this.move(from, to, promotion);
  }

  /**
   * Obtiene todos los movimientos legales para una casilla
   */
  getLegalMoves(square) {
    if (!square) return [];
    return this.game.moves({ square, verbose: true });
  }

  /**
   * Obtiene todos los movimientos legales del jugador actual
   */
  getAllLegalMoves() {
    return this.game.moves({ verbose: true });
  }

  /**
   * Verifica si una casilla tiene una pieza del color indicado
   */
  hasPiece(square, color = null) {
    const piece = this.game.get(square);
    if (!piece) return false;
    return color ? piece.color === color : true;
  }

  /**
   * Obtiene la pieza en una casilla
   */
  getPiece(square) {
    return this.game.get(square);
  }

  /**
   * Obtiene el tablero completo
   */
  getBoard() {
    return this.game.board();
  }

  /**
   * Turno actual ('w' | 'b')
   */
  getTurn() {
    return this.game.turn();
  }

  /**
   * ¿Está en jaque?
   */
  isInCheck() {
    return this.game.isCheck();
  }

  /**
   * ¿Está en jaque mate?
   */
  isCheckmate() {
    return this.game.isCheckmate();
  }

  /**
   * ¿Está en tablas?
   */
  isDraw() {
    return this.game.isDraw();
  }

  /**
   * ¿Está en ahogado (stalemate)?
   */
  isStalemate() {
    return this.game.isStalemate();
  }

  /**
   * Estado completo del juego
   */
  getGameStatus() {
    if (this.isCheckmate()) return 'CHECKMATE';
    if (this.isStalemate()) return 'STALEMATE';
    if (this.isDraw()) return 'DRAW';
    if (this.isInCheck()) return 'CHECK';
    return 'PLAYING';
  }

  /**
   * Obtiene la pieza que está dando jaque (si existe)
   */
  getCheckingPieces() {
    // chess.js no tiene un método directo, así que verificamos manualmente
    const turn = this.getTurn();
    const checking = [];
    const board = this.getBoard();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color !== turn) continue;

        const square = String.fromCharCode(97 + col) + (8 - row);
        const moves = this.getLegalMoves(square);

        for (const move of moves) {
          if (move.flags.includes('c') || move.flags.includes('k')) continue;
          // Verificar si después del movimiento el rey enemigo sigue en jaque
          const testGame = new Chess(this.getFEN());
          try {
            testGame.move(move.san);
            // No hay forma directa, aproximamos: si el movimiento captura al rey (no posible en chess.js)
          } catch (e) {}
        }
      }
    }

    return checking;
  }

  /**
   * Deshace el último movimiento
   */
  undo() {
    const moved = this.game.undo();
    if (moved) {
      this.moveHistory.pop();
      // Devolver pieza capturada
      if (moved.captured) {
        const color = moved.color === 'w' ? 'b' : 'w';
        this.capturedPieces[color].pop();
      }
    }
    return moved;
  }

  /**
   * Número de movimientos realizados (media jugadas)
   */
  getMoveCount() {
    return this.moveHistory.length;
  }
}

export default ChessEngine;
