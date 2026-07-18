export function resolveBoardOrientation(playerColor, flip = false) {
  return playerColor === 'b' ? !flip : flip
}
