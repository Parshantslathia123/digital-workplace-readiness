const Message = require('../models/Message');
const User = require('../models/User');

// @desc Get chat contact list (admin sees all employees, employee sees all admins)
const getContacts = async (req, res, next) => {
  try {
    const targetRole = req.user.role === 'admin' ? 'employee' : 'admin';
    const contacts = await User.find({ role: targetRole }).select('name email avatar isOnline lastSeen jobTitle');

    const withUnread = await Promise.all(
      contacts.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          sender: c._id,
          receiver: req.user._id,
          isRead: false
        });
        return { ...c.toObject(), unreadCount };
      })
    );

    res.json({ success: true, contacts: withUnread });
  } catch (err) {
    next(err);
  }
};

// @desc Get conversation history with a specific user
const getConversation = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    next(err);
  }
};

module.exports = { getContacts, getConversation };
