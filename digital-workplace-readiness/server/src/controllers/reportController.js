const User = require('../models/User');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');

const getReports = async (req, res, next) => {
  try {
    // Task report - by status and priority
    const tasksByStatus = await Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const tasksByPriority = await Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);

    // Attendance report - last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const attendanceByDate = await Attendance.aggregate([
      { $match: { date: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, status: '$status' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Employee stats - by department and work mode
    const employeesByDepartment = await User.aggregate([
      { $match: { role: 'employee' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const employeesByWorkMode = await User.aggregate([
      { $match: { role: 'employee' } },
      { $group: { _id: '$workMode', count: { $sum: 1 } } }
    ]);

    // Readiness distribution
    const employees = await User.find({ role: 'employee' }).select('readiness');
    const readinessBuckets = { 'Needs Improvement': 0, Basic: 0, Good: 0, Excellent: 0 };
    employees.forEach((e) => {
      const r = e.readiness;
      const score = Math.round((r.connectivity + r.equipment + r.scheduleSync) / 3);
      if (score >= 80) readinessBuckets.Excellent++;
      else if (score >= 60) readinessBuckets.Good++;
      else if (score >= 40) readinessBuckets.Basic++;
      else readinessBuckets['Needs Improvement']++;
    });

    res.json({
      success: true,
      reports: {
        tasksByStatus,
        tasksByPriority,
        attendanceByDate,
        employeesByDepartment,
        employeesByWorkMode,
        readinessBuckets
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReports };
