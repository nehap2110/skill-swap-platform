// models/Message.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    swap: {
      type: Schema.Types.ObjectId,
      ref: 'SwapRequest',
      required: [true, 'Swap reference is required'],
    },
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
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    read: {
      type: Boolean,
      default: false,
    },
    // ── Message type ─────────────────────────────────────────────────────────
    // 'text'    = a normal chat message typed by a user
    // 'meeting' = a system-generated message announcing a real Google Meet
    //             link created for this swap (see swap.controller.js)
    type: {
      type: String,
      enum: ['text', 'meeting', 'system'],
      default: 'text',
    },
    // Extra structured data the frontend needs to render non-text messages
    // (e.g. the real Google Meet URL). Left undefined for plain text messages.
    meta: {
      link:      { type: String, default: undefined },
      meetingId: { type: String, default: undefined },
      title:     { type: String, default: undefined },
    },
  },
  { timestamps: true }
);

messageSchema.index({ swap: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;