const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { emitToUser } = require('../socket');

const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, deadline } = req.body;
    if (!title || !assignedTo || !deadline) {
      return res.status(400).json({ success: false, message: 'Title, assignedTo and deadline are required' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority: priority || 'Medium',
      deadline
    });

    const populated = await task.populate('assignedTo', 'name email avatar');

    const notification = await Notification.create({
      user: assignedTo,
      type: 'task',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${title}"`,
      link: '/tasks'
    });
    emitToUser(assignedTo, 'notification:new', notification);
    emitToUser(assignedTo, 'task:new', populated);

    res.status(201).json({ success: true, message: 'Task created successfully', task: populated });
  } catch (err) {
    next(err);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, assignedTo } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.user.role === 'employee' && String(task.assignedTo._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isOwner = String(task.assignedTo) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (isAdmin) {
      const { title, description, priority, deadline, assignedTo, status, progress } = req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (deadline !== undefined) task.deadline = deadline;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (status !== undefined) task.status = status;
      if (progress !== undefined) task.progress = progress;
    } else {
      // Employees can only update their own status/progress
      const { status, progress } = req.body;
      if (status !== undefined) task.status = status;
      if (progress !== undefined) task.progress = progress;
      if (status === 'Completed') task.progress = 100;
    }

    await task.save();
    const populated = await task.populate('assignedTo', 'name email avatar');

    if (isOwner) {
      const notification = await Notification.create({
        user: populated.assignedBy,
        type: 'task',
        title: 'Task Updated',
        message: `${req.user.name} updated task "${task.title}" to ${task.status}`,
        link: '/tasks'
      });
      emitToUser(populated.assignedBy, 'notification:new', notification);
    }

    res.json({ success: true, message: 'Task updated successfully', task: populated });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
