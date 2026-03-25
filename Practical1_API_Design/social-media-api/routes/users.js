// routes/users.js
const express = require('express');
const router = express.Router();

// Import controller functions from userController
const { createUser, getUser, updateUser, deleteUser } = require('../controllers/userController');

// Routes

// Create a new user
router.post('/', createUser);

// Get a user by ID
router.get('/:id', getUser);

// Update a user by ID
router.put('/:id', updateUser);

// Delete a user by ID
router.delete('/:id', deleteUser);

module.exports = router;