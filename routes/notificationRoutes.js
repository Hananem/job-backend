const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Route to get user notifications
router.get('/', authenticateUser, notificationController.getNotifications);
router.put('/mark-read', authenticateUser, notificationController.markNotificationsAsRead);
module.exports = router;
