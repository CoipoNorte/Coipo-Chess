import { Routes, Route, Link } from 'react-router-dom'
import Home from './components/Home'
import Lobby from './components/Lobby'
import Game from './components/Game'
import Puzzle from './components/Puzzle'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <div className="app">
      <aside className="app-sidebar">
        <div className="app-logo">
          <Link to="/" className="app-logo-link">
            <span className="app-logo-icon">♟</span>
            <h1>Coipo Chess</h1>
          </Link>
        </div>
        <nav className="app-nav-vertical">
          <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/lobby/vspc" className="nav-link">vs PC</Link>
          <Link to="/lobby/solo" className="nav-link">Solo</Link>
          <Link to="/lobby/pvp" className="nav-link">Online</Link>
          <Link to="/puzzle" className="nav-link">Puzzle</Link>
        </nav>
        <div className="sidebar-spacer" />
        <footer className="app-sidebar-footer">
          <p>© {new Date().getFullYear()}</p>
        </footer>
      </aside>

      <main className="app-main">
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
