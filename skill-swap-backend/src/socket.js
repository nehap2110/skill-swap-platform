// socket.js
const { Server } = require('socket.io');
const { verifyAccessToken } = require('./utils/generateToken');
const { SwapRequest, SWAP_STATUS } = require('./models/SwapRequest');
const User = require('./models/User');
const env = require('./config/env');

/**
 * Initialises Socket.io on the provided HTTP server, attaches the instance
 * to the Express app (so controllers can emit via req.app.get('io')),
 * and registers all connection/event handlers.
 *
 * @param {import('http').Server} httpServer
 * @param {import('express').Application} app
 * @returns {import('socket.io').Server}
 */
const initSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  app.set('io', io);

  // ── Socket authentication middleware ──────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('AUTH_MISSING'));

      const decoded = verifyAccessToken(token);
      const user    = await User.findById(decoded.sub).select('_id name avatar isActive');

      if (!user || !user.isActive) return next(new Error('AUTH_INVALID'));

      socket.user = user;
      next();
    } catch {
      next(new Error('AUTH_INVALID'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    if (env.isDev) {
      console.log(`Socket connected: ${socket.id} (user: ${socket.user._id})`);
    }

    /**
     * Event: join_room
     * Client sends { swapId } to subscribe to a swap's chat channel.
     * Guard: swap must exist, be accepted, and the socket user must be a party.
     */
    socket.on('join_room', async ({ swapId } = {}) => {
      try {
        if (!swapId) {
          return socket.emit('error', { message: 'swapId is required to join a room.' });
        }

        const swap = await SwapRequest.findById(swapId).select('sender receiver status');

        if (!swap) {
          return socket.emit('error', { message: 'Swap not found.' });
        }

        if (swap.status !== SWAP_STATUS.ACCEPTED) {
          return socket.emit('error', {
            message: `Chat is only available for accepted swaps. Status: '${swap.status}'.`,
          });
        }

        const userId   = socket.user._id.toString();
        const senderId = swap.sender.toString();
        const recvId   = swap.receiver.toString();

        if (userId !== senderId && userId !== recvId) {
          return socket.emit('error', { message: 'You are not a participant in this swap.' });
        }

        // Leave any previously joined swap rooms before joining the new one
        socket.rooms.forEach((room) => {
          if (room !== socket.id) socket.leave(room);
        });

        socket.join(swapId);
        socket.emit('room_joined', { swapId });

        if (env.isDev) {
          console.log(`  User ${userId} joined room ${swapId}`);
        }
      } catch (err) {
        console.error('join_room error:', err.message);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    /**
     * Event: send_message
     * Client sends { swapId, content }.
     * Guard: identical to HTTP layer — swap accepted, caller is a party.
     * On success: persists to DB, then emits receive_message to the whole room
     * (including sender, so the sender's UI gets the server-stamped document).
     */
    socket.on('send_message', async ({ swapId, content } = {}) => {
      try {
        if (!swapId || !content?.trim()) {
          return socket.emit('error', { message: 'swapId and content are required.' });
        }

        // Re-validate participation on every message (status may have changed)
        const swap = await SwapRequest.findById(swapId).select('sender receiver status');

        if (!swap) {
          return socket.emit('error', { message: 'Swap not found.' });
        }

        if (swap.status !== SWAP_STATUS.ACCEPTED) {
          return socket.emit('error', {
            message: `Chat is only available for accepted swaps. Status: '${swap.status}'.`,
          });
        }

        const userId   = socket.user._id.toString();
        const senderId = swap.sender.toString();
        const recvId   = swap.receiver.toString();

        if (userId !== senderId && userId !== recvId) {
          return socket.emit('error', { message: 'You are not a participant in this swap.' });
        }

        // Lazy-require to avoid circular dep issues at module load time
        const Message = require('./models/Message');

        const otherPartyId = userId === senderId ? swap.receiver : swap.sender;

        const message = await Message.create({
          swap:     swapId,
          sender:   socket.user._id,
          receiver: otherPartyId,
          content:  content.trim(),
        });

        const populated = await Message.findById(message._id)
          .populate('sender',   'name avatar')
          .populate('receiver', 'name avatar');

        // Broadcast to everyone in the room (sender + receiver)
        io.to(swapId).emit('receive_message', {
          success: true,
          data: { message: populated },
        });
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    /**
     * Event: typing
     * Lightweight presence indicator — no DB write, just fan-out to room.
     * Client sends { swapId, isTyping: boolean }.
     */
    socket.on('typing', ({ swapId, isTyping } = {}) => {
      if (!swapId) return;
      socket.to(swapId).emit('typing', {
        userId: socket.user._id,
        name:   socket.user.name,
        isTyping: !!isTyping,
      });
    });

    /**
     * Event: leave_room
     * Explicit clean-up when the client navigates away.
     */
    socket.on('leave_room', ({ swapId } = {}) => {
      if (swapId) {
        socket.leave(swapId);
        socket.emit('room_left', { swapId });
      }
    });

    socket.on('disconnect', (reason) => {
      if (env.isDev) {
        console.log(`Socket disconnected: ${socket.id} (${reason})`);
      }
    });
  });

  return io;
};

module.exports = { initSocket };