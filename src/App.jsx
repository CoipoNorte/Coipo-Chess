import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './components/Home'
import Lobby from './components/Lobby'
import Game from './components/Game'
import Puzzle from './components/Puzzle'
import ErrorBoundary from './components/ErrorBoundary'
import { getCustomizationConfig } from './utils/customization'
import './App.css'

/* ─── Sidebar: categorías con sus modos ─── */
const NAV = [
  { to: '/', icon: '♟',  label: 'Inicio' },
]

const SECTIONS = [
  {
    title: 'Individuales',
    items: [
      { to: '/lobby/vspc',      icon: '🤖', label: 'vs PC' },
      { to: '/lobby/solo',      icon: '🧠', label: 'Solo' },
    ],
  },
  {
    title: 'Online',
    items: [
      { to: '/lobby/pvp',  icon: '👥',  label: 'Online' },
      { to: '/lobby/blind',icon: '🕶️', label: 'A Ciegas' },
    ],
  },
  {
    title: 'Extras',
    items: [
      { to: '/puzzle', icon: '🧩', label: 'Puzzles' },
    ],
  },
]

function App() {
  const loc = useLocation()
  const [open, setOpen] = useState(true)
  const [mobile, setMobile] = useState(false)

  const [boardSize, setBoardSize] = useState(() => getCustomizationConfig().boardSize || 'auto')

  useEffect(() => { setMobile(false) }, [loc.pathname])

  // Listen for customization changes
  useEffect(() => {
    const handler = () => {
      const cfg = getCustomizationConfig()
      setBoardSize(cfg.boardSize || 'auto')
    }
    window.addEventListener('coipo-config-changed', handler)
    return () => window.removeEventListener('coipo-config-changed', handler)
  }, [])

  /* Detecta ruta activa — también coincide /game/:mode con su lobby correspondiente */
  const isActive = (path) => {
    if (path === '/') return loc.pathname === '/'
    if (loc.pathname.startsWith(path)) return true
    // Si estamos en /game/:mode, extrae el modo y busca match
    const gameMatch = loc.pathname.match(/^\/game\/(\w+)/)
    if (gameMatch) {
      const mode = gameMatch[1]
      return path === `/lobby/${mode}`
    }
    return false
  }

  return (
    <div className="app">
      {/* ─── Sidebar ─── */}
      <aside className={`side ${open ? '' : 'side--cl'} ${mobile ? 'side--mo' : ''}`}>
        {/* Logo */}
        <div className="side-top">
          <Link to="/" className="side-logo" onClick={() => setMobile(false)}>
            <span className="side-logo-i">♟</span>
            <span className="side-logo-t">Coipo Chess</span>
          </Link>
        </div>

        {/* Navegación */}
        <nav className="side-nav">
          {/* Inicio siempre arriba */}
          {NAV.map(n => (
            <Link
              key={n.to}
              to={n.to}
              className={`side-lk ${isActive(n.to) ? 'side-lk--on' : ''}`}
              onClick={() => setMobile(false)}
            >
              <span className="side-lk-i">{n.icon}</span>
              <span className="side-lk-l">{n.label}</span>
              {isActive(n.to) && <span className="side-lk-dot" />}
            </Link>
          ))}

          {/* Categorías de juego */}
          {SECTIONS.map(sec => (
            <div key={sec.title} className="side-sec">
              <span className="side-sec-t">{sec.title}</span>
              {sec.items.map(n => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`side-lk ${isActive(n.to) ? 'side-lk--on' : ''}`}
                  onClick={() => setMobile(false)}
                >
                  <span className="side-lk-i">{n.icon}</span>
                  <span className="side-lk-l">{n.label}</span>
                  {isActive(n.to) && <span className="side-lk-dot" />}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Spacer */}
        <div className="side-sp" />

        {/* Footer + collapse */}
        <div className="side-ft">
          <div className="side-ft-i">
            <span className="side-ft-t">Coipo Chess</span>
            <span className="side-ft-v">v1.0</span>
          </div>
          <button className="side-tog" onClick={() => setOpen(!open)} aria-label="Colapsar menú">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={open ? 'M5 2L10 7L5 12' : 'M9 2L4 7L9 12'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {mobile && <div className="side-ov" onClick={() => setMobile(false)} />}

      {/* Hamburguesa móvil */}
      <button className="side-ham" onClick={() => setMobile(true)} aria-label="Abrir menú">
        <span /><span /><span />
      </button>

      {/* ─── Contenido principal ─── */}
      <main className={`main ${boardSize && boardSize !== 'auto' ? `board-size-${boardSize}` : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:mode" element={<Lobby />} />
          <Route path="/game/:mode" element={<ErrorBoundary><Game /></ErrorBoundary>} />
          <Route path="/puzzle" element={<Puzzle />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
