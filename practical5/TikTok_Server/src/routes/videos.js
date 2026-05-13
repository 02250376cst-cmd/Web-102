const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const videoController = require('../controllers/videoController');

const router = express.Router();

router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);
router.get('/following/feed', protect, videoController.getFollowingVideos);

router.post('/', protect, upload.fields([{ name: 'video' }, { name: 'thumbnail' }]), videoController.createVideo);
router.put('/:id', protect, videoController.updateVideo);
router.delete('/:id', protect, videoController.deleteVideo);

router.post('/:id/like', protect, videoController.toggleVideoLike);
router.get('/:id/comments', videoController.getVideoComments);

module.exports = router;
