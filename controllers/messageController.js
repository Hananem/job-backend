const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getIo } = require('../socket/Socket');

// Controller method to send a new message
exports.sendMessage = async (req, res) => {
  const { receiver, message } = req.body;
  const sender = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(receiver)) {
    return res.status(400).json({ message: 'Invalid receiver ID' });
  }

  try {
    // Find the receiver user by ID
    const foundReceiver = await User.findById(receiver);

    if (!foundReceiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const newMessage = new Message({ sender: sender, receiver: foundReceiver._id, message });
    await newMessage.save();

    // Update the receiver's hasNewMessage flag
    foundReceiver.hasNewMessage = true;
    await foundReceiver.save();

    // Emit the message event to the receiver
    const io = getIo(); // Assuming getIo() is a function to get the initialized io object
    io.to(foundReceiver._id).emit('newMessage', newMessage); // Emitting 'newMessage' event to the receiver's room

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Controller method to mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    // Fetch the user from the database to get a Mongoose document instance
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's hasNewMessage flag
    user.hasNewMessage = false;
    await user.save();

    // Mark all unread messages as read
    await Message.updateMany(
      { receiver: user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};
// Get all messages between two users with pagination
exports.getMessages = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const currentUserId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'username')
      .populate('receiver', 'username')
      .sort({ timestamp: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    });

    res.status(200).json({
      messages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error retrieving messages', error);
    res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
};

// Get recent conversations for the current user
exports.getConversations = async (req, res) => {
  const currentUserId = req.user.id; // Using req.user.id instead of req.user._id

  console.log('req.user:', req.user); // Log the entire user object for debugging
  console.log('Current User ID:', currentUserId); // Debugging: Log the user ID

  if (!currentUserId || !mongoose.Types.ObjectId.isValid(currentUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(currentUserId); // Correctly using 'new'

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { receiver: userObjectId },
          ],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userObjectId] },
              '$receiver',
              '$sender',
            ],
          },
          message: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          'message.sender': 1,
          'message.receiver': 1,
          'message.message': 1,
          'message.timestamp': 1,
          'user.username': 1,
        },
      },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error retrieving conversations', error);
    res.status(500).json({ message: 'Error retrieving conversations', error: error.message });
  }
};
