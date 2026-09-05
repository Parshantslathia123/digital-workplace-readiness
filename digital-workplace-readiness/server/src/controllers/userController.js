const User = require('../models/User');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');

// @desc Get all employees (admin) with search/filter
// @route GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const { search, department, workMode, status, team, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department = department;
    if (workMode) query.workMode = workMode;
    if (status) query.status = status;
    if (team) query.team = team;
    if (role) query.role = role;

    const users = await User.find(query).populate('team', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc Get single user
// @route GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('team', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc Update own profile
// @route PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'jobTitle', 'department', 'avatar', 'workMode', 'weeklySchedule'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    next(err);
  }
};

// @desc Admin: update any employee (team, department, workMode, status, role restrictions apply)
// @route PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'jobTitle', 'department', 'team', 'workMode', 'status', 'avatar', 'weeklySchedule'
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Notification.create({
      user: user._id,
      type: 'announcement',
      title: 'Profile Updated',
      message: 'An administrator has updated your profile information.',
      link: '/profile'
    });

    res.json({ success: true, message: 'Employee updated successfully', user });
  } catch (err) {
    next(err);
  }
};

// @desc Admin: delete employee
// @route DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Employee removed successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc Admin dashboard stats
// @route GET /api/users/stats/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const onlineEmployees = await User.countDocuments({ role: 'employee', isOnline: true });
    const offlineEmployees = totalEmployees - onlineEmployees;

    const remote = await User.countDocuments({ role: 'employee', workMode: 'Remote' });
    const office = await User.countDocuments({ role: 'employee', workMode: 'Office' });
    const hybrid = await User.countDocuments({ role: 'employee', workMode: 'Hybrid' });

    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'Pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
    const completedTasks = await Task.countDocuments({ status: 'Completed' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'Present'
    });

    const employees = await User.find({ role: 'employee' });
    const avgReadiness =
      employees.length > 0
        ? Math.round(
            employees.reduce((sum, e) => {
              const r = e.readiness || {};
              return sum + ((r.connectivity || 0) + (r.equipment || 0) + (r.scheduleSync || 0)) / 3;
            }, 0) / employees.length
          )
        : 0;

    res.json({
      success: true,
      stats: {
        totalEmployees,
        onlineEmployees,
        offlineEmployees,
        workModeBreakdown: { remote, office, hybrid },
        tasks: { totalTasks, pendingTasks, inProgressTasks, completedTasks },
        attendance: { presentToday },
        avgReadiness
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  getDashboardStats
};
