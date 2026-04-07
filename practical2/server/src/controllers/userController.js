const dataStore = require('../models');

const getAllUsers = (req, res) => {
  res.status(200).json(dataStore.users);
};

const getUserById = (req, res) => {
  const userId = parseInt(req.params.id);
  const user = dataStore.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.status(200).json(user);
};

const createUser = (req, res) => {
  const { username, email, name } = req.body;
  if (!username || !email) return res.status(400).json({ error: 'Required fields missing' });

  const newUser = {
    id: dataStore.nextIds.users++,
    username,
    email,
    name: name || username,
    followers: [],
    following: [],
    createdAt: new Date().toISOString()
  };

  dataStore.users.push(newUser);
  res.status(201).json(newUser);
};

const updateUser = (req, res) => {
  const userId = parseInt(req.params.id);
  const user = dataStore.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  user.updatedAt = new Date().toISOString();

  res.status(200).json(user);
};

const deleteUser = (req, res) => {
  const userId = parseInt(req.params.id);
  dataStore.users = dataStore.users.filter(u => u.id !== userId);
  res.status(204).end();
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
