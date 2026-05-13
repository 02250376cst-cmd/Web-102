const prisma = require('../lib/prisma');

const videoWithDetails = {
  user: {
    select: { id: true, username: true, name: true, avatar: true },
  },
  _count: {
    select: { likes: true, comments: true },
  },
};

// GET /api/videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      include: videoWithDetails,
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/videos/following
exports.getFollowingVideos = async (req, res) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true },
    });

    const followedUserIds = follows.map((f) => f.followingId);

    if (followedUserIds.length === 0) {
      return res.json([]);
    }

    const videos = await prisma.video.findMany({
      where: { userId: { in: followedUserIds } },
      include: videoWithDetails,
      orderBy: { createdAt: 'desc' },
    });

    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/videos
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const videoUrl = `/uploads/${req.files.video[0].filename}`;
    const thumbnail = req.files.thumbnail
      ? `/uploads/${req.files.thumbnail[0].filename}`
      : null;

    const video = await prisma.video.create({
      data: {
        title: req.body.title || 'Untitled',
        description: req.body.description || '',
        videoUrl,
        thumbnail,
        userId: req.user.id,
      },
      include: videoWithDetails,
    });

    res.status(201).json(video);
  } catch (err) {
    console.error(err);
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
    if (!text || !text.trim()) {
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

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    await prisma.video.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};