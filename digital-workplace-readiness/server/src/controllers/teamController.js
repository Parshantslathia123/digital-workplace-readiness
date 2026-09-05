const Team = require('../models/Team');
const User = require('../models/User');

const createTeam = async (req, res, next) => {
  try {
    const { name, description, leader, members } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Team name is required' });

    const team = await Team.create({ name, description, leader: leader || null, members: members || [] });

    if (members && members.length) {
      await User.updateMany({ _id: { $in: members } }, { team: team._id });
    }

    res.status(201).json({ success: true, message: 'Team created successfully', team });
  } catch (err) {
    next(err);
  }
};

const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate('leader', 'name email jobTitle')
      .populate('members', 'name email jobTitle avatar workMode status')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: teams.length, teams });
  } catch (err) {
    next(err);
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email jobTitle')
      .populate('members', 'name email jobTitle avatar workMode status');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, team });
  } catch (err) {
    next(err);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const { name, description, leader, members } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (name !== undefined) team.name = name;
    if (description !== undefined) team.description = description;
    if (leader !== undefined) team.leader = leader;

    if (members !== undefined) {
      await User.updateMany({ _id: { $in: team.members } }, { team: null });
      await User.updateMany({ _id: { $in: members } }, { team: team._id });
      team.members = members;
    }

    await team.save();
    res.json({ success: true, message: 'Team updated successfully', team });
  } catch (err) {
    next(err);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    await User.updateMany({ team: team._id }, { team: null });
    await team.deleteOne();

    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTeam, getTeams, getTeamById, updateTeam, deleteTeam };
