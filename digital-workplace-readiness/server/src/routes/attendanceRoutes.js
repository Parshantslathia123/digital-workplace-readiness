const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getAttendanceStats } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', markAttendance);
router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);

module.exports = router;
