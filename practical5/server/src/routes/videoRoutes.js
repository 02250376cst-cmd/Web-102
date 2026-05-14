const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllVideos,
  getFollowingVideos,
  uploadVideo,
  likeVideo,
  getComments,
  addComment,
  deleteVideo,
} = require('../controllers/videoController');
const { protect } = require('../middleware/auth');

// Use memory storage — files go to Supabase, not local disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else if (file.fieldname === 'thumbnail' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

router.get('/', getAllVideos);
router.get('/following', protect, getFollowingVideos);
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  uploadVideo
);
router.post('/:id/like', protect, likeVideo);
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:id', protect, deleteVideo);

module.exports = router;