const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

let ioInstance = null;
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error: user not found'));
      socket.userId = String(user._id);
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    try {
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    } catch (e) {
      console.error('[Socket] Failed to set online status', e.message);
    }

    io.emit('user:online', { userId });
    console.log(`[Socket.IO] User connected: ${userId} (${socket.id})`);

    socket.on('chat:send', async ({ receiverId, content }) => {
      try {
        if (!receiverId || !content || !content.trim()) return;

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content.trim()
        });

        const populated = await message.populate('sender', 'name avatar role');

        socket.emit('chat:message', populated);

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('chat:message', populated);
        }

        const notification = await Notification.create({
          user: receiverId,
          type: 'message',
          title: 'New Message',
          message: `${populated.sender.name} sent you a message`,
          link: '/chat'
        });

        if (receiverSocketId) {
          io.to(receiverSocketId).emit('notification:new', notification);
        }
      } catch (err) {
        console.error('[Socket] chat:send error', err.message);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    socket.on('chat:typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('chat:typing', { senderId: userId });
      }
    });

    socket.on('chat:read', async ({ senderId }) => {
      try {
        await Message.updateMany(
          { sender: senderId, receiver: userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('chat:read-receipt', { readerId: userId });
        }
      } catch (err) {
        console.error('[Socket] chat:read error', err.message);
      }
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      } catch (e) {
        console.error('[Socket] Failed to set offline status', e.message);
      }
      io.emit('user:offline', { userId, lastSeen: new Date() });
      console.log(`[Socket.IO] User disconnected: ${userId}`);
    });
  });
};

const getIO = () => {
  if (!ioInstance) throw new Error('Socket.IO not initialized yet');
  return ioInstance;
};

const emitToUser = (userId, event, payload) => {
  if (!ioInstance) return;
  const socketId = onlineUsers.get(String(userId));
  if (socketId) {
    ioInstance.to(socketId).emit(event, payload);
  }
};

const emitToAll = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser, emitToAll };
