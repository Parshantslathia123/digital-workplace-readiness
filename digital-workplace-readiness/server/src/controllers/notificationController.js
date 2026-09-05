const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, userIds } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const User = require('../models/User');
    const { emitToUser } = require('../socket');

    let targets = userIds;
    if (!targets || !targets.length) {
      const employees = await User.find({ role: 'employee' }).select('_id');
      targets = employees.map((e) => e._id);
    }

    const notifications = [];
    for (const userId of targets) {
      const notification = await Notification.create({
        user: userId,
        type: 'announcement',
        title,
        message,
        link: '/notifications'
      });
      notifications.push(notification);
      emitToUser(userId, 'notification:new', notification);
    }

    res.status(201).json({ success: true, message: 'Announcement sent successfully', count: notifications.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createAnnouncement };
