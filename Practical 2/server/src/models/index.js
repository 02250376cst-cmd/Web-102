// In-memory data (no database yet)

// Users
const users = [
  {
    id: 1,
    username: "proko",
    email: "proko@gmail.com",
    password: "123456",
    createdAt: new Date(),
  },
  {
    id: 2,
    username: "sonam",
    email: "sonam@gmail.com",
    password: "123456",
    createdAt: new Date(),
  },
];

// Posts
const posts = [
  {
    id: 1,
    userId: 1,
    content: "Hello, this is my first post!",
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 2,
    content: "Welcome to the social media API 🚀",
    createdAt: new Date(),
  },
];

// Comments
const comments = [
  {
    id: 1,
    postId: 1,
    userId: 2,
    text: "Nice post bro!",
    createdAt: new Date(),
  },
];

// Likes
const likes = [
  {
    id: 1,
    postId: 1,
    userId: 2,
  },
];

// Export all models
module.exports = {
  users,
  posts,
  comments,
  likes,
};