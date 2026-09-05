const Meeting = require('../models/Meeting');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { emitToUser } = require('../socket');

const createMeeting = async (req, res, next) => {
  try {
    const { title, description, date, time, duration, meetingLink, teams, attendees } = req.body;
    if (!title || !date || !time || !meetingLink) {
      return res.status(400).json({ success: false, message: 'Title, date, time and meeting link are required' });
    }

    const meeting = await Meeting.create({
      title,
      description,
      date,
      time,
      duration: duration || 30,
      meetingLink,
      createdBy: req.user._id,
      teams: teams || [],
      attendees: attendees || []
    });

    let notifyUserIds = new Set((attendees || []).map(String));

    if (teams && teams.length) {
      const teamDocs = await Team.find({ _id: { $in: teams } }).populate('members', '_id');
      teamDocs.forEach((t) => t.members.forEach((m) => notifyUserIds.add(String(m._id))));
    }

    for (const userId of notifyUserIds) {
      const notification = await Notification.create({
        user: userId,
        type: 'meeting',
        title: 'New Meeting Scheduled',
        message: `You have a new meeting: "${title}" on ${new Date(date).toDateString()} at ${time}`,
        link: '/meetings'
      });
      emitToUser(userId, 'notification:new', notification);
    }

    const populated = await meeting.populate([
      { path: 'teams', select: 'name' },
      { path: 'attendees', select: 'name email' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({ success: true, message: 'Meeting created successfully', meeting: populated });
  } catch (err) {
    next(err);
  }
};

const getMeetings = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      const teams = await Team.find({ members: req.user._id }).select('_id');
      const teamIds = teams.map((t) => t._id);
      query = {
        $or: [{ attendees: req.user._id }, { teams: { $in: teamIds } }]
      };
    }

    const meetings = await Meeting.find(query)
      .populate('teams', 'name')
      .populate('attendees', 'name email')
      .populate('createdBy', 'name')
      .sort({ date: 1 });

    res.json({ success: true, count: meetings.length, meetings });
  } catch (err) {
    next(err);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const allowedFields = ['title', 'description', 'date', 'time', 'duration', 'meetingLink', 'teams', 'attendees'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) meeting[field] = req.body[field];
    });

    await meeting.save();
    res.json({ success: true, message: 'Meeting updated successfully', meeting });
  } catch (err) {
    next(err);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createMeeting, getMeetings, updateMeeting, deleteMeeting };
