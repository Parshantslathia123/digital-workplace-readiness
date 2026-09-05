const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('admin'), createTask);
router.put('/:id', updateTask);
router.delete('/:id', authorize('admin'), deleteTask);

module.exports = router;
