/**
 * 🤖 Coipo Chess AI - Stockfish Engine
 * 
 * Motor de ajedrez profesional usando Stockfish.js via Web Worker.
 * 3 niveles de dificultad: easy, medium, hard.
 * Stockfish se carga desde CDN y se comunica via protocolo UCI.
 */
import { Chess } from 'chess.js';

// URL de Stockfish WASM desde CDN
const STOCKFISH_URL = 'https://cdn.jsdelivr.net/npm/stockfish.wasm@0.2.0/dist/stockfish.wasm';
const STOCKFISH_JS_URL = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';

class AIPlayer {
  constructor(difficulty = 'easy') {
    this.difficulty = difficulty;
    this.thinking = false;
    this.worker = null;
    this.ready = false;
    this.initPromise = null;
  }

  /**
   * Inicializa el worker de Stockfish
   */
  async init() {
    if (this.initPromise) return this.initPromise;
    if (this.ready) return Promise.resolve();

    this.initPromise = new Promise((resolve, reject) => {
      try {
        // Intentar cargar Stockfish.js (más compatible)
        this.worker = new Worker(STOCKFISH_JS_URL);

        this.worker.onmessage = (e) => {
          const msg = e.data;
          if (typeof msg === 'string') {
            if (msg.includes('readyok')) {
              this.ready = true;
              resolve();
            }
          }
        };

        this.worker.onerror = (err) => {
          console.warn('Stockfish.js worker error, usando motor alternativo:', err);
          this.ready = false;
          this.worker = null;
          // No rechazamos, usaremos fallback
          resolve();
        };

        // Configurar UCI
        this.worker.postMessage('uci');
        this.worker.postMessage('setoption name Skill Level value 20');
        this.worker.postMessage('isready');

        // Timeout
        setTimeout(() => {
          if (!this.ready) {
            console.warn('Stockfish timeout, usando fallback');
            this.ready = false;
            this.worker?.terminate();
            this.worker = null;
            resolve();
          }
        }, 5000);
      } catch (err) {
        console.warn('Stockfish no disponible, usando motor heurístico:', err);
        this.ready = false;
        resolve();
      }
    });

    return this.initPromise;
  }

  /**
   * Cambia la dificultad
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    if (this.worker && this.ready) {
      const skillMap = { easy: 2, medium: 8, hard: 20 };
      this.worker.postMessage(`setoption name Skill Level value ${skillMap[difficulty] || 8}`);
    }
  }

  /**
   * Obtiene la profundidad según dificultad
   */
  _getDepth() {
    switch (this.difficulty) {
      case 'easy':   return 4;
      case 'medium': return 10;
      case 'hard':   return 18;
      default:       return 6;
    }
  }

  /**
   * Calcula el mejor movimiento usando Stockfish o fallback heurístico
   */
  async getBestMove(fen, onProgress = null) {
    this.thinking = true;

    try {
      await this.init();

      if (this.worker && this.ready) {
        return await this._getStockfishMove(fen);
      }
    } catch (err) {
      console.warn('Error con Stockfish, usando fallback:', err);
    }

    // Fallback: motor heurístico simple
    const move = await this._getHeuristicMove(fen);
    this.thinking = false;
    return move;
  }

  /**
   * Obtiene movimiento via Stockfish
   */
  _getStockfishMove(fen) {
    return new Promise((resolve) => {
      const depth = this._getDepth();
      const timeout = this.difficulty === 'hard' ? 10000 : this.difficulty === 'medium' ? 5000 : 2000;
      let resolved = false;

      const finish = (result) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        this.thinking = false;
        resolve(result);
      };

      const timer = setTimeout(() => {
        this.worker.postMessage('stop');
        // Fallback after stop: give Stockfish 500ms to reply, then use heuristic
        setTimeout(() => finish(this._getHeuristicMove(fen)), 500);
      }, timeout);

      this.worker.onmessage = (e) => {
        const msg = e.data;
        if (typeof msg === 'string' && msg.startsWith('bestmove')) {
          const parts = msg.split(' ');
          const uci = parts[1];

          if (uci && uci !== '(none)') {
            const from = uci.substring(0, 2);
            const to = uci.substring(2, 4);
            const promotion = uci.length > 4 ? uci[4] : null;
            finish({ from, to, promotion });
          } else {
            finish(this._getHeuristicMove(fen));
          }
        }
      };

      this.worker.onerror = () => {
        finish(this._getHeuristicMove(fen));
      };

      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);
    });
  }

  /**
   * Motor heurístico de respaldo (similar al original pero mejorado)
   */
  async _getHeuristicMove(fen) {
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });

    if (moves.length === 0) {
      this.thinking = false;
      return null;
    }

    // Evaluar cada movimiento con heurística simple
    const scored = moves.map(move => {
      let score = this._quickEvaluateMove(game, move);
      return { move, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Fácil: a veces elige no el mejor
    if (this.difficulty === 'easy') {
      const pick = Math.random() < 0.4
        ? scored[Math.floor(Math.random() * Math.min(3, scored.length))]
        : scored[0];
      await this._delay(200 + Math.random() * 300);
      this.thinking = false;
      return { from: pick.move.from, to: pick.move.to, promotion: pick.move.promotion };
    }

    await this._delay(100);
    this.thinking = false;
    return { from: scored[0].move.from, to: scored[0].move.to, promotion: scored[0].move.promotion };
  }

  /**
   * Evaluación rápida de un movimiento
   */
  _quickEvaluateMove(game, move) {
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let score = 0;

    // Capturar pieza de alto valor
    if (move.captured) {
      score += pieceValues[move.captured] || 0;
    }

    // Promoción
    if (move.flags?.includes('p')) {
      score += 800;
    }

    // Dar jaque
    const testGame = new Chess(game.fen());
    try {
      testGame.move(move.san);
      if (testGame.isCheck()) score += 50;
      if (testGame.isCheckmate()) score += 100000;
    } catch (e) {}

    // Control del centro
    const center = ['d4', 'd5', 'e4', 'e5'];
    if (center.includes(move.to)) score += 20;

    // Desarrollo temprano
    if (game.moveNumber() < 8 && (move.piece === 'n' || move.piece === 'b')) {
      score += 15;
    }

    // Evitar mover la misma pieza dos veces en apertura
    if (game.moveNumber() < 6 && move.piece === 'p') {
      // Bueno para peones de centro
      if (move.from[0] === 'd' || move.from[0] === 'e') score += 5;
    }

    return score;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isThinking() {
    return this.thinking;
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
  }
}

export default AIPlayer;
