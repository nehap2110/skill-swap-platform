import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null

/**
 * Connect (or reconnect) the socket with the current JWT.
 * Called once after a successful login; the singleton is reused everywhere.
 */
export function connectSocket(token) {
  if (socket?.connected) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    timeout: 10000,
  })

  socket.on('connect', () => {
    if (import.meta.env.DEV) console.log('[Socket] connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    if (import.meta.env.DEV) console.warn('[Socket] connect_error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    if (import.meta.env.DEV) console.log('[Socket] disconnected:', reason)
  })

  socket.on('error', (err) => {
    if (import.meta.env.DEV) console.warn('[Socket] server error:', err?.message)
  })

  return socket
}

/** Gracefully tear down the connection (on logout). */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/** Returns the current socket instance (may be null if not connected). */
export function getSocket() {
  return socket
}

// ── Convenience wrappers for the events our backend supports ─────────────────

/**
 * Join a swap chat room.
 * Backend event: 'join_room'  →  emits 'room_joined' on success.
 */
export function joinRoom(swapId) {
  socket?.emit('join_room', { swapId })
}

/**
 * Leave a swap chat room.
 * Backend event: 'leave_room'
 */
export function leaveRoom(swapId) {
  socket?.emit('leave_room', { swapId })
}

/**
 * Send a chat message.
 * Backend event: 'send_message'  →  server emits 'receive_message' to room.
 * @param {string} swapId
 * @param {string} content
 */
export function sendSocketMessage(swapId, content) {
  socket?.emit('send_message', { swapId, content })
}

/**
 * Broadcast typing indicator.
 * Backend event: 'typing'  →  server fans out to room excluding sender.
 * @param {string} swapId
 * @param {boolean} isTyping
 */
export function emitTyping(swapId, isTyping) {
  socket?.emit('typing', { swapId, isTyping })
}

export default socket