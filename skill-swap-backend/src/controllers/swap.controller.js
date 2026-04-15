// src/controllers/swap.controller.js
const mongoose = require('mongoose');
const { SwapRequest, SWAP_STATUS } = require('../models/SwapRequest');
const Skill = require('../models/Skill');
const User  = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Populate sender, receiver, offeredSkill, wantedSkill on a query. */
const withFullDetails = (query) =>
  query
    .populate('sender',       'name avatar rating reviewCount')
    .populate('receiver',     'name avatar rating reviewCount')
    .populate('offeredSkill', 'name title category level')
    .populate('wantedSkill',  'name title category level');

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

    // ── Guard 3: offered skill must belong to the sender ──────────────────────
    const offeredSkill = await Skill.findById(offeredSkillId);
    // if (!offeredSkill || !offeredSkill.isActive) {
    //   return next(new AppError('Offered skill not found.', 404));
    // }


    //for testing 
    if (!offeredSkill) {
      return next(new AppError('Offered skill not found.', 404));
    }
    //---- end 

    
    if (offeredSkill.createdBy.toString() !== senderId.toString()) {
      return sendError(res, {
        statusCode: 403,
        message: 'You can only offer skills that belong to you.',
      });
    }

    // ── Guard 4: wanted skill must belong to the receiver ─────────────────────
    const wantedSkill = await Skill.findById(wantedSkillId);
   

//test --
     if (!wantedSkill ) {
      return next(new AppError('Wanted skill not found.', 404));
    }
    //end 


    if (wantedSkill.createdBy.toString() !== receiverId.toString()) {
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

    // Fetch with status history for transition logic
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

//added by me to create a google meeting
const createMeeting = async (req, res) => {
  try {
    const { swapId, scheduledAt } = req.body;

    const swap = await SwapRequest.findById(swapId);

    if (!swap) return res.status(404).json({ message: 'Swap not found' });

    // Only participants allowed
    if (![swap.sender.toString(), swap.receiver.toString()].includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Google Meet link (simple random)
    const meetingLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`;

    swap.meeting = {
      link: meetingLink,
      scheduledAt,
      createdBy: req.user._id
    };

    await swap.save();

    // 🔥 SOCKET EMIT
const io = req.app.get('io');   // important
io.to(swapId).emit('meetingCreated', swap.meeting);

    res.json({
      success: true,
      meeting: swap.meeting
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  sendSwapRequest,
  listSwaps,
  getSwapById,
  updateSwapStatus,
  deleteSwapRequest,
  getSwapStats,
  createMeeting
};