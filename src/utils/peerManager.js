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
    this.onDataCallback = null;
    this.onConnectedCallback = null;
    this.onDisconnectedCallback = null;
    this.onErrorCallback = null;
  }

  normalizeId(id) {
    return String(id || '').trim();
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
      this.isHost = true;
      this._initPeer();

      this.peer.on('open', (id) => {
        const normalizedId = this.normalizeId(id);
        this.myId = normalizedId;
        resolve(normalizedId);
      });

      this.peer.on('connection', (conn) => {
        this._handleConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        this.onErrorCallback?.(err);
        reject(err);
      });
    });
  }

  /**
   * Se une a una sala existente (modo invitado)
   * @param {string} hostId - El PeerID del anfitrión
   * @returns {Promise<void>}
   */
  joinRoom(hostId) {
    const hostIdCandidates = this.buildPeerIdCandidates(hostId);

    return new Promise((resolve, reject) => {
      this.isHost = false;
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
          this.onErrorCallback?.(err);
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
        tryNextConnection();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
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
    this.connection = conn;
    this.connected = true;

    conn.on('open', () => {
      this.onConnectedCallback?.();
    });

    if (conn.open) {
      this.onConnectedCallback?.();
    }

    conn.on('data', (data) => {
      this.onDataCallback?.(data);
    });

    conn.on('close', () => {
      this.connected = false;
      this.onDisconnectedCallback?.();
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      this.onErrorCallback?.(err);
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
  onData(callback) {
    this.onDataCallback = callback;
  }

  /**
   * Callback cuando se conecta un peer
   */
  onConnected(callback) {
    this.onConnectedCallback = callback;
    if (this.connection?.open) {
      callback();
    }
  }

  /**
   * Callback cuando se desconecta
   */
  onDisconnected(callback) {
    this.onDisconnectedCallback = callback;
  }

  /**
   * Callback para errores
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * Cierra la conexión y libera recursos
   */
  disconnect() {
    if (this.connection) {
      this.connection.close();
    }
    if (this.peer) {
      this.peer.destroy();
    }
    this.connected = false;
    this.isHost = false;
    this.myId = null;
    this.connection = null;
    this.peer = null;
  }
}

export default PeerManager;
