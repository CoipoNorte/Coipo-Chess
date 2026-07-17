import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PeerManager from '../utils/peerManager'
import './Lobby.css'

function Lobby() {
  const { mode } = useParams()
  const navigate = useNavigate()
  const peerRef = useRef(null)
  const [view, setView] = useState('select')
  const [roomId, setRoomId] = useState('')
  const [joinInput, setJoinInput] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [, setPlayerColor] = useState(null)

  const isBlindMode = mode === 'blind'

  useEffect(() => {
    return () => peerRef.current?.disconnect()
  }, [])

  const handleCreateRoom = async () => {
    setView('creating')
    setStatusMessage('Iniciando conexión...')
    setError('')

    const pm = new PeerManager()
    peerRef.current = pm

    try {
      const id = await pm.createRoom()
      setRoomId(id)
      setView('created')
      setPlayerColor('w')

      pm.onConnected(() => {
        setView('connected')
        setTimeout(() => {
          navigate(`/game/${mode}`, {
            state: { peerManager: pm, playerColor: 'w', isHost: true, isBlindMode, roomId: id },
          })
        }, 800)
      })

      pm.onData((data) => {
        if (data.type === 'JOIN') pm.send({ type: 'JOIN_ACK', color: 'b' })
      })

      pm.onError((err) => setError(`Error: ${err.message || 'Conexión fallida'}`))
    } catch (err) {
      setError(`Error al crear sala: ${err.message}`)
      setView('select')
    }
  }

  const handleJoinRoom = async () => {
    const code = joinInput.trim().toUpperCase()
    if (!code) { setError('Ingresa un código de sala'); return }

    setView('joining')
    setStatusMessage('Conectando...')
    setError('')

    const pm = new PeerManager()
    peerRef.current = pm

    try {
      await pm.joinRoom(code)
      setView('connecting')

      pm.send({ type: 'JOIN' })

      pm.onConnected(() => {
        setView('connected')
        setTimeout(() => {
          navigate(`/game/${mode}`, {
            state: { peerManager: pm, playerColor: 'b', isHost: false, isBlindMode, roomId: code },
          })
        }, 800)
      })

      pm.onData((data) => {
        if (data.type === 'JOIN_ACK') setPlayerColor(data.color || 'b')
      })

      pm.onError((err) => {
        setError(`Error: ${err.message || 'Código inválido'}`)
        setView('join')
      })
    } catch (err) {
      setError(`Error: ${err.message}`)
      setView('join')
    }
  }

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setStatusMessage('¡Copiado!')
    setTimeout(() => setStatusMessage('Esperando oponente...'), 1500)
  }

  const modeName = isBlindMode ? 'Modo A Ciegas 🕶️' : 'Modo Online 👥'
  const shareText = `♟️ ¡Juega ajedrez conmigo en ${modeName}!\n\nÚnete a mi sala en Coipo Chess:\n\n🔑 Código: ${roomId}\n\n▶️ Entra aquí: ${window.location.origin}\n\nEspero tu movimiento! 🎮`

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`, '_blank')
  }

  const handleCancel = () => {
    peerRef.current?.disconnect()
    setView('select')
    setError('')
    setStatusMessage('')
  }

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h2 className="lobby-title">
          {isBlindMode ? '🕶️' : '👥'} {isBlindMode ? 'Modo A Ciegas' : 'Modo Online'}
        </h2>
        <p className="lobby-subtitle">
          {isBlindMode
            ? 'Oculta tus piezas al rival en este desafiante modo'
            : 'Conéctate directamente con otro jugador vía P2P'}
        </p>
      </div>

      <div className="lobby-card">
        {view === 'select' && (
          <div className="lobby-options">
            <button className="lobby-btn lobby-btn-create" onClick={handleCreateRoom}>
              <span className="lobby-btn-icon">🏠</span>
              <span className="lobby-btn-label">Crear Sala</span>
              <span className="lobby-btn-desc">Sé el anfitrión y comparte el código</span>
            </button>

            <div className="lobby-divider">
              <span>o</span>
            </div>

            <div className="lobby-join-form">
              <input
                type="text"
                placeholder="Código de sala..."
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                maxLength={20}
                autoFocus
              />
              <button className="lobby-btn lobby-btn-join" onClick={handleJoinRoom}>
                🔗 Unirse
              </button>
            </div>
          </div>
        )}

        {(view === 'creating' || view === 'joining') && (
          <div className="lobby-status">
            <div className="lobby-spinner" />
            <p>{view === 'creating' ? 'Creando sala segura...' : 'Conectando...'}</p>
            <p className="lobby-status-sub">{statusMessage}</p>
          </div>
        )}

        {view === 'created' && (
          <div className="lobby-room">
            <div className="room-id-box" onClick={handleCopyRoomId}>
              <span className="room-label">Código de sala</span>
              <div className="room-id">{roomId}</div>
              <span className="room-copy">📋 Toca para copiar</span>
            </div>

            <div className="room-share-row">
              <button className="lobby-btn-whatsapp" onClick={handleShareWhatsApp}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button className="lobby-btn-telegram" onClick={handleShareTelegram}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Telegram
              </button>
            </div>

            <div className="room-waiting">
              <div className="room-dots">
                <span className="rdot" /><span className="rdot" /><span className="rdot" />
              </div>
              <p className="room-status">{statusMessage || 'Esperando oponente...'}</p>
            </div>

            <button className="lobby-btn lobby-btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        )}

        {view === 'connecting' && (
          <div className="lobby-status">
            <div className="lobby-spinner" />
            <p>Estableciendo conexión P2P...</p>
            <p className="lobby-status-sub">Esto puede tomar unos segundos</p>
          </div>
        )}

        {view === 'connected' && (
          <div className="lobby-status">
            <div className="connected-check">✓</div>
            <p>¡Conexión establecida!</p>
            <p className="lobby-status-sub">Iniciando partida...</p>
          </div>
        )}

        {error && (
          <div className="lobby-error">
            <span className="error-icon">⚠️</span>
            <p className="error-text">{error}</p>
            <button className="lobby-btn lobby-btn-retry" onClick={() => { setError(''); setView('select') }}>
              Reintentar
            </button>
          </div>
        )}
      </div>

      <button className="lobby-btn lobby-btn-back" onClick={() => navigate('/')}>
        ← Volver
      </button>
    </div>
  )
}

export default Lobby
