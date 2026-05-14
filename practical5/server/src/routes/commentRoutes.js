const express = require('express');
const router = express.Router();
const { likeComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.post('/:id/like', protect, likeComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;