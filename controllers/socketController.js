const Message = require('../models/Message');

const socketController = (socket, io) => {
  console.log('New client connected');

  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    try {
      const newMessage = new Message({ sender: senderId, receiver: receiverId, message });
      await newMessage.save();
      io.to(receiverId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error sending message', error);
    }
  });

  socket.on('joinRoom', ({ userId }) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
};

module.exports = socketController;

