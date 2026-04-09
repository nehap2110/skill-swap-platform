// controllers/chat.controller.js
const mongoose = require('mongoose');
const Message = require('../models/Message');
const { SwapRequest, SWAP_STATUS } = require('../models/SwapRequest');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Fetches the swap, validates it exists, is accepted, and that the
 * caller is one of the two parties. Returns { swap, receiverId } on success.
 * Calls next(error) and returns null on any failure — callers must guard on null.
 */
const resolveSwapParticipation = async (swapId, callerId, res, next) => {
  if (!isValidObjectId(swapId)) {
    sendError(res, { statusCode: 400, message: 'Invalid swap ID.' });
    return null;
  }

  const swap = await SwapRequest.findById(swapId);

  if (!swap) {
    next(new AppError('Swap request not found.', 404));
    return null;
  }

  if (swap.status !== SWAP_STATUS.ACCEPTED) {
    sendError(res, {
      statusCode: 403,
      message: `Chat is only available for accepted swaps. Current status: '${swap.status}'.`,
    });
    return null;
  }

  const senderId   = swap.sender.toString();
  const receiverId = swap.receiver.toString();
  const callerStr  = callerId.toString();

  if (callerStr !== senderId && callerStr !== receiverId) {
    next(new AppError('You are not a participant in this swap.', 403));
    return null;
  }

  const otherPartyId = callerStr === senderId ? swap.receiver : swap.sender;

  return { swap, otherPartyId };
};

// POST /api/chat/:swapId/message
const sendMessage = async (req, res, next) => {
  try {
    const { swapId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return sendError(res, { statusCode: 400, message: 'Message content is required.' });
    }

    const participation = await resolveSwapParticipation(swapId, req.user._id, res, next);
    if (!participation) return;

    const { otherPartyId } = participation;

    const message = await Message.create({
      swap:     swapId,
      sender:   req.user._id,
      receiver: otherPartyId,
      content:  content.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate('sender',   'name avatar')
      .populate('receiver', 'name avatar');

    // Emit via Socket.io if available on req (attached in socket.js)
    const io = req.app.get('io');
    if (io) {
      io.to(swapId).emit('receive_message', {
        success: true,
        data: { message: populated },
      });
    }

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Message sent.',
      data: { message: populated },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/:swapId/messages
const getMessagesBySwap = async (req, res, next) => {
  try {
    const { swapId } = req.params;

    const participation = await resolveSwapParticipation(swapId, req.user._id, res, next);
    if (!participation) return;

    const messages = await Message.find({ swap: swapId })
      .populate('sender',   'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

    return sendSuccess(res, {
      message: 'Messages retrieved.',
      data: { messages, total: messages.length },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/chat/:swapId/read
const markMessagesAsRead = async (req, res, next) => {
  try {
    const { swapId } = req.params;

    const participation = await resolveSwapParticipation(swapId, req.user._id, res, next);
    if (!participation) return;

    const result = await Message.updateMany(
      { swap: swapId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(swapId).emit('messages_read', {
        swapId,
        readBy: req.user._id,
        count: result.modifiedCount,
      });
    }

    return sendSuccess(res, {
      message: 'Messages marked as read.',
      data: { updatedCount: result.modifiedCount },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getMessagesBySwap, markMessagesAsRead };