const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  getDashboardStats
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/stats/dashboard', authorize('admin'), getDashboardStats);
router.put('/profile', updateProfile);
router.get('/', authorize('admin'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
