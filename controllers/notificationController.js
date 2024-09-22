const User = require('../models/User');
const Notification = require('../models/Notification');
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ toUser: userId }).populate('fromUser job', 'username jobTitle');
    const unreadCount = await Notification.countDocuments({ toUser: userId, read: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

exports.markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany({ toUser: userId, read: false }, { $set: { read: true } });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ message: 'Error marking notifications as read', error: err.message });
  }
};