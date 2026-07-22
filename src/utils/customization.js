/**
 * 🎨 Customization System v2 — Modular visual customization
 *
 * Supports:
 * - Multiple built-in piece sets (cburnett, alpha, kingdoms, etc.)
 * - Custom piece sets from public/piezas/<set-name>/
 * - Custom board textures from public/tablero/<theme-name>/
 * - Board size selector
 * - Ambient themes, sound profiles
 */

// ─── Board Themes (color-based, always available) ───
export const BOARD_THEMES = [
  {
    id: 'classic',
    name: 'Clásico',
    desc: 'Beige y verde tradicional',
    light: '#f5f2e8',
    dark: '#769656',
    darkAccent: '#6a8b4f',
    lightAccent: '#e8e0c0',
    ring: 'rgba(47, 79, 79, 0.25)',
    icon: '🟢',
  },
  {
    id: 'dark',
    name: 'Oscuro',
    desc: 'Estilo nocturno elegante',
    light: '#e0ddd5',
    dark: '#5c7a5c',
    darkAccent: '#3a5a3a',
    lightAccent: '#d0ddd5',
    ring: 'rgba(20, 40, 40, 0.35)',
    icon: '🌙',
  },
  {
    id: 'wood',
    name: 'Madera',
    desc: 'Calidez de madera natural',
    light: '#eeddaa',
    dark: '#8b5a2b',
    darkAccent: '#6b3a15',
    lightAccent: '#f0d8a0',
    ring: 'rgba(60, 40, 20, 0.2)',
    icon: '🪵',
  },
  {
    id: 'marble',
    name: 'Mármol',
    desc: 'Elegancia gris y blanco',
    light: '#f8f8f4',
    dark: '#8a9a8a',
    darkAccent: '#6a7a6a',
    lightAccent: '#e8ece8',
    ring: 'rgba(30, 40, 50, 0.2)',
    icon: '🪨',
  },
  {
    id: 'ocean',
    name: 'Océano',
    desc: 'Azules profundos y espuma',
    light: '#ddeeff',
    dark: '#2a6a8a',
    darkAccent: '#1a4a6a',
    lightAccent: '#cce0ff',
    ring: 'rgba(20, 60, 100, 0.2)',
    icon: '🌊',
  },
  {
    id: 'rosewood',
    name: 'Palisandro',
    desc: 'Madera oscura y lujosa',
    light: '#e8c8a0',
    dark: '#6b3a2a',
    darkAccent: '#5a2a1a',
    lightAccent: '#d8b890',
    ring: 'rgba(80, 30, 15, 0.2)',
    icon: '🌹',
  },
  {
    id: 'purple',
    name: 'Púrpura',
    desc: 'Morados profundos y elegantes',
    light: '#e8e0f0',
    dark: '#6a4a8a',
    darkAccent: '#5a3a7a',
    lightAccent: '#d8d0e0',
    ring: 'rgba(80, 40, 120, 0.2)',
    icon: '💜',
  },
]

// ─── Piece Sets (built-in) ───
export const PIECE_SETS = [
  { id: 'cburnett', name: 'Cburnett', desc: 'Clásico Lichess', icon: '♔', builtin: true },
  { id: 'alpha', name: 'Alpha', desc: 'Estilo tipográfico', icon: '♕', builtin: true },
  { id: 'kingdoms', name: 'Kingdoms', desc: ' medieval detallado', icon: '⚔', builtin: true },
  { id: 'pixel', name: 'Pixel', desc: 'Retro 8-bit', icon: '👾', builtin: true },
  { id: 'custom', name: 'Custom', desc: 'Carga desde piezas/', icon: '📁', builtin: false },
]

// ─── Board Size Presets ───
export const BOARD_SIZES = [
  { id: 'compact', name: 'Compacto', desc: '360px', value: 360 },
  { id: 'medium', name: 'Mediano', desc: '440px', value: 440 },
  { id: 'large', name: 'Grande', desc: '520px', value: 520 },
  { id: 'xlarge', name: 'Extra Grande', desc: '600px', value: 600 },
  { id: 'auto', name: 'Automático', desc: 'Se adapta', value: 0 },
]

// ─── Board Texture Themes (loaded from public/tablero/) ───
export const BOARD_TEXTURE_THEMES = [
  { id: 'classic', name: 'Clásico', desc: 'Colores tradicionales', builtin: true },
  { id: 'green-marble', name: 'Mármol Verde', desc: 'Mármol premium', builtin: true },
  { id: 'blue', name: 'Azul', desc: 'Azul moderno', builtin: true },
  { id: 'purple', name: 'Púrpura', desc: 'Púrpura elegante', builtin: true },
  { id: 'custom', name: 'Custom', desc: 'Carga desde tablero/', builtin: false },
]

