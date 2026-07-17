/**
 * 🕶️ Blind Mode - Lógica del Modo A Ciegas
 * 
 * En el modo a ciegas, cada jugador ve sus propias piezas normalmente,
 * pero las piezas del rival se muestran como peones genéricos.
 * Esto crea un desafío de deducción y memoria.
 */

/**
 * Ofusca las piezas del rival para mostrarlas como peones genéricos
 * @param {Array} board - Tablero de chess.js (board())
 * @param {string} playerColor - 'w' o 'b' (color del jugador local)
 * @returns {Array} - Tablero modificado para renderizar
 */
export function obfuscateBoard(board, playerColor) {
  return board.map((row) =>
    row.map((piece) => {
      if (!piece) return null;

      // Mostrar piezas propias normalmente
      if (piece.color === playerColor) {
        return { ...piece };
      }

      // Ocultar piezas enemigas: mostrar como peón genérico
      return {
        color: piece.color,
        type: 'p', // Siempre peón
        _hidden: true, // Flag para identificar que está oculto
        _realType: piece.type, // Guardar el tipo real internamente
      };
    })
  );
}

/**
 * Revela momentáneamente una pieza capturada
 * @param {object} capturedPiece - La pieza capturada original
 * @returns {object} - Pieza revelada (se muestra por unos segundos)
 */
export function revealCapturedPiece(capturedPiece) {
  return {
    ...capturedPiece,
    _revealed: true,
    _revealedAt: Date.now(),
  };
}

/**
 * Verifica si una pieza está siendo revelada actualmente
 * @param {object} piece 
 * @param {number} revealDuration - Duración de la revelación en ms
 * @returns {boolean}
 */
export function isRevealed(piece, revealDuration = 3000) {
  if (!piece?._revealed) return false;
  return Date.now() - piece._revealedAt < revealDuration;
}

/**
 * Convierte el tablero ofuscado a un formato para enviar al rival
 * @param {Array} board - Tablero local
 * @param {string} enemyColor - Color del rival
 * @returns {Array} - Tablero ofuscado para enviar
 */
export function getBlindBoardForOpponent(board, enemyColor) {
  return board.map((row) =>
    row.map((piece) => {
      if (!piece) return null;

      // Las piezas del rival se ven como peones
      if (piece.color === enemyColor) {
        return {
          color: piece.color,
          type: 'p',
          _hidden: true,
        };
      }

      // Nuestras piezas se ven normales para nosotros,
      // pero para el rival... espera, esto es al revés:
      // El rival ve nuestras piezas como peones
      if (piece.color !== enemyColor) {
        return {
          color: piece.color,
          type: 'p',
          _hidden: true,
        };
      }

      return { ...piece };
    })
  );
}

/**
 * Prepara el estado de juego para enviar al rival en modo ciegas
 * @param {object} gameState - Estado completo del juego
 * @param {string} senderColor - Color del que envía
 * @returns {object} - Estado ofuscado
 */
export function prepareBlindState(gameState, senderColor) {
  const enemyColor = senderColor === 'w' ? 'b' : 'w';
  const board = gameState.board;

  const blindBoard = board.map((row) =>
    row.map((piece) => {
      if (!piece) return null;

      // Las piezas del enemigo (para el receptor) se muestran como peones
      if (piece.color === enemyColor) {
        return {
          color: piece.color,
          type: 'p',
          _hidden: true,
        };
      }

      // Las piezas del remitente se muestran normales al remitente,
      // pero se ofuscan para el receptor
      return {
        color: piece.color,
        type: 'p',
        _hidden: true,
      };
    })
  );

  return {
    ...gameState,
    board: blindBoard,
  };
}
