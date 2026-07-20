import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Home.css'

const MODES = [
  // ─── INDIVIDUAL ───
  {
    id: 'vspc', icon: '🤖', title: 'vs PC',
    desc: 'Enfréntate a Stockfish, el motor de ajedrez más potente. Elige color y dificultad.',
    color: '#FF9800', rgb: '255,152,0', route: '/lobby/vspc', badge: 'IA', section: 'solo',
  },
  {
    id: 'solo', icon: '🧠', title: 'Vs Ti Mismo',
    desc: 'Juega ambos bandos. Ideal para analizar aperturas y mejorar.',
    color: '#2979FF', rgb: '41,121,255', route: '/game/solo', badge: 'Práctica', section: 'solo',
  },
  // ─── ONLINE ───
  {
    id: 'pvp', icon: '👥', title: '1 vs 1 Online',
    desc: 'Partida en vivo P2P. Crea sala, comparte el código y juega.',
    color: '#4CAF50', rgb: '76,175,80', route: '/lobby/pvp', badge: 'P2P', section: 'online',
  },
  {
    id: 'blind', icon: '🕶️', title: 'A Ciegas',
    desc: 'Solo tú ves tus piezas. El rival ve peones genéricos. Estrategia pura.',
    color: '#9C27B0', rgb: '156,39,176', route: '/lobby/blind', badge: 'Sigilo', section: 'online',
  },
  // ─── EXTRAS ───
  {
    id: 'puzzle', icon: '🧩', title: 'Puzzles',
    desc: 'Tácticas infinitas. Bifurcaciones, clavadas, mates y más.',
    color: '#00BCD4', rgb: '0,188,212', route: '/puzzle', badge: '∞', section: 'puzzle',
  },
]

const SECTIONS = [
  { key: 'solo',  icon: '🎯', label: 'Individuales' },
  { key: 'online',icon: '👥', label: 'Online' },
  { key: 'puzzle',icon: '🧩', label: 'Extras' },
]

