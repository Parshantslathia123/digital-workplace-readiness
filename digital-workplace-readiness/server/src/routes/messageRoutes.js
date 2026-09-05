const express = require('express');
const router = express.Router();
const { getContacts, getConversation } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/contacts', getContacts);
router.get('/:userId', getConversation);

module.exports = router;
