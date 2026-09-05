const express = require('express');
const router = express.Router();
const { getMyReadiness, updateMyReadiness, getAllReadiness } = require('../controllers/readinessController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/me', getMyReadiness);
router.put('/me', updateMyReadiness);
router.get('/all', authorize('admin'), getAllReadiness);

module.exports = router;
