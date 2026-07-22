/**
 * ⚙️ AppearanceSettings — Lichess-style appearance panel
 *
 * Board theme, piece set, board size, ambient theme, coordinates, etc.
 */

import { useState, useEffect } from 'react'
import {
  BOARD_THEMES,
  PIECE_SETS,
  BOARD_SIZES,
  BOARD_TEXTURE_THEMES,
  AMBIENT_THEMES,
  SOUND_PROFILES,
  getCustomizationConfig,
  saveCustomizationConfig,
  getThemeCSSVariables,
  getBoardSizeCSS,
} from '../utils/customization'
import { ChessPiece } from './ChessPieces'
import './AppearanceSettings.css'

export default function AppearanceSettings({ onClose, onApply }) {
  const [config, setConfig] = useState(() => getCustomizationConfig())
  const [tab, setTab] = useState('board') // 'board' | 'pieces' | 'size' | 'ambient' | 'sound'
  const [customPath, setCustomPath] = useState(config.customPiecePath || '')

  const update = (key, value) => {
    const next = { ...config, [key]: value }
    setConfig(next)
    saveCustomizationConfig(next)
    onApply?.(next)
  }

  const tabs = [
    { id: 'board', icon: '🎨', label: 'Tablero' },
    { id: 'pieces', icon: '♚', label: 'Piezas' },
    { id: 'size', icon: '📐', label: 'Tamaño' },
    { id: 'ambient', icon: '🌌', label: 'Ambiente' },
    { id: 'sound', icon: '🔊', label: 'Sonido' },
  ]

  return (
    <div className="appearance-overlay" onClick={onClose}>
      <div className="appearance-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ap-header">
          <h3>Apariencia</h3>
          <button className="ap-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="ap-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`ap-tab ${tab === t.id ? 'ap-tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="ap-tab-icon">{t.icon}</span>
              <span className="ap-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="ap-content">
          {/* ─── Board Theme ─── */}
          {tab === 'board' && (
            <div className="ap-section">
              <h4 className="ap-section-title">Color del tablero</h4>
              <div className="ap-grid">
                {BOARD_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    className={`ap-card ${config.boardTheme === theme.id ? 'ap-card-active' : ''}`}
                    onClick={() => update('boardTheme', theme.id)}
                  >
                    <div className="ap-card-preview" style={{
                      background: `linear-gradient(135deg, ${theme.light} 50%, ${theme.dark} 50%)`,
                    }} />
                    <div className="ap-card-info">
                      <span className="ap-card-name">{theme.icon} {theme.name}</span>
                      <span className="ap-card-desc">{theme.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <h4 className="ap-section-title" style={{ marginTop: 16 }}>Textura del tablero</h4>
              <p className="ap-hint">Coloca imágenes en <code>public/tablero/&lt;tema&gt;/light.png</code> y <code>dark.png</code></p>
              <div className="ap-grid">
                {BOARD_TEXTURE_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    className={`ap-card ${config.boardTexture === theme.id ? 'ap-card-active' : ''}`}
                    onClick={() => update('boardTexture', theme.id)}
                  >
                    <div className="ap-card-preview" style={{
                      backgroundImage: theme.builtin ? 'none' : undefined,
                      background: `repeating-conic-gradient(${theme.id === 'custom' ? '#888' : '#666'} 0% 25%, #444 0% 50%) 0 0 / 20px 20px`,
                    }} />
                    <div className="ap-card-info">
                      <span className="ap-card-name">{theme.name}</span>
                      <span className="ap-card-desc">{theme.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Piece Set ─── */}
          {tab === 'pieces' && (
            <div className="ap-section">
              <h4 className="ap-section-title">Estilo de piezas</h4>
              <div className="ap-grid">
                {PIECE_SETS.map(ps => (
                  <button
                    key={ps.id}
                    className={`ap-card ap-card-piece ${config.pieceSet === ps.id ? 'ap-card-active' : ''}`}
                    onClick={() => update('pieceSet', ps.id)}
                  >
                    <div className="ap-card-preview ap-card-preview-piece">
                      <ChessPiece color="w" type="k" pieceSet={ps.id} />
                      <ChessPiece color="b" type="q" pieceSet={ps.id} />
                    </div>
                    <div className="ap-card-info">
                      <span className="ap-card-name">{ps.icon} {ps.name}</span>
                      <span className="ap-card-desc">{ps.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {config.pieceSet === 'custom' && (
                <div className="ap-custom-path">
                  <label className="ap-label">Ruta del set custom:</label>
                  <input
                    type="text"
                    className="ap-input"
                    value={customPath}
                    onChange={e => setCustomPath(e.target.value)}
                    onBlur={() => update('customPiecePath', customPath)}
                    placeholder="/piezas/mi-set"
                  />
                  <p className="ap-hint">
                    Coloca 12 archivos SVG/PNG en la carpeta:
                    <br /><code>wk.svg, bk.svg, wq.svg, bq.svg, ...</code>
                  </p>
                </div>
              )}

              <h4 className="ap-section-title" style={{ marginTop: 16 }}>Vista previa completa</h4>
              <div className="ap-preview-board">
                <div className="ap-preview-row">
                  {['r','n','b','q','k','b','n','r'].map((t, i) => (
                    <div key={`b${i}`} className={`ap-preview-sq ${(i)%2===0 ? 'sd' : 'sl'}`}>
                      <ChessPiece color="b" type={t} pieceSet={config.pieceSet} customPath={config.customPiecePath} />
                    </div>
                  ))}
                </div>
                <div className="ap-preview-row">
                  {Array(8).fill('p').map((t, i) => (
                    <div key={`bp${i}`} className={`ap-preview-sq ${i%2===1 ? 'sd' : 'sl'}`}>
                      <ChessPiece color="b" type={t} pieceSet={config.pieceSet} customPath={config.customPiecePath} />
                    </div>
                  ))}
                </div>
                <div className="ap-preview-row">
                  {Array(8).fill(null).map((_, i) => (
                    <div key={`e${i}`} className={`ap-preview-sq ${i%2===0 ? 'sl' : 'sd'}`} />
                  ))}
                </div>
                <div className="ap-preview-row">
                  {Array(8).fill(null).map((_, i) => (
                    <div key={`e2${i}`} className={`ap-preview-sq ${i%2===1 ? 'sl' : 'sd'}`} />
                  ))}
                </div>
                <div className="ap-preview-row">
                  {Array(8).fill('p').map((t, i) => (
                    <div key={`wp${i}`} className={`ap-preview-sq ${i%2===0 ? 'sd' : 'sl'}`}>
                      <ChessPiece color="w" type={t} pieceSet={config.pieceSet} customPath={config.customPiecePath} />
                    </div>
                  ))}
                </div>
                <div className="ap-preview-row">
                  {['r','n','b','q','k','b','n','r'].map((t, i) => (
                    <div key={`w${i}`} className={`ap-preview-sq ${(i)%2===1 ? 'sd' : 'sl'}`}>
                      <ChessPiece color="w" type={t} pieceSet={config.pieceSet} customPath={config.customPiecePath} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Board Size ─── */}
          {tab === 'size' && (
            <div className="ap-section">
              <h4 className="ap-section-title">Tamaño del tablero</h4>
              <div className="ap-grid">
                {BOARD_SIZES.map(size => (
                  <button
                    key={size.id}
                    className={`ap-card ${config.boardSize === size.id ? 'ap-card-active' : ''}`}
                    onClick={() => update('boardSize', size.id)}
                  >
                    <div className="ap-card-preview ap-card-preview-size">
                      <div style={{
                        width: size.id === 'auto' ? '80%' : `${Math.min(100, size.value / 6)}%`,
                        height: size.id === 'auto' ? '80%' : `${Math.min(100, size.value / 6)}%`,
                        background: 'linear-gradient(135deg, #f5f2e8 50%, #769656 50%)',
                        borderRadius: 2,
                      }} />
                    </div>
                    <div className="ap-card-info">
                      <span className="ap-card-name">{size.name}</span>
                      <span className="ap-card-desc">{size.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Ambient Theme ─── */}
          {tab === 'ambient' && (
            <div className="ap-section">
              <h4 className="ap-section-title">Tema ambiente</h4>
              <div className="ap-grid">
                {AMBIENT_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    className={`ap-card ${config.ambientTheme === theme.id ? 'ap-card-active' : ''}`}
                    onClick={() => update('ambientTheme', theme.id)}
                  >
                    <div className="ap-card-preview" style={{
                      background: theme.bgImage !== 'none' ? theme.bgImage : theme.color,
                      backgroundColor: theme.color,
                    }} />
                    <div className="ap-card-info">
                      <span className="ap-card-name">{theme.icon} {theme.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Sound Profile ─── */}
          {tab === 'sound' && (
            <div className="ap-section">
              <h4 className="ap-section-title">Perfil de sonido</h4>
              <div className="ap-grid">
                {SOUND_PROFILES.map(sp => (
                  <button
                    key={sp.id}
                    className={`ap-card ${config.soundProfile === sp.id ? 'ap-card-active' : ''}`}
                    onClick={() => update('soundProfile', sp.id)}
                  >
                    <div className="ap-card-preview ap-card-preview-sound">
                      <span style={{ fontSize: '1.5rem' }}>{sp.icon}</span>
                    </div>
                    <div className="ap-card-info">
                      <span className="ap-card-name">{sp.name}</span>
                      <span className="ap-card-desc">{sp.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <h4 className="ap-section-title" style={{ marginTop: 16 }}>Volumen</h4>
              <div className="vol-slider-wrap">
                <span className="vol-icon">🔈</span>
                <input
                  type="range"
                  className="vol-slider"
                  min="0" max="1" step="0.05"
                  value={config.volume}
                  onChange={e => update('volume', parseFloat(e.target.value))}
                />
                <span className="vol-pct">{Math.round(config.volume * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer toggles */}
        <div className="ap-footer">
          <label className="ap-toggle">
            <input
              type="checkbox"
              checked={config.showCoordinates}
              onChange={e => update('showCoordinates', e.target.checked)}
            />
            <span>Coordenadas</span>
          </label>
          <label className="ap-toggle">
            <input
              type="checkbox"
              checked={config.showLegalMoves}
              onChange={e => update('showLegalMoves', e.target.checked)}
            />
            <span>Movimientos legales</span>
          </label>
          <label className="ap-toggle">
            <input
              type="checkbox"
              checked={config.pieceAnimation}
              onChange={e => update('pieceAnimation', e.target.checked)}
            />
            <span>Animaciones</span>
          </label>
        </div>
      </div>
    </div>
  )
}
