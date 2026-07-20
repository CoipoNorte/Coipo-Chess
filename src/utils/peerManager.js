/**
 * 🔗 Gestor de Conexiones PeerJS
 * 
 * Maneja la conexión P2P entre dos jugadores usando WebRTC via PeerJS.
 * No requiere servidor backend propio - usa el broker público de PeerJS.
 */
import Peer from 'peerjs';

class PeerManager {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.isHost = false;
    this.myId = null;
    this.connected = false;
    this.opening = false;
    this.onDataCallbacks = [];
    this.onConnectedCallbacks = [];
    this.onDisconnectedCallbacks = [];
    this.onErrorCallbacks = [];
    this._heartbeatInterval = null;
    this._lastPongTime = Date.now();
    this._heartbeatTimedOut = false;
    this._hostId = null; // store host/remote PeerID for auto-reconnect
    this._guestId = null; // for host: store guest's PeerID for auto-reconnect
  }

  isConnected() {
    return this.connected && this.connection?.open === true
  }

  normalizeId(id) {
    return String(id || '').trim();
  }

  resolveRoomCode(idOrUrl) {
    const raw = this.normalizeId(idOrUrl)
    if (!raw) return ''

    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw)
        const fromSearch = url.searchParams.get('room')
        if (fromSearch) return this.normalizeId(fromSearch)
        const hashMatch = url.hash?.match(/[?&]room=([^&#]+)/i)
        if (hashMatch?.[1]) return this.normalizeId(hashMatch[1])
      } catch (e) {
        // Ignore invalid URLs and fall back to the raw input
      }
    }

    const hashMatch = raw.match(/[?&]room=([^&#]+)/i)
    if (hashMatch?.[1]) return this.normalizeId(hashMatch[1])

    return raw
  }

  buildPeerIdCandidates(id) {
    const normalized = this.normalizeId(id)
    const candidates = [normalized]

    if (normalized) {
      candidates.push(normalized.toLowerCase())
      candidates.push(normalized.toUpperCase())
    }

    return [...new Set(candidates.filter(Boolean))]
  }

  /**
   * Crea una sala (modo anfitrión)
   * @returns {Promise<string>} El ID de la sala (PeerID)
   */
  createRoom() {
    return new Promise((resolve, reject) => {
      const attemptCreate = (attempt = 0) => {
        this.isHost = true;
        this.opening = true;
        this._initPeer();

        let settled = false;
        const settle = (fn, value) => {
          if (!settled) {
            settled = true;
            fn(value);
          }
        };

        const handleError = (err) => {
          const message = String(err?.message || err || '');
          const shouldRetry = /server|network|id|unavailable|could not/i.test(message.toLowerCase());
          if (shouldRetry && attempt < 2) {
            this.disconnect();
            window.setTimeout(() => attemptCreate(attempt + 1), 1000 * (attempt + 1));
            return;
          }

          console.error('PeerJS error:', err);
          this.opening = false;
          this._triggerError(err);
          settle(reject, err);
        };

        this.peer.once('open', (id) => {
          const normalizedId = this.normalizeId(id);
          this.myId = normalizedId;
          this.opening = false;
          this._startHeartbeat();
          settle(resolve, normalizedId);
        });

        this.peer.on('connection', (conn) => {
          this._handleConnection(conn);
        });

        this.peer.once('error', handleError);
      };

      attemptCreate();
    });
  }

  /**
   * Se une a una sala existente (modo invitado)
   * @param {string} hostId - El PeerID del anfitrión
   * @returns {Promise<void>}
   */
  joinRoom(hostId) {
    const resolvedHostId = this.resolveRoomCode(hostId);
    const hostIdCandidates = this.buildPeerIdCandidates(resolvedHostId);
    this._hostId = resolvedHostId; // store for auto-reconnect

    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.opening = true;
      this._initPeer();

      let settled = false;
      let attemptIndex = 0;
      let retryCount = 0;
      const maxRetries = 6;

      const resolveOnce = (value) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };

      const rejectOnce = (err) => {
        if (!settled) {
          settled = true;
          this._triggerError(err);
          reject(err);
        }
      };

      const tryNextConnection = () => {
        if (settled) return;

        const candidateId = hostIdCandidates[attemptIndex];
        if (!candidateId) {
          rejectOnce(new Error('No se pudo conectar a la sala. Verifica el código o espera a que el anfitrión esté listo.'));
          return;
        }

        attemptIndex += 1;

        try {
          const conn = this.peer.connect(candidateId, {
            reliable: true,
            serialization: 'json',
          });

          this._handleConnection(conn);

          conn.on('open', () => {
            resolveOnce();
          });

          conn.on('error', (err) => {
            const message = err?.message || '';
            const shouldRetry = /could not connect|peer-unavailable|unavailable|network/i.test(message) || err?.type === 'peer-unavailable';

            if (shouldRetry && retryCount < maxRetries) {
              retryCount += 1;
              conn.close();
              window.setTimeout(() => {
                tryNextConnection();
              }, 1000 * retryCount);
              return;
            }

            rejectOnce(err);
          });
        } catch (err) {
          if (retryCount < maxRetries) {
            retryCount += 1;
            window.setTimeout(() => {
              tryNextConnection();
            }, 1000 * retryCount);
            return;
          }

          rejectOnce(err);
        }
      };

      this.peer.on('open', () => {
        this.opening = false;
        tryNextConnection();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        this.opening = false;
        this._triggerError(err);
        rejectOnce(err);
      });
    });
  }

  /**
   * Inicializa la instancia de Peer
   */
  _initPeer() {
    this.peer = new Peer(undefined, {
      debug: 2, // 0=off, 1=errors, 2=warnings, 3=all
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      path: '/',
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:1934' },
          { urls: 'stun:stun1.l.google.com:1934' },
        ],
      },
    });
  }

  /**
   * Configura una conexión entrante o saliente
   */
  _handleConnection(conn) {
    if (this.connection && this.connection !== conn && this.connection.open) {
      try { this.connection.close(); } catch (e) {}
    }

    this.connection = conn;
    this.connected = Boolean(conn?.open);

    // Store remote peer ID for reconnection
    if (this.isHost && conn.peer) {
      this._guestId = conn.peer
    }

    conn.on('open', () => {
      this.connected = true;
      this._lastPongTime = Date.now();
      this._heartbeatTimedOut = false;
      // On open, also store the remote peer's ID
      if (this.isHost && conn.peer) {
        this._guestId = conn.peer
      }
      this._startHeartbeat();
      this._triggerConnected();
    });

    if (conn.open) {
      this.connected = true;
      this._lastPongTime = Date.now();
      this._heartbeatTimedOut = false;
      this._startHeartbeat();
      this._triggerConnected();
    }

    conn.on('data', (data) => {
      // Handle PONG response internally
      if (data?.type === 'PONG') {
        this._lastPongTime = Date.now()
        this._heartbeatTimedOut = false
        return
      }
      // Handle PING from remote — respond with PONG
      if (data?.type === 'PING') {
        this.send({ type: 'PONG', timestamp: Date.now() })
        return
      }
      // Forward all other data to callbacks
      this._triggerData(data);
    });

    conn.on('close', () => {
      this._stopHeartbeat();
      if (this.connection === conn) {
        this.connection = null;
      }
      this.connected = false;
      this._triggerDisconnected();
      // Auto-reconnect for both host and guest
      this._attemptReconnect()
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      this._stopHeartbeat();
      if (this.connection === conn) {
        this.connection = null;
      }
      this.connected = false;
      this._triggerError(err);
    });
  }

  /**
   * Envía datos al otro jugador
   * @param {object} data - Datos a enviar (debe serializable a JSON)
   * @returns {boolean} - true si se envió correctamente
   */
  send(data) {
    if (this.connection && this.connection.open) {
      this.connection.send(data);
      return true;
    }
    console.warn('No hay conexión activa para enviar datos');
    return false;
  }

  /**
   * Envía un movimiento al rival
   */
  sendMove(move) {
    return this.send({
      type: 'MOVE',
      data: {
        from: move.from,
        to: move.to,
        promotion: move.promotion || null,
        san: move.san || null,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Envía el estado de juego (usado en modo ciegas)
   */
  sendGameState(stateData) {
    return this.send({
      type: 'GAME_STATE',
      data: stateData,
      timestamp: Date.now(),
    });
  }

  /**
   * Envía señal de rendición
   */
  sendResign() {
    return this.send({
      type: 'RESIGN',
      timestamp: Date.now(),
    });
  }

  /**
   * Envía oferta de tablas
   */
  sendDrawOffer() {
    return this.send({
      type: 'DRAW_OFFER',
      timestamp: Date.now(),
    });
  }

  /**
   * Acepta tablas
   */
  sendDrawAccept() {
    return this.send({
      type: 'DRAW_ACCEPT',
      timestamp: Date.now(),
    });
  }

  /**
   * Envía configuración de reloj sincronizada (solo el anfitrión la envía)
   */
  sendClockSync(time, increment) {
    return this.send({
      type: 'CLOCK_SYNC',
      data: { time, increment },
      timestamp: Date.now(),
    });
  }

  /**
   * Envía mensaje de chat
   */
  sendChat(message) {
    return this.send({
      type: 'CHAT',
      data: message,
      timestamp: Date.now(),
    });
  }

  /**
   * Callback para datos recibidos
   */
  _triggerData(data) {
    this.onDataCallbacks.forEach((callback) => callback(data));
  }

  _triggerConnected() {
    this.onConnectedCallbacks.forEach((callback) => callback());
  }

  _triggerDisconnected() {
    this.onDisconnectedCallbacks.forEach((callback) => callback());
  }

  _triggerError(err) {
    this.onErrorCallbacks.forEach((callback) => callback(err));
  }

  onData(callback) {
    this.onDataCallbacks.push(callback);
  }

  /**
   * Callback cuando se conecta un peer
   */
  onConnected(callback) {
    this.onConnectedCallbacks.push(callback);
    if (this.connection?.open) {
      callback();
    }
  }

  /**
   * Callback cuando se desconecta
   */
  onDisconnected(callback) {
    this.onDisconnectedCallbacks.push(callback);
  }

  /**
   * Callback para errores
   */
  onError(callback) {
    this.onErrorCallbacks.push(callback);
  }

  // ─── Heartbeat ───

  _startHeartbeat() {
    this._stopHeartbeat()
    this._lastPongTime = Date.now()
    this._heartbeatTimedOut = false

    this._heartbeatInterval = setInterval(() => {
      if (!this.isConnected()) {
        this._stopHeartbeat()
        return
      }

      // Send PING
      this.send({ type: 'PING', timestamp: Date.now() })

      // Check if we missed too many PONGs (5 second timeout)
      const elapsed = Date.now() - this._lastPongTime
      if (elapsed > 5000 && !this._heartbeatTimedOut) {
        this._heartbeatTimedOut = true
        console.warn('[Heartbeat] No PONG received for 5s — connection may be lost')
        this._triggerDisconnected()

        // Auto-reconnect for both host and guest
        this._attemptReconnect()
      }
    }, 3000)
  }

  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval)
      this._heartbeatInterval = null
    }
  }

  // ─── Auto-reconnect (works for both host and guest) ───

  _attemptReconnect(retries = 3) {
    // Determine the remote peer ID to reconnect to
    const remoteId = this.isHost ? this._guestId : this._hostId
    if (!remoteId || retries <= 0) return

    console.log('[Heartbeat] Attempting reconnect to', remoteId, '(retries left:', retries, ')')

    // Clean up old connection
    try {
      if (this.connection) this.connection.close()
    } catch (e) {}

    try {
      const conn = this.peer.connect(remoteId, {
        reliable: true,
        serialization: 'json',
      })

      this._handleConnection(conn)

      const retryTimeout = setTimeout(() => {
        if (!conn.open) {
          conn.close()
          setTimeout(() => this._attemptReconnect(retries - 1), 2000)
        }
      }, 3000)

      conn.on('open', () => {
        clearTimeout(retryTimeout)
        console.log('[Heartbeat] Reconnected successfully!')
        this._triggerConnected()
      })
    } catch (e) {
      console.warn('[Heartbeat] Reconnect failed:', e)
      setTimeout(() => this._attemptReconnect(retries - 1), 2000)
    }
  }

  /**
   * Cierra la conexión y libera recursos
   */
  disconnect() {
    this._stopHeartbeat()
    try {
      if (this.connection) {
        this.connection.close();
      }
    } catch (e) {}
    try {
      if (this.peer) {
        this.peer.destroy();
      }
    } catch (e) {}
    this.connected = false;
    this.opening = false;
    this.isHost = false;
    this.myId = null;
    this.connection = null;
    this.peer = null;
    this._hostId = null;
    this._guestId = null;
  }
}

export default PeerManager;
