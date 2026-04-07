const dataStore = require('../models');

const getAllVideos = (req, res) => res.status(200).json(dataStore.videos);

const getVideoById = (req, res) => {
  const video = dataStore.videos.find(v => v.id === parseInt(req.params.id));
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(video);
};

const createVideo = (req, res) => {
  const { title, url, userId } = req.body;
  if (!title || !url || !userId) return res.status(400).json({ error: 'Required fields missing' });

  const newVideo = {
    id: dataStore.nextIds.videos++,
    title,
    url,
    userId,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };
  dataStore.videos.push(newVideo);
  res.status(201).json(newVideo);
};

const updateVideo = (req, res) => {
  const video = dataStore.videos.find(v => v.id === parseInt(req.params.id));
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const { title, url } = req.body;
  if (title) video.title = title;
  if (url) video.url = url;
  video.updatedAt = new Date().toISOString();

  res.json(video);
};

const deleteVideo = (req, res) => {
  dataStore.videos = dataStore.videos.filter(v => v.id !== parseInt(req.params.id));
  res.status(204).end();
};

module.exports = { getAllVideos, getVideoById, createVideo, updateVideo, deleteVideo };
