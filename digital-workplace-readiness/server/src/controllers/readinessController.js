const User = require('../models/User');

const categorize = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Basic';
  return 'Needs Improvement';
};

const suggestionsFor = (readiness) => {
  const suggestions = [];
  if (readiness.connectivity < 60) {
    suggestions.push('Upgrade your internet plan or use a wired connection for more stable connectivity.');
  }
  if (readiness.equipment < 60) {
    suggestions.push('Request updated equipment (laptop, headset, monitor) from IT/Admin.');
  }
  if (readiness.scheduleSync < 60) {
    suggestions.push('Sync your weekly work schedule with your team to reduce coordination gaps.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Great job! Keep maintaining your current setup for consistent hybrid readiness.');
  }
  return suggestions;
};

const getMyReadiness = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const r = user.readiness;
    const score = Math.round((r.connectivity + r.equipment + r.scheduleSync) / 3);

    res.json({
      success: true,
      readiness: {
        connectivity: r.connectivity,
        equipment: r.equipment,
        scheduleSync: r.scheduleSync,
        score,
        category: categorize(score),
        suggestions: suggestionsFor(r),
        lastUpdated: r.lastUpdated
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateMyReadiness = async (req, res, next) => {
  try {
    const { connectivity, equipment, scheduleSync } = req.body;
    const user = await User.findById(req.user._id);

    if (connectivity !== undefined) user.readiness.connectivity = Math.max(0, Math.min(100, connectivity));
    if (equipment !== undefined) user.readiness.equipment = Math.max(0, Math.min(100, equipment));
    if (scheduleSync !== undefined) user.readiness.scheduleSync = Math.max(0, Math.min(100, scheduleSync));
    user.readiness.lastUpdated = new Date();

    await user.save();

    const r = user.readiness;
    const score = Math.round((r.connectivity + r.equipment + r.scheduleSync) / 3);

    res.json({
      success: true,
      message: 'Readiness updated successfully',
      readiness: {
        connectivity: r.connectivity,
        equipment: r.equipment,
        scheduleSync: r.scheduleSync,
        score,
        category: categorize(score),
        suggestions: suggestionsFor(r)
      }
    });
  } catch (err) {
    next(err);
  }
};

const getAllReadiness = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'employee' }).select('name email department readiness avatar');
    const results = users.map((u) => {
      const r = u.readiness;
      const score = Math.round((r.connectivity + r.equipment + r.scheduleSync) / 3);
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        department: u.department,
        avatar: u.avatar,
        readiness: r,
        score,
        category: categorize(score)
      };
    });
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyReadiness, updateMyReadiness, getAllReadiness };
