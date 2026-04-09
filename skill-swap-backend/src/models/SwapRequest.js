// src/models/SwapRequest.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

// ─── Constants (exported for use in controller/validate) ──────────────────────
const SWAP_STATUS = Object.freeze({
  PENDING:   'pending',
  ACCEPTED:  'accepted',
  REJECTED:  'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

/**
 * Legal status transitions.
 * Key  = current status
 * Value = set of statuses the swap may move INTO from that state.
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [SWAP_STATUS.PENDING]:   new Set([SWAP_STATUS.ACCEPTED, SWAP_STATUS.REJECTED, SWAP_STATUS.CANCELLED]),
  [SWAP_STATUS.ACCEPTED]:  new Set([SWAP_STATUS.COMPLETED, SWAP_STATUS.CANCELLED]),
  [SWAP_STATUS.REJECTED]:  new Set(),   // terminal
  [SWAP_STATUS.COMPLETED]: new Set(),   // terminal
  [SWAP_STATUS.CANCELLED]: new Set(),   // terminal
});

/**
 * Which actor is allowed to trigger each transition.
 * 'sender'   = the user who created the request
 * 'receiver' = the user who received the request
 * 'both'     = either party
 */
const TRANSITION_ACTOR = Object.freeze({
  [SWAP_STATUS.ACCEPTED]:  'receiver',
  [SWAP_STATUS.REJECTED]:  'receiver',
  [SWAP_STATUS.COMPLETED]: 'both',
  [SWAP_STATUS.CANCELLED]: 'both',
});

// ─── Sub-schema: status history entry ────────────────────────────────────────
const statusHistorySchema = new Schema(
  {
    status:    { type: String, enum: Object.values(SWAP_STATUS), required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note:      { type: String, maxlength: 200, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── SwapRequest schema ───────────────────────────────────────────────────────
const swapRequestSchema = new Schema(
  {
    // ── Parties ───────────────────────────────────────────────────────────────
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },

    // ── Skills being exchanged ────────────────────────────────────────────────
    offeredSkill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Offered skill is required'],
    },
    wantedSkill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Wanted skill is required'],
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(SWAP_STATUS),
      default: SWAP_STATUS.PENDING,
    },

    // ── Communication ─────────────────────────────────────────────────────────
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },

    // ── Optional scheduling ───────────────────────────────────────────────────
    scheduledAt: {
      type: Date,
      validate: {
        validator: (v) => !v || v > Date.now(),
        message: 'Scheduled date must be in the future',
      },
    },

    // ── Audit trail ───────────────────────────────────────────────────────────
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // ── Completion metadata ───────────────────────────────────────────────────
    completedAt:  { type: Date },
    cancelledAt:  { type: Date },
    rejectedAt:   { type: Date },

    // ── Review tracking (set by Review model after creation) ──────────────────
    senderReviewed:   { type: Boolean, default: false },
    receiverReviewed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
swapRequestSchema.index({ sender: 1, status: 1 });
swapRequestSchema.index({ receiver: 1, status: 1 });
swapRequestSchema.index({ sender: 1, receiver: 1, status: 1 });
// Compound index used by the duplicate-check query
swapRequestSchema.index(
  { sender: 1, receiver: 1, offeredSkill: 1, wantedSkill: 1 },
  { name: 'duplicate_guard' }
);

// ─── Virtual: isTerminal ──────────────────────────────────────────────────────
swapRequestSchema.virtual('isTerminal').get(function () {
  return [SWAP_STATUS.REJECTED, SWAP_STATUS.COMPLETED, SWAP_STATUS.CANCELLED]
    .includes(this.status);
});

// ─── Static: check if a pending/accepted duplicate exists ────────────────────
swapRequestSchema.statics.findActiveDuplicate = function (senderId, receiverId, offeredSkillId, wantedSkillId) {
  return this.findOne({
    $or: [
      // Exact same direction
      { sender: senderId,   receiver: receiverId,   offeredSkill: offeredSkillId, wantedSkill: wantedSkillId },
      // Reverse direction — they already sent one to us
      { sender: receiverId, receiver: senderId,     offeredSkill: wantedSkillId,  wantedSkill: offeredSkillId },
    ],
    status: { $in: [SWAP_STATUS.PENDING, SWAP_STATUS.ACCEPTED] },
  });
};

// ─── Instance: transition status ──────────────────────────────────────────────
/**
 * Validates the transition, records it in statusHistory, sets timestamp fields,
 * and saves. Throws AppError for illegal moves.
 */
swapRequestSchema.methods.transition = async function (newStatus, actorId, note = '') {
  const { AppError } = require('../middleware/errorHandler');

  const allowed = ALLOWED_TRANSITIONS[this.status];
  if (!allowed.has(newStatus)) {
    throw new AppError(
      `Cannot move from '${this.status}' to '${newStatus}'.`,
      400
    );
  }

  const actorRole = TRANSITION_ACTOR[newStatus];
  const isSender   = this.sender.toString()   === actorId.toString();
  const isReceiver = this.receiver.toString() === actorId.toString();

  if (actorRole === 'receiver' && !isReceiver) {
    throw new AppError('Only the request receiver can perform this action.', 403);
  }
  if (actorRole === 'sender' && !isSender) {
    throw new AppError('Only the request sender can perform this action.', 403);
  }
  if (actorRole === 'both' && !isSender && !isReceiver) {
    throw new AppError('You are not a party to this swap request.', 403);
  }

  // Cancellation by sender is only allowed while pending
  if (newStatus === SWAP_STATUS.CANCELLED && isSender && this.status !== SWAP_STATUS.PENDING) {
    throw new AppError('Sender can only cancel a pending request.', 400);
  }

  this.status = newStatus;
  this.statusHistory.push({ status: newStatus, changedBy: actorId, note });

  if (newStatus === SWAP_STATUS.COMPLETED) this.completedAt  = new Date();
  if (newStatus === SWAP_STATUS.CANCELLED) this.cancelledAt  = new Date();
  if (newStatus === SWAP_STATUS.REJECTED)  this.rejectedAt   = new Date();

  return this.save();
};

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);

module.exports = { SwapRequest, SWAP_STATUS, ALLOWED_TRANSITIONS, TRANSITION_ACTOR };