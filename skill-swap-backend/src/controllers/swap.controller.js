// src/controllers/swap.controller.js
const mongoose = require('mongoose');
const { SpacesServiceClient } = require('@google-apps/meet').v2;
const { SwapRequest, SWAP_STATUS } = require('../models/SwapRequest');
const Skill = require('../models/Skill');
const User  = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getAuthorizedClientForUser } = require('../config/googleClient');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Populate sender, receiver, offeredSkill, wantedSkill on a query. */
const withFullDetails = (query) =>
  query
    .populate('sender',       'name avatar rating reviewCount')
    .populate('receiver',     'name avatar rating reviewCount')
    .populate('offeredSkill', 'name title category level')
    .populate('wantedSkill',  'name title category level');

// ─── Helper: create a REAL Google Meet space via the official Meet API ───────
// Called only when a party explicitly clicks "Start Meeting" in the chat
// (POST /api/swaps/meeting, below). Never fabricates a URL — either returns
// Google's real `meetingUri` or throws.
const createGoogleMeetSpace = async (actorUserId) => {
  // Google tokens are select:false by default — fetch them explicitly.
  const organizer = await User.findById(actorUserId).select(
    '+google.refreshToken +google.accessToken +google.expiryDate'
  );

  // Throws { code: 'GOOGLE_NOT_CONNECTED', statusCode: 428 } if not connected.
  const authClient = getAuthorizedClientForUser(organizer);

  const meetClient = new SpacesServiceClient({ authClient });

  let space;
  try {
    [space] = await meetClient.createSpace({});
  } catch (err) {
    const apiErr = new Error(err?.details || err?.message || 'Unknown error');
    apiErr.statusCode = 502;
    throw apiErr;
  }

  if (!space?.meetingUri) {
    const err = new Error('Google Meet did not return a meeting URI.');
    err.statusCode = 502;
    throw err;
  }

  return { link: space.meetingUri, spaceName: space.name };
};

// ─── Helper: read the REAL current state of an existing space ───────────────
// A Meet *space* (the link) and the *conference* happening inside it are
// different things — a space can exist with nobody in it. Google's
// `spaces.get` returns `activeConference` only while people are actually in
// a call right now, so that's the only signal we treat as ground truth:
//   activeConference present     → 'active'
//   absent, but was seen before  → 'ended'
//   absent, never seen before    → 'ready'
// This never invents an "ended" status — if the Google call itself fails
// (e.g. organizer's token expired), the caller keeps whatever status was
// last persisted rather than guessing.
const readGoogleMeetSpaceStatus = async (organizerUserId, spaceName) => {
  const organizer = await User.findById(organizerUserId).select(
    '+google.refreshToken +google.accessToken +google.expiryDate'
  );
  const authClient = getAuthorizedClientForUser(organizer);
  const meetClient = new SpacesServiceClient({ authClient });

  const [space] = await meetClient.getSpace({ name: spaceName });
  return { isActive: !!space?.activeConference };
};

