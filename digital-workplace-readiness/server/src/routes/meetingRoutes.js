const express = require('express');
const router = express.Router();
const { createMeeting, getMeetings, updateMeeting, deleteMeeting } = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/', getMeetings);
router.post('/', authorize('admin'), createMeeting);
router.put('/:id', authorize('admin'), updateMeeting);
router.delete('/:id', authorize('admin'), deleteMeeting);

module.exports = router;
