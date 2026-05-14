const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ── CORS — allow localhost and any network IP ────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow everything in development
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    // In production, only allow specific origins
    const allowed = ['http://localhost:3000'];
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded videos and images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong' });
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Network access at http://<your-ip>:${PORT}`);
});