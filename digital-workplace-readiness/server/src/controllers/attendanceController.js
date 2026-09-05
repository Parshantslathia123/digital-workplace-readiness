const Attendance = require('../models/Attendance');

const markAttendance = async (req, res, next) => {
  try {
    const { workMode, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ employee: req.user._id, date: today });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      status: 'Present',
      workMode: workMode || req.user.workMode,
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: 'Attendance marked successfully', attendance });
  } catch (err) {
    next(err);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { employee, date, status, workMode, startDate, endDate } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (employee) {
      query.employee = employee;
    }

    if (status) query.status = status;
    if (workMode) query.workMode = workMode;

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      query.date = { $gte: d, $lt: next };
    } else if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await Attendance.find(query)
      .populate('employee', 'name email avatar department')
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (err) {
    next(err);
  }
};

const getAttendanceStats = async (req, res, next) => {
  try {
    const query = req.user.role === 'employee' ? { employee: req.user._id } : {};

    const total = await Attendance.countDocuments(query);
    const present = await Attendance.countDocuments({ ...query, status: 'Present' });
    const absent = await Attendance.countDocuments({ ...query, status: 'Absent' });
    const halfDay = await Attendance.countDocuments({ ...query, status: 'Half Day' });
    const leave = await Attendance.countDocuments({ ...query, status: 'Leave' });

    res.json({ success: true, stats: { total, present, absent, halfDay, leave } });
  } catch (err) {
    next(err);
  }
};

module.exports = { markAttendance, getAttendance, getAttendanceStats };