function FloatingPiece({ piece, delay, x, y, size }) {
  return (
    <div
      className="float-piece"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        fontSize: `${size}rem`,
        animationDelay: `${delay}s`,
      }}
    >
      {piece}
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    const handleMouse = (e) => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div className="home">
      {/* ═══ HERO ═══ */}
      <div className="home-hero" ref={heroRef}>
        {/* Piezas flotantes */}
        <FloatingPiece piece="♚" delay={0} x={8} y={12} size={2.2} />
        <FloatingPiece piece="♛" delay={1.5} x={85} y={8} size={1.8} />
        <FloatingPiece piece="♝" delay={3} x={92} y={65} size={1.4} />
        <FloatingPiece piece="♞" delay={0.8} x={5} y={72} size={1.6} />
        <FloatingPiece piece="♜" delay={2.2} x={78} y={78} size={1.5} />

        <div className="hero-bg-glow" style={{
          transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
        }} />

        <div className="hero-content">
          <div className="hero-icon-wrap">
            <span className="hero-icon">♟</span>
            <span className="hero-ring" />
            <span className="hero-ring hero-ring--2" />
          </div>
          <h1 className="hero-title">Coipo Chess</h1>
          <p className="hero-sub">
            Ajedrez moderno <span className="hero-hl">sin registro</span>,{' '}
            <span className="hero-hl">sin servidores</span>, con{' '}
            <span className="hero-hl">Stockfish</span>
          </p>
          <div className="hero-badges">
            <span className="hero-badge">✦ P2P</span>
            <span className="hero-badge">✦ Stockfish</span>
            <span className="hero-badge">✦ Gratis</span>
          </div>
          <button className="hero-cta" onClick={() => navigate('/game/vspc')}>
            <span>Jugar vs PC</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ═══ MODOS DE JUEGO ═══ */}
      <div className="home-modes">
        {SECTIONS.map((sec, si) => (
          <div key={sec.key} className="modes-block" style={{ '--i': si }}>
            <div className="modes-head">
              <span className="modes-head-icon">{sec.icon}</span>
              <span className="modes-head-t">{sec.label}</span>
              <span className="modes-head-l" />
            </div>

            <div className="modes-grid">
              {MODES.filter(m => m.section === sec.key).map((mode, mi) => (
                <button
                  key={mode.id}
                  className={`mode-c ${hoveredCard === mode.id ? 'mode-c--hov' : ''}`}
                  style={{ '--c': mode.color, '--c-rgb': mode.rgb, '--i': mi }}
                  onClick={() => navigate(mode.route)}
                  onMouseEnter={() => setHoveredCard(mode.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Gradient border */}
                  <div className="mode-c-border" />

                  {/* Icon */}
                  <div className="mode-c-icon" style={{ background: `${mode.color}14` }}>
                    <span>{mode.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="mode-c-body">
                    <div className="mode-c-top">
                      <span className="mode-c-title">{mode.title}</span>
                      <span className="mode-c-badge" style={{ background: `${mode.color}20`, color: mode.color }}>
                        {mode.badge}
                      </span>
                    </div>
                    <p className="mode-c-desc">{mode.desc}</p>
                  </div>

                  {/* Arrow */}
                  <div className="mode-c-arr">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Shine effect */}
                  <div className="mode-c-shine" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ CÓMO JUGAR ═══ */}
      <div className="home-guide">
        <div className="modes-head">
          <span className="modes-head-icon">📖</span>
          <span className="modes-head-t">Cómo Jugar</span>
          <span className="modes-head-l" />
        </div>

        <div className="guide-grid">
          <div className="guide-c">
            <div className="guide-steps">
              {[
                { num: '1', icon: '🏠', title: 'Elige un modo', desc: 'Selecciona entre vs PC, Online, Puzzles o practica solo' },
                { num: '2', icon: '🔗', title: 'Comparte (si es Online)', desc: 'Crea sala y envía el código por WhatsApp o Telegram' },
                { num: '3', icon: '♟', title: '¡Juega!', desc: 'Toca o arrastra piezas. La partida empieza al instante' },
              ].map((s, i) => (
                <div key={i} className="guide-step">
                  <span className="guide-num" style={{ '--i': i }}>{s.icon}</span>
                  <div className="guide-step-t">
                    <strong>{s.title}</strong>
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="guide-c">
            <div className="guide-steps">
              {[
                { num: '🖱', icon: '🖱', title: 'Mover piezas', desc: 'Clic para seleccionar, clic en destino. O arrastra directamente' },
                { num: '👑', icon: '👑', title: 'Promoción', desc: 'Al llegar al final elige: Dama, Torre, Alfil o Caballo' },
                { num: '↩', icon: '↩', title: 'Deshacer', desc: 'En modos locales, deshace tu última jugada' },
              ].map((s, i) => (
                <div key={i} className="guide-step">
                  <span className="guide-num" style={{ '--i': i }}>{s.icon}</span>
                  <div className="guide-step-t">
                    <strong>{s.title}</strong>
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <div className="home-feat">
        {[
          { icon: '🔗', title: 'Conexión directa', desc: 'Peer-to-peer sin servidores' },
          { icon: '♚', title: 'Stockfish Engine', desc: 'Motor profesional integrado' },
          { icon: '🎨', title: 'Diseño premium', desc: 'Glassmorphism y temas' },
          { icon: '🌐', title: 'Sin registro', desc: 'Juega al instante' },
        ].map((f, i) => (
          <div key={i} className="feat-c" style={{ '--i': i }}>
            <span className="feat-icon">{f.icon}</span>
            <div className="feat-t">
              <strong>{f.title}</strong>
              <span>{f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="home-footer">
        <span>Coipo Chess · Ajedrez P2P gratuito</span>
      </div>
    </div>
  )
}

export default Home
