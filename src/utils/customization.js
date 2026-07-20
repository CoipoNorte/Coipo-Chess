/**
 * 🎨 Customization System — Sistema modular de personalización
 *
 * Diseñado para ser extensible con mods gráficos futuros.
 * Cada categoría (tablero, piezas, ambiente, sonidos) es independiente.
 */

// ─── Temas de tablero ───
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
  },
]

// ─── Estilos de piezas SVG ───
export const PIECE_STYLES = {
  standard: { name: 'Estándar', desc: 'Clásico cburnett' },
  flat: { name: 'Plano', desc: 'Minimalista y limpio' },
  '3d': { name: '3D', desc: 'Con profundidad y sombras' },
  pixel: { name: 'Pixel', desc: 'Retro estilo arcade' },
}

// ─── Ambientes / fondos ───
export const AMBIENT_THEMES = [
  { id: 'none', name: 'Ninguno', color: '#161822', bgImage: 'none' },
  { id: 'stars', name: 'Estrellas', color: '#0a0e1a', bgImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04) 0%, transparent 40%)' },
  { id: 'sunset', name: 'Atardecer', color: '#2a1a1a', bgImage: 'radial-gradient(circle at 50% 0%, rgba(255,160,80,0.12) 0%, transparent 60%)' },
  { id: 'frost', name: 'Escarcha', color: '#1a2028', bgImage: 'radial-gradient(circle at 30% 20%, rgba(200,230,255,0.08) 0%, transparent 40%)' },
]

// ─── Efectos de sonido ───
export const SOUND_PROFILES = [
  { id: 'wood', name: 'Madera', desc: 'Tonos cálidos y naturales' },
  { id: 'glass', name: 'Cristal', desc: 'Brillo y claridad' },
  { id: 'metal', name: 'Metal', desc: 'Percusivo y resonante' },
  { id: 'soft', name: 'Suave', desc: 'Discreto y elegante' },
]

// ─── Configuración por defecto modular ───
export function getCustomizationConfig() {
  try {
    const raw = localStorage.getItem('coipo-customization')
    return raw ? JSON.parse(raw) : {
      boardTheme: 'classic',
      pieceStyle: 'standard',
      ambientTheme: 'none',
      soundProfile: 'wood',
      animations: true,
    }
  } catch {
    return { boardTheme: 'classic', pieceStyle: 'standard', ambientTheme: 'none', soundProfile: 'wood', animations: true }
  }
}

export function saveCustomizationConfig(config) {
  try {
    localStorage.setItem('coipo-customization', JSON.stringify(config))
  } catch (e) {
    console.warn('No se pudo guardar la configuración de personalización', e)
  }
}

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
