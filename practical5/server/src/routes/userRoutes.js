const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  getAllUsers,
  followUser,
  getMe,
  getFollowing,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/', protect, getAllUsers);
router.get('/:id/following', getFollowing);  // ← new route BEFORE /:id
router.get('/:id', getProfile);
router.post('/:id/follow', protect, followUser);

module.exports = router;