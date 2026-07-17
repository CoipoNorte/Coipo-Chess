import { Routes, Route, Link } from 'react-router-dom'
import Home from './components/Home'
import Lobby from './components/Lobby'
import Game from './components/Game'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <Link to="/" className="app-logo-link">
            <span className="app-logo-icon">♟</span>
            <h1>Coipo Chess</h1>
          </Link>
        </div>
        <nav className="app-nav">
          <Link to="/" className="nav-link">Inicio</Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:mode" element={<Lobby />} />
          <Route path="/game/:mode" element={<Game />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>Coipo Chess &copy; {new Date().getFullYear()} — Ajedrez P2P sin servidores</p>
      </footer>
    </div>
  )
}

export default App