// ─── Ambient Themes ───
export const AMBIENT_THEMES = [
  { id: 'none', name: 'Ninguno', color: '#161822', bgImage: 'none', icon: '⬛' },
  { id: 'stars', name: 'Estrellas', color: '#0a0e1a', bgImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04) 0%, transparent 40%)', icon: '⭐' },
  { id: 'sunset', name: 'Atardecer', color: '#2a1a1a', bgImage: 'radial-gradient(circle at 50% 0%, rgba(255,160,80,0.12) 0%, transparent 60%)', icon: '🌅' },
  { id: 'frost', name: 'Escarcha', color: '#1a2028', bgImage: 'radial-gradient(circle at 30% 20%, rgba(200,230,255,0.08) 0%, transparent 40%)', icon: '❄️' },
  { id: 'aurora', name: 'Aurora', color: '#0a1a1a', bgImage: 'radial-gradient(ellipse at 20% 50%, rgba(0,255,128,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(128,0,255,0.06) 0%, transparent 50%)', icon: '🌈' },
]

// ─── Sound Profiles ───
export const SOUND_PROFILES = [
  { id: 'wood', name: 'Madera', desc: 'Tonos cálidos y naturales', icon: '🪵' },
  { id: 'glass', name: 'Cristal', desc: 'Brillo y claridad', icon: '🔮' },
  { id: 'metal', name: 'Metal', desc: 'Percusivo y resonante', icon: '🔔' },
  { id: 'soft', name: 'Suave', desc: 'Discreto y elegante', icon: '🤫' },
]

// ─── Default Configuration ───
const DEFAULT_CONFIG = {
  boardTheme: 'classic',
  boardTexture: 'classic',
  pieceSet: 'cburnett',
  customPiecePath: '',
  customBoardPath: '',
  boardSize: 'auto',
  ambientTheme: 'none',
  soundProfile: 'wood',
  animations: true,
  volume: 1.0,
  showCoordinates: true,
  showLegalMoves: true,
  pieceAnimation: true,
  lastMoveHighlight: true,
  checkHighlight: true,
  arrowKeys: true,
}

// ─── Load configuration from localStorage ───
export function getCustomizationConfig() {
  try {
    const raw = localStorage.getItem('coipo-customization-v2')
    if (raw) {
      const saved = JSON.parse(raw)
      return { ...DEFAULT_CONFIG, ...saved }
    }
    // Migrate from v1
    const v1Raw = localStorage.getItem('coipo-customization')
    if (v1Raw) {
      const v1 = JSON.parse(v1Raw)
      const migrated = {
        boardTheme: v1.boardTheme || 'classic',
        pieceSet: v1.pieceStyle || 'cburnett',
        ambientTheme: v1.ambientTheme || 'none',
        soundProfile: v1.soundProfile || 'wood',
        animations: v1.animations !== false,
        volume: v1.volume ?? 1.0,
      }
      saveCustomizationConfig(migrated)
      return { ...DEFAULT_CONFIG, ...migrated }
    }
    return { ...DEFAULT_CONFIG }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

// ─── Save configuration to localStorage ───
export function saveCustomizationConfig(config) {
  try {
    localStorage.setItem('coipo-customization-v2', JSON.stringify(config))
  } catch (e) {
    console.warn('No se pudo guardar la configuración de personalización', e)
  }
}

// ─── Update a single config field ───
export function updateConfigField(key, value) {
  const config = getCustomizationConfig()
  config[key] = value
  saveCustomizationConfig(config)
  return config
}

// ─── Get CSS variables for a board theme ───
export function getThemeCSSVariables(themeId) {
  const theme = BOARD_THEMES.find(t => t.id === themeId) || BOARD_THEMES[0]
  return {
    '--light-square': theme.light,
    '--dark-square': theme.dark,
    '--dark-accent': theme.darkAccent,
    '--light-accent': theme.lightAccent,
    '--glass-border': theme.ring,
  }
}

// ─── Get CSS variables for board size ───
export function getBoardSizeCSS(sizeId) {
  const size = BOARD_SIZES.find(s => s.id === sizeId)
  if (!size || size.id === 'auto') return {}
  return { '--board-size': `${size.value}px` }
}

// ─── Get piece set path (for custom file-based loading) ───
export function getPieceSetPath(setId) {
  if (setId === 'custom') {
    const config = getCustomizationConfig()
    return config.customPiecePath || '/piezas/custom'
  }
  return `/piezas/${setId}`
}

// ─── Get board texture path ───
export function getBoardTexturePath(themeId) {
  if (themeId === 'custom') {
    const config = getCustomizationConfig()
    return config.customBoardPath || '/tablero/custom'
  }
  return `/tablero/${themeId}`
}

// ─── Reset to defaults ───
export function resetCustomization() {
  saveCustomizationConfig({ ...DEFAULT_CONFIG })
  return { ...DEFAULT_CONFIG }
}