// ─── Helper: persist the meeting + announce it as a chat message ────────────
// Saves the real meeting on the swap, creates a persisted `meeting`-type
// Message (so it's still there next time the chat is opened), and emits both
// `receive_message` (so it renders inline in the existing chat feed, exactly
// like a normal message) and `meeting:created` (a dedicated swap-level event
// the other participant's chat listens for, so its UI updates immediately
// without a page refresh) to the swap's Socket.io room.
const announceMeeting = async ({ swap, meetingData, actorId, io }) => {
  swap.meeting = {
    link:        meetingData.link,
    spaceName:   meetingData.spaceName,
    scheduledAt: meetingData.scheduledAt || new Date(),
    status:      'ready',   // space just created — no conference joined yet
    everActive:  false,
    endedAt:     undefined,
    createdBy:   actorId,
  };
  await swap.save();

  const Message = require('../models/Message');
  const actorIdStr   = actorId.toString();
  const otherPartyId = swap.sender.toString() === actorIdStr ? swap.receiver : swap.sender;

  const message = await Message.create({
    swap:     swap._id,
    sender:   actorId,
    receiver: otherPartyId,
    type:     'meeting',
    content:  'Your SkillSwap meeting is ready.',
    meta: {
      link:      meetingData.link,
      meetingId: meetingData.spaceName,
      title:     'Google Meet',
    },
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender',   'name avatar')
    .populate('receiver', 'name avatar');

  if (io) {
    const room = swap._id.toString();
    io.to(room).emit('receive_message', { success: true, data: { message: populatedMessage } });
    io.to(room).emit('meeting:created', swap.meeting);
  }

  return swap.meeting;
};

// ─── POST /api/swaps — send a swap request ────────────────────────────────────
const sendSwapRequest = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId, offeredSkillId, wantedSkillId, message, scheduledAt } = req.body;

    // ── Guard 1: no self-swaps ────────────────────────────────────────────────
    if (senderId.toString() === receiverId) {
      return sendError(res, {
        statusCode: 400,
        message: 'You cannot send a swap request to yourself.',
      });
    }

    // ── Guard 2: receiver must exist and be active ────────────────────────────
    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      return next(new AppError('Receiver not found.', 404));
    }

    // ── Guard 3: offered skill must exist ─────────────────────────────────────
    const offeredSkill = await Skill.findById(offeredSkillId);
    if (!offeredSkill) {
      return next(new AppError('Offered skill not found.', 404));
    }

  
    const senderOwnsOfferedSkill = req.user.skillsOffered.some(
      (id) => id.toString() === offeredSkillId.toString()
    );
    if (!senderOwnsOfferedSkill) {
      return sendError(res, {
        statusCode: 403,
        message: 'You can only offer skills that belong to you.',
      });
    }

    // ── Guard 4: wanted skill must exist ──────────────────────────────────────
    const wantedSkill = await Skill.findById(wantedSkillId);
    if (!wantedSkill) {
      return next(new AppError('Wanted skill not found.', 404));
    }

    
    const receiverOffersWantedSkill = receiver.skillsOffered.some(
      (id) => id.toString() === wantedSkillId.toString()
    );
    if (!receiverOffersWantedSkill) {
      return sendError(res, {
        statusCode: 403,
        message: "Wanted skill must belong to the receiver's profile.",
      });
    }

    // ── Guard 5: no active duplicate (same pair, same skills, either direction) ─
    const duplicate = await SwapRequest.findActiveDuplicate(
      senderId, receiverId, offeredSkillId, wantedSkillId
    );
    if (duplicate) {
      return sendError(res, {
        statusCode: 409,
        message:
          duplicate.status === SWAP_STATUS.PENDING
            ? 'A pending swap request already exists between you and this user for these skills.'
            : 'An active swap request already exists between you and this user for these skills.',
        data: { existingRequestId: duplicate._id },
      });
    }

    // ── Create ────────────────────────────────────────────────────────────────
    const swap = await SwapRequest.create({
      sender:       senderId,
      receiver:     receiverId,
      offeredSkill: offeredSkillId,
      wantedSkill:  wantedSkillId,
      message:      message || '',
      scheduledAt:  scheduledAt || undefined,
      statusHistory: [{ status: SWAP_STATUS.PENDING, changedBy: senderId, note: 'Request created' }],
    });

    const populated = await withFullDetails(SwapRequest.findById(swap._id));

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Swap request sent successfully.',
      data: { swap: populated },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/swaps — list swaps for the current user ────────────────────────
