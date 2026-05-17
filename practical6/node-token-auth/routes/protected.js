const express = require('express');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/profile', verifyToken, (req, res) => {
  res.json({
    message: 'Welcome! You accessed a protected route.',
    user: req.user,
  });
});

module.exports = router;