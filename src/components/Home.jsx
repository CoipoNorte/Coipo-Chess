import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './Home.css'

const GAME_MODES = [
  // ─── ONLINE ───
  {
    id: 'pvp',
    icon: '👥',
    title: '1 vs 1 Online',
    description: 'Partida en vivo contra otro jugador. Comparte el código de sala y juega.',
    color: '#4CAF50',
    route: '/lobby/pvp',
    badge: 'P2P',
    section: 'online',
  },
  {
    id: 'blind',
    icon: '🕶️',
    title: 'Modo A Ciegas',
    description: 'Solo tú ves tus piezas. El rival ve peones genéricos. Estrategia pura.',
    color: '#9C27B0',
    route: '/lobby/blind',
    badge: 'Sigilo',
    section: 'online',
  },
  // ─── INDIVIDUAL ───
  {
    id: 'vspc',
    icon: '🤖',
    title: '1 vs PC',
    description: 'Enfréntate a Stockfish, el motor de ajedrez más potente del mundo.',
    color: '#FF9800',
    route: '/game/vspc',
    badge: 'IA',
    section: 'solo',
  },
  {
    id: 'pc-levels',
    icon: '🎯',
    title: 'PC por Niveles',
    description: 'Fácil, Medio o Difícil. Elige tu reto y demuestra tu habilidad.',
    color: '#F44336',
    route: '/game/pc-levels',
    badge: '3 niveles',
    section: 'solo',
  },
  {
    id: 'solo',
    icon: '🧠',
    title: 'Contra ti mismo',
    description: 'Juega ambos bandos. Ideal para analizar aperturas y mejorar.',
    color: '#2979FF',
    route: '/game/solo',
    badge: 'Práctica',
    section: 'solo',
  },
  // ─── PUZZLES ───
  {
    id: 'puzzle',
    icon: '🧩',
    title: 'Puzzles Infinitos',
    description: 'Resuelve tácticas infinitas como Lichess. Bifurcaciones, pinzas, mates y más.',
    color: '#00BCD4',
    route: '/puzzle',
    badge: '∞',
    section: 'puzzle',
  },
]

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-hero-icon">
          <span className="hero-chess-piece">♚</span>
          <span className="hero-glow" />
        </div>
        <h2 className="home-hero-title">Coipo Chess</h2>
        <p className="home-hero-subtitle">
          Ajedrez online moderno. Sin registro, sin servidores, con motor Stockfish.
        </p>
        <div className="home-hero-features">
          <span className="hero-feature">✦ P2P</span>
          <span className="hero-feature">✦ Stockfish</span>
          <span className="hero-feature">✦ Gratis</span>
        </div>
      </div>

      <div className="home-modes">
        {/* ═══ ONLINE ═══ */}
        <div className="modes-header">
          <span className="modes-header-line" />
          <span className="modes-header-text">🟢 ONLINE</span>
          <span className="modes-header-line" />
        </div>
        <div className="home-modes-grid">
          {GAME_MODES.filter(m => m.section === 'online').map((mode) => (
            <button
              key={mode.id}
              className="mode-card"
              style={{ '--mode-color': mode.color }}
              onClick={() => navigate(mode.route)}
            >
              <div className="mode-card-accent" />
              <div className="mode-card-icon" style={{ background: `${mode.color}18` }}>
                <span>{mode.icon}</span>
              </div>
              <div className="mode-card-content">
                <div className="mode-card-header">
                  <h4 className="mode-card-title">{mode.title}</h4>
                  <span className="mode-card-badge" style={{ background: `${mode.color}22`, color: mode.color }}>
                    {mode.badge}
                  </span>
                </div>
                <p className="mode-card-description">{mode.description}</p>
              </div>
              <div className="mode-card-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* ═══ INDIVIDUAL ═══ */}
        <div className="modes-header">
          <span className="modes-header-line" />
          <span className="modes-header-text">🤖 INDIVIDUAL</span>
          <span className="modes-header-line" />
        </div>
        <div className="home-modes-grid">
          {GAME_MODES.filter(m => m.section === 'solo').map((mode) => (
            <button
              key={mode.id}
              className="mode-card"
              style={{ '--mode-color': mode.color }}
              onClick={() => navigate(mode.route)}
            >
              <div className="mode-card-accent" />
              <div className="mode-card-icon" style={{ background: `${mode.color}18` }}>
                <span>{mode.icon}</span>
              </div>
              <div className="mode-card-content">
                <div className="mode-card-header">
                  <h4 className="mode-card-title">{mode.title}</h4>
                  <span className="mode-card-badge" style={{ background: `${mode.color}22`, color: mode.color }}>
                    {mode.badge}
                  </span>
                </div>
                <p className="mode-card-description">{mode.description}</p>
              </div>
              <div className="mode-card-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* ═══ PUZZLES ═══ */}
        <div className="modes-header">
          <span className="modes-header-line" />
          <span className="modes-header-text">🧩 PUZZLES</span>
          <span className="modes-header-line" />
        </div>
        <div className="home-modes-grid">
          {GAME_MODES.filter(m => m.section === 'puzzle').map((mode) => (
            <button
              key={mode.id}
              className="mode-card"
              style={{ '--mode-color': mode.color }}
              onClick={() => navigate(mode.route)}
            >
              <div className="mode-card-accent" />
              <div className="mode-card-icon" style={{ background: `${mode.color}18` }}>
                <span>{mode.icon}</span>
              </div>
              <div className="mode-card-content">
                <div className="mode-card-header">
                  <h4 className="mode-card-title">{mode.title}</h4>
                  <span className="mode-card-badge" style={{ background: `${mode.color}22`, color: mode.color }}>
                    {mode.badge}
                  </span>
                </div>
                <p className="mode-card-description">{mode.description}</p>
              </div>
              <div className="mode-card-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="home-howto">
        <div className="modes-header">
          <span className="modes-header-line" />
          <span className="modes-header-text">CÓMO JUGAR</span>
          <span className="modes-header-line" />
        </div>

        <div className="howto-grid">
          <div className="howto-card">
            <div className="howto-steps">
              <div className="howto-step">
                <span className="howto-num">1</span>
                <div className="howto-step-text">
                  <strong>Crea una sala</strong>
                  <span>Elige "1 vs 1 Online" o "Modo A Ciegas" y toca Crear Sala</span>
                </div>
              </div>
              <div className="howto-step">
                <span className="howto-num">2</span>
                <div className="howto-step-text">
                  <strong>Comparte el código</strong>
                  <span>Copia el código y envíalo por WhatsApp, Telegram o como quieras</span>
                </div>
              </div>
              <div className="howto-step">
                <span className="howto-num">3</span>
                <div className="howto-step-text">
                  <strong>Tu rival se une</strong>
                  <span>Tu oponente entra con el código y la partida comienza automáticamente</span>
                </div>
              </div>
            </div>
          </div>

          <div className="howto-card">
            <div className="howto-steps">
              <div className="howto-step">
                <span className="howto-num">🖱</span>
                <div className="howto-step-text">
                  <strong>Mover piezas</strong>
                  <span>Haz clic en una pieza para ver sus movimientos legales, o arrástrala directamente</span>
                </div>
              </div>
              <div className="howto-step">
                <span className="howto-num">👑</span>
                <div className="howto-step-text">
                  <strong>Promoción de peón</strong>
                  <span>Al llegar a la última fila, elige: Dama, Torre, Alfil o Caballo</span>
                </div>
              </div>
              <div className="howto-step">
                <span className="howto-num">↩</span>
                <div className="howto-step-text">
                  <strong>Deshacer jugada</strong>
                  <span>En modos locales, toca ↩ para retroceder una jugada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">🔗</div>
          <div className="feature-text">
            <strong>Conexión directa</strong>
            <span>Peer-to-peer sin servidores intermedios</span>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">♚</div>
          <div className="feature-text">
            <strong>Stockfish Engine</strong>
            <span>Motor de ajedrez profesional integrado</span>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <div className="feature-text">
            <strong>Diseño premium</strong>
            <span>Paleta única con acabados glassmorphism</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
