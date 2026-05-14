const prisma = require('../lib/prisma');
const { uploadFile, deleteFile } = require('../services/storageService');

const videoWithDetails = {
  user: {
    select: { id: true, username: true, name: true, avatar: true },
  },
  _count: {
    select: { likes: true, comments: true },
  },
};

// GET /api/videos?cursor=ID&limit=5
exports.getAllVideos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const cursor = req.query.cursor ? parseInt(req.query.cursor) : undefined;

    const videos = await prisma.video.findMany({
      take: limit + 1, // fetch one extra to check if there's a next page
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // skip the cursor item itself
      }),
      include: videoWithDetails,
      orderBy: { id: 'desc' }, // ← FIXED: was createdAt, now id
    });

    const hasNextPage = videos.length > limit;
    const results = hasNextPage ? videos.slice(0, limit) : videos;
    const nextCursor = hasNextPage ? results[results.length - 1].id : null;

    res.json({ videos: results, nextCursor, hasNextPage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/videos/following?cursor=ID&limit=5
exports.getFollowingVideos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const cursor = req.query.cursor ? parseInt(req.query.cursor) : undefined;

    const follows = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true },
    });

    const followedUserIds = follows.map((f) => f.followingId);
    if (followedUserIds.length === 0) {
      return res.json({ videos: [], nextCursor: null, hasNextPage: false });
    }

    const videos = await prisma.video.findMany({
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      where: { userId: { in: followedUserIds } },
      include: videoWithDetails,
      orderBy: { id: 'desc' }, // ← FIXED: was createdAt, now id
    });

    const hasNextPage = videos.length > limit;
    const results = hasNextPage ? videos.slice(0, limit) : videos;
    const nextCursor = hasNextPage ? results[results.length - 1].id : null;

    res.json({ videos: results, nextCursor, hasNextPage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/videos — upload to Supabase
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail?.[0];

    // Upload video to Supabase
    const videoUpload = await uploadFile(
      'videos',
      videoFile.buffer,
      videoFile.originalname,
      videoFile.mimetype
    );

    // Upload thumbnail if provided
    let thumbnailUpload = null;
    if (thumbnailFile) {
      thumbnailUpload = await uploadFile(
        'thumbnails',
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        thumbnailFile.mimetype
      );
    }

    const video = await prisma.video.create({
      data: {
        title: req.body.title || 'Untitled',
        description: req.body.description || '',
        videoUrl: videoUpload.url,
        videoStoragePath: videoUpload.storagePath,
        thumbnail: thumbnailUpload?.url || null,
        thumbnailStoragePath: thumbnailUpload?.storagePath || null,
        userId: req.user.id,
      },
      include: videoWithDetails,
    });

    res.status(201).json(video);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/videos/:id/like
exports.likeVideo = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const userId = req.user.id;

    const existing = await prisma.videoLike.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await prisma.videoLike.delete({
        where: { userId_videoId: { userId, videoId } },
      });
      return res.json({ liked: false });
    }

    await prisma.videoLike.create({ data: { userId, videoId } });
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/videos/:id/comments
exports.getComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { videoId: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/videos/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId: req.user.id,
        videoId: parseInt(req.params.id),
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/videos/:id
exports.deleteVideo = async (req, res) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete files from Supabase
    await deleteFile('videos', video.videoStoragePath);
    await deleteFile('thumbnails', video.thumbnailStoragePath);

    await prisma.video.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};