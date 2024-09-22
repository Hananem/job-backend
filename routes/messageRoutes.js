const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead
} = require('../controllers/messageController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/',  authenticateUser, sendMessage);
router.get('/:userId',  authenticateUser, getMessages);
router.get('/conversations/:userId',  authenticateUser, getConversations);
router.post('/mark-messages-as-read', authenticateUser, markMessagesAsRead);

module.exports = router;
