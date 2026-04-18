const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/', commentController.getAllComments);
router.get('/:id', commentController.getCommentById);
router.post('/', commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

router.get('/video/:videoId', commentController.getVideoComments);
router.get('/user/:userId', commentController.getUserComments);

module.exports = router;
