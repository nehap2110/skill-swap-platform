// routes/chat.routes.js
const { Router } = require('express');
const { sendMessage, getMessagesBySwap, markMessagesAsRead } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

const router = Router();

router.use(protect);

router.post('/:swapId/message',  sendMessage);
router.get('/:swapId/messages',  getMessagesBySwap);
router.patch('/:swapId/read',    markMessagesAsRead);

module.exports = router;