const listSwaps = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      status,
      role  = 'all',
      page  = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build the base query based on role filter
    let roleFilter;
    if (role === 'sender')   roleFilter = { sender: userId };
    else if (role === 'receiver') roleFilter = { receiver: userId };
    else roleFilter = { $or: [{ sender: userId }, { receiver: userId }] };

    const filter = { ...roleFilter };
    if (status) filter.status = status;

    const [swaps, total] = await Promise.all([
      withFullDetails(
        SwapRequest.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      SwapRequest.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: {
        swaps,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/swaps/:id — single swap detail ─────────────────────────────────
const getSwapById = async (req, res, next) => {
  try {
    const swap = await withFullDetails(SwapRequest.findById(req.params.id));
    if (!swap) return next(new AppError('Swap request not found.', 404));

    // Only parties to the swap can view it
    const userId = req.user._id.toString();
    if (swap.sender._id.toString() !== userId && swap.receiver._id.toString() !== userId) {
      return next(new AppError('You do not have access to this swap request.', 403));
    }

    return sendSuccess(res, { data: { swap } });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/swaps/:id/status — accept / reject / complete / cancel ────────
const updateSwapStatus = async (req, res, next) => {
  try {
    const { status: newStatus, note } = req.body; 
    const actorId = req.user._id;

   const swap = await SwapRequest.findById(req.params.id)
  .select('+statusHistory');


    if (!swap) return next(new AppError('Swap request not found.', 404));

    // Only parties can act
    const isSender   = swap.sender.toString()   === actorId.toString();
    const isReceiver = swap.receiver.toString() === actorId.toString();
    if (!isSender && !isReceiver) {
      return next(new AppError('You are not a party to this swap request.', 403));
    }

    // Delegate all transition logic + actor enforcement to the model method
    await swap.transition(newStatus, actorId, note || '');

    // Meeting creation is deliberately NOT automatic — it stays a separate,
    // explicit action a party takes from the chat once both sides are ready
    // (see createMeeting below). Accepting a swap only unlocks the chat.
    const updated = await withFullDetails(SwapRequest.findById(swap._id));

    const messages = {
      [SWAP_STATUS.ACCEPTED]:  'Swap request accepted.',
      [SWAP_STATUS.REJECTED]:  'Swap request rejected.',
      [SWAP_STATUS.COMPLETED]: 'Swap marked as completed.',
      [SWAP_STATUS.CANCELLED]: 'Swap request cancelled.',
    };

    return sendSuccess(res, {
      message: messages[newStatus],
      data: { swap: updated },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/swaps/:id — hard-delete (only sender, only while pending) ───
const deleteSwapRequest = async (req, res, next) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return next(new AppError('Swap request not found.', 404));

    if (swap.sender.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the sender can delete a swap request.', 403));
    }
    if (swap.status !== SWAP_STATUS.PENDING) {
      return sendError(res, {
        statusCode: 400,
        message: `Cannot delete a swap request that is '${swap.status}'. Cancel it instead.`,
      });
    }

    await swap.deleteOne();
    return sendSuccess(res, { message: 'Swap request deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/swaps/stats — summary counts for dashboard ─────────────────────
const getSwapStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const stats = await SwapRequest.aggregate([
      {
        $match: {
          $or: [
            { sender:   new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Shape into a flat object: { pending: N, accepted: N, ... }
    const summary = Object.values(SWAP_STATUS).reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});

    stats.forEach(({ _id, count }) => {
      summary[_id] = count;
    });

    summary.total = Object.values(summary).reduce((a, b) => a + b, 0);

    return sendSuccess(res, { data: { stats: summary } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/swaps/meeting — create a REAL Google Meet link ────────────────
// User-initiated ONLY: a party clicks "Start Meeting" in the chat once the
// swap is accepted. Nothing else in the app calls this — not loading the
// chat, not loading messages, not loading the swap, not fetching meeting
// status, not a page refresh. Uses the official Google Meet REST API
// (spaces.create via the @google-apps/meet client library) — NOT the
// Calendar API — and the clicking user's own OAuth-authorized Google account
// as the space's organizer. Never fabricates a URL: this either returns
// Google's real `meetingUri` or a clear error (missing Google auth / API
// failure).
const createMeeting = async (req, res, next) => {
  try {
    const { swapId, scheduledAt } = req.body;

    if (!swapId) {
      return sendError(res, { statusCode: 400, message: 'swapId is required.' });
    }

    let startTime;
    if (scheduledAt) {
      startTime = new Date(scheduledAt);
      if (Number.isNaN(startTime.getTime())) {
        return sendError(res, { statusCode: 400, message: 'scheduledAt must be a valid date.' });
      }
    }

    const swap = await SwapRequest.findById(swapId);
    if (!swap) return next(new AppError('Swap request not found.', 404));

    const userId = req.user._id.toString();
    const isSender = swap.sender.toString() === userId;
    const isReceiver = swap.receiver.toString() === userId;
    if (!isSender && !isReceiver) {
      return next(new AppError('You are not a party to this swap request.', 403));
    }

    if (swap.status !== SWAP_STATUS.ACCEPTED) {
      return sendError(res, {
        statusCode: 400,
        message: `A meeting can only be created for an accepted swap. Current status: '${swap.status}'.`,
      });
    }

    // Duplicate prevention: block only while an existing meeting is still
    // usable ('ready' — created, not yet joined — or 'active' — currently
    // live). Once Google reports it 'ended', a party is allowed to start a
    // fresh one ("Start New Meeting").
    if (swap.meeting?.link && swap.meeting.status !== 'ended') {
      return sendError(res, {
        statusCode: 409,
        message: 'A meeting already exists for this swap.',
        data: { meeting: swap.meeting },
      });
    }

    let meetingData;
    try {
      meetingData = await createGoogleMeetSpace(req.user._id);
    } catch (err) {
      if (err.code === 'GOOGLE_NOT_CONNECTED') {
        return sendError(res, {
          statusCode: 428,
          message: 'Connect your Google account before creating a meeting.',
          errors: { code: 'GOOGLE_NOT_CONNECTED' },
        });
      }
      return sendError(res, {
        statusCode: err.statusCode || 502,
        message: `Google Meet rejected the request: ${err.message}`,
      });
    }

    if (startTime) meetingData.scheduledAt = startTime;

    const io = req.app.get('io');
    const meeting = await announceMeeting({ swap, meetingData, actorId: req.user._id, io });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Google Meet link created.',
      data: { meeting },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/swaps/:id/meeting/status — read-only status check ─────────────
// Read-only: this NEVER creates a space. It only asks Google whether the
// existing space currently has a live conference (`activeConference`), and
// updates our own `ready|active|ended` bookkeeping to match reality. Safe to
// call on chat load / page refresh / periodic polling — it cannot create a
// duplicate meeting or side-effect anything except that status field.
const getMeetingStatus = async (req, res, next) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return next(new AppError('Swap request not found.', 404));

    const userId = req.user._id.toString();
    const isSender = swap.sender.toString() === userId;
    const isReceiver = swap.receiver.toString() === userId;
    if (!isSender && !isReceiver) {
      return next(new AppError('You are not a party to this swap request.', 403));
    }

    if (!swap.meeting?.spaceName) {
      return sendSuccess(res, { data: { meeting: null } });
    }

    // Best-effort: if Google can't be reached right now (expired token,
    // transient API error), just return the last known status rather than
    // guessing or failing the whole request.
    try {
      const { isActive } = await readGoogleMeetSpaceStatus(
        swap.meeting.createdBy,
        swap.meeting.spaceName
      );

      const wasStatus = swap.meeting.status;
      if (isActive) {
        swap.meeting.status = 'active';
        swap.meeting.everActive = true;
      } else if (swap.meeting.everActive) {
        swap.meeting.status = 'ended';
        if (!swap.meeting.endedAt) swap.meeting.endedAt = new Date();
      } else {
        swap.meeting.status = 'ready';
      }

      if (swap.meeting.status !== wasStatus) {
        await swap.save();
        const io = req.app.get('io');
        if (io) io.to(swap._id.toString()).emit('meeting:status', swap.meeting);
      }
    } catch (err) {
      // Swallow — status endpoint degrades gracefully to last-known state.
    }

    return sendSuccess(res, { data: { meeting: swap.meeting } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendSwapRequest,
  listSwaps,
  getSwapById,
  updateSwapStatus,
  deleteSwapRequest,
  getSwapStats,
  createMeeting,
  getMeetingStatus,
};