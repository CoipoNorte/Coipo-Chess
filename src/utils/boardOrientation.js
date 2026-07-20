/**
 * 🧭 Board Orientation — Manejo profesional de rotación del tablero
 *
 * El tablero debe rotarse según el color del jugador:
 *   - Blancas (w): orientación estándar (no rotado)
 *   - Negras (b): rotado 180° (para ver desde el lado negro)
 * El usuario puede forzar la rotación con `flip`.
 */
export function resolveBoardOrientation(playerColor, flip = false) {
  // Si flip es true, invertimos la orientación natural del jugador
  const baseRotated = playerColor === 'b';
  return flip ? !baseRotated : baseRotated;
}

/**
 * Obtiene el color del jugador que está en la parte inferior del tablero
 * según la orientación actual.
 */
export function bottomColor(playerColor, flip = false) {
  const rotated = resolveBoardOrientation(playerColor, flip);
  // Si el tablero está rotado (true), el jugador original está arriba
  // Si no está rotado (false), el jugador original está abajo
  return rotated ? (playerColor === 'w' ? 'b' : 'w') : playerColor;
}
