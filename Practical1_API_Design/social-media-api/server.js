const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

// Custom middleware
app.use(require('./middleware/formatResponse'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Docs Route
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// Routes
app.use('/users', require('./routes/users'));
app.use('/posts', require('./routes/posts'));
// app.use('/comments', require('./routes/comments'));
// app.use('/likes', require('./routes/likes'));
// app.use('/followers', require('./routes/followers'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Social Media API' });
});

// Error handler middleware
app.use(require('./middleware/errorHandler'));
app.use(require('./middleware/formatResponse'));
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});