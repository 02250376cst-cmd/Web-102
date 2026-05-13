const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    file.mimetype.startsWith('video/') ? cb(null, true) : cb(new Error('Only video files allowed'), false);
  } else if (file.fieldname === 'thumbnail') {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files allowed'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.get('/', getAllVideos);
router.get('/following', protect, getFollowingVideos);
router.post(
  '/',
  protect,
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  uploadVideo
);
router.post('/:id/like', protect, likeVideo);
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:id', protect, deleteVideo);

module.exports = router;