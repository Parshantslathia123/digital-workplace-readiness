const express = require('express');
const router = express.Router();
const { createTeam, getTeams, getTeamById, updateTeam, deleteTeam } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', authorize('admin'), createTeam);
router.put('/:id', authorize('admin'), updateTeam);
router.delete('/:id', authorize('admin'), deleteTeam);

module.exports = router;
