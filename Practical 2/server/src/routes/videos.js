const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

//get / api/ videos - get all videos 
router.get('/', videoController.getAllVideos);

//post / api/ videos - create a new video
router.post('/', videoController.createVideo);

// get api/ videos/ :id - get a video by id
router.get('/:id', videoController.getVideoById);

// put api/ videos/ :id - update a video by id
router.put('/:id', videoController.updateVideo);

//delete api/ videos/ :id - delete a video by id
router.delete('/:id', videoController.deleteVideo);

//get /api/ videos/ :id/comments - get video comments
router.get('/:id/comments', videoController.getVideoComments);

// get /api/ videos/ :id/ like - like a video
router.post('/:id/like', videoController.getVideoLikes);

// post / api/ videos/ :id/ likes-like video
router.post('/:id/like', videoController.likeVideo);

// post / api/ videos/ :id/ unlike - unlike a video
router.post('/:id/like', videoController.unlikeVideo);

