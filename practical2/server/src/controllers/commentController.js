const dataStore = require('../models');

const getAllComments = (req, res) => res.status(200).json(dataStore.comments);

const getCommentById = (req, res) => {
  const comment = dataStore.comments.find(c => c.id === parseInt(req.params.id));
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  res.json(comment);
};

const createComment = (req, res) => {
  const { text, userId, videoId } = req.body;
  if (!text || !userId || !videoId) return res.status(400).json({ error: 'Required fields missing' });

  const newComment = {
    id: dataStore.nextIds.comments++,
    text,
    userId,
    videoId,
    likes: [],
    createdAt: new Date().toISOString()
  };
  dataStore.comments.push(newComment);

  // Attach comment to video
  const video = dataStore.videos.find(v => v.id === videoId);
  if (video) video.comments.push(newComment.id);

  res.status(201).json(newComment);
};

const updateComment = (req, res) => {
  const comment = dataStore.comments.find(c => c.id === parseInt(req.params.id));
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const { text } = req.body;
  if (text) comment.text = text;
  comment.updatedAt = new Date().toISOString();

  res.json(comment);
};

const deleteComment = (req, res) => {
  const commentId = parseInt(req.params.id);
  dataStore.comments = dataStore.comments.filter(c => c.id !== commentId);

  // Remove from video’s comment list
  dataStore.videos.forEach(v => {
    v.comments = v.comments.filter(cid => cid !== commentId);
  });

  res.status(204).end();
};

module.exports = { getAllComments, getCommentById, createComment, updateComment, deleteComment };
