const dataStore = require('../models');

const getAllComments = (req, res) => {
  res.status(200).json(dataStore.comments);
};

const getCommentById = (req, res) => {
  const commentId = parseInt(req.params.id);
  const comment = dataStore.comments.find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  res.status(200).json(comment);
};

const createComment = (req, res) => {
  const { userId, videoId, text } = req.body;
  if (!userId || !videoId || !text) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  const user = dataStore.users.find(u => u.id === parseInt(userId));
  const video = dataStore.videos.find(v => v.id === parseInt(videoId));
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const newComment = {
    id: dataStore.nextIds.comments++,
    userId: user.id,
    videoId: video.id,
    text,
    createdAt: new Date().toISOString()
  };
  dataStore.comments.push(newComment);
  res.status(201).json(newComment);
};

const updateComment = (req, res) => {
  const commentId = parseInt(req.params.id);
  const commentIndex = dataStore.comments.findIndex(c => c.id === commentId);
  if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

  const { text } = req.body;
  const comment = dataStore.comments[commentIndex];
  if (text) comment.text = text;
  comment.updatedAt = new Date().toISOString();
  res.status(200).json(comment);
};

const deleteComment = (req, res) => {
  const commentId = parseInt(req.params.id);
  const commentIndex = dataStore.comments.findIndex(c => c.id === commentId);
  if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

  dataStore.comments.splice(commentIndex, 1);
  res.status(204).end();
};

const getVideoComments = (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const video = dataStore.videos.find(v => v.id === videoId);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const comments = dataStore.comments.filter(c => c.videoId === videoId);
  res.status(200).json(comments);
};

const getUserComments = (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = dataStore.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const comments = dataStore.comments.filter(c => c.userId === userId);
  res.status(200).json(comments);
};

module.exports = {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  getVideoComments,
  getUserComments
};
