# ♟️ [Coipo Chess — Ajedrez Online](https://CoipoNorte.github.io/Coipo-Chess)

**Coipo Chess** es una plataforma de ajedrez online que funciona **sin servidores propios**, usando conexiones peer-to-peer (P2P) vía **PeerJS** sobre WebRTC, con **Stockfish** como motor de IA integrado. Desplegable en **GitHub Pages** con un solo comando.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![PeerJS](https://img.shields.io/badge/PeerJS-1.5-3E84BE)
![Stockfish](https://img.shields.io/badge/Stockfish-10-important)

---

## ✨ Modos de Juego

| Modo | Descripción | Conexión |
|------|-------------|----------|
| **👥 1 vs 1 Online** | Dos jugadores humanos, cada uno en su PC. Comparte código de sala. | P2P (PeerJS) |
| **🕶️ Modo A Ciegas** | Como el 1v1, pero las piezas del rival son peones genéricos. ¡Estrategia pura! | P2P (PeerJS) |
| **🤖 1 vs PC** | Juegas contra Stockfish, el motor de ajedrez más potente. | Local |
| **🎯 PC por Niveles** | 3 niveles: Fácil (depth 4), Medio (depth 10), Difícil (depth 18). | Local |
| **🧠 Contra ti mismo** | Juegas ambos bandos. Ideal para practicar aperturas. | Local |

---

## 🎨 Paleta de Colores

```
Casillas claras   → #F5F5DC  (Beige suave)
Casillas oscuras  → #2F4F4F  (Gris verdoso profundo)
Piezas claras     → #FFFFFF  (Blanco puro)
Piezas oscuras    → #1C1C1C  (Negro carbón)
Resaltos          → #FFD700  (Dorado brillante)
Última jugada     → #FF4500  (Naranja intenso)
Jaque             → #DC143C  (Rojo carmesí)
Fondo             → #0D0D0D  (Casi negro)
```

**Estilo**: Glassmorphism, gradientes sutiles, sombras premium, diseño minimalista gaming.

---

## 🏗️ Arquitectura

```
GitHub Pages (CDN)              PeerJS Broker (0.peerjs.com)
┌─────────────────────┐         ┌──────────────────────┐
│   Coipo Chess SPA   │ ◄─────► │  Señalización P2P    │
│   ┌───────────────┐ │         └──────────────────────┘
│   │  React 19     │ │                    │
│   │  PeerJS       │ │◄════ WebRTC ════► │ Otro navegador
│   │  Stockfish.js │ │   (datos directos) │
│   │  chess.js     │ │                    │
│   └───────────────┘ │
└─────────────────────┘
```

---

## 🔧 Instalación

```bash
git clone https://github.com/TU-USUARIO/coipo-chess.git
cd coipo-chess
npm install
npm run dev        # http://localhost:5173
```

## 🚀 Despliegue

```bash
npm run build
npm run deploy     # GitHub Pages automático
```

### Configuración necesaria:

1. **`vite.config.js`** → `base: '/TU-REPO/'`
2. **`package.json`** → `"homepage": "https://TU-USUARIO.github.io/TU-REPO"`
3. **`public/favicon.png`** → tu favicon personalizado

---

## 🧠 Motor de IA (Stockfish)

La IA usa **Stockfish.js** cargado vía Web Worker desde CDN:

| Nivel | Depth | Descripción |
|-------|-------|-------------|
| 🟢 Fácil | 4 | Errores ocasionales, ideal para principiantes |
| 🟡 Medio | 10 | Juego sólido, buen nivel de club |
| 🔴 Difícil | 18 | Juego preciso, castiga cada error |

*Si Stockfish no está disponible, el sistema cae en un motor heurístico de respaldo.*

---

## 📁 Estructura

```
coipo-chess/
├── public/
│   ├── favicon.png
│   └── _redirects
├── src/
│   ├── components/
│   │   ├── Home.jsx/css     ← Inicio con 5 modos
│   │   ├── Lobby.jsx/css    ← Sala de conexión P2P
│   │   ├── Game.jsx/css     ← Orquestador de partidas
│   │   └── Board.jsx/css    ← Tablero interactivo
│   ├── utils/
│   │   ├── chessEngine.js   ← chess.js wrapper
│   │   ├── peerManager.js   ← PeerJS manager
│   │   ├── aiPlayer.js      ← Stockfish + fallback
│   │   └── blindMode.js     ← Lógica modo ciegas
│   ├── styles/theme.css     ← Paleta de colores
│   ├── App.jsx/css
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔜 Roadmap

- [x] Modo 1vs1 Online (PeerJS)
- [x] Modo A Ciegas
- [x] Modo vs PC (Stockfish)
- [x] PC por niveles
- [x] Modo solo (ambos bandos)
- [x] Drag & drop nativo
- [x] Diálogo de promoción
- [x] Sonidos vía Web Audio API
- [ ] Reloj de ajedrez
- [ ] Chat en sala
- [ ] Exportar PGN
- [ ] Animaciones de captura
- [ ] Análisis post-partida

---

## 📄 Licencia

MIT — Hecho con ♟️ para la comunidad ajedrecística.
