# Web-102

# Practical 1 — Designing and Implementing RESTful API Endpoints

## Overview

This project implements a fully functional **RESTful API** for a social media platform similar to Instagram using **Node.js** and **Express**. It covers the complete lifecycle of API development — from designing endpoint tables and URI structures, to implementing controllers with proper HTTP methods, status codes, pagination, content negotiation (JSON/XML), centralised error handling, and serving an HTML documentation page.

Resources covered: **Users**, **Posts**, **Comments**, **Likes**, and **Followers**.

---

## Objectives

1. Design RESTful API endpoints following best practices for URI design
2. Implement API endpoints with proper HTTP methods and status codes
3. Configure content negotiation with different MIME types (JSON and XML)
4. Set up proper request and response handling with pagination
5. Document API endpoints via a served HTML page

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `morgan` | HTTP request logger (dev mode) |
| `cors` | Cross-Origin Resource Sharing middleware |
| `helmet` | Adds security-related HTTP headers |
| `dotenv` | Loads environment variables from `.env` |
| `nodemon` *(dev)* | Auto-restarts server on file save |

---

## Project Structure

```
social-media-api/
├── server.js                        # Entry point — middleware stack, route mounting, server start
├── controllers/
│   ├── userController.js            # getUsers, getUser, createUser, updateUser, deleteUser
│   └── postController.js            # getPosts, getPost, createPost, updatePost, deletePost
├── routes/
│   ├── users.js                     # GET|POST /users  and  GET|PUT|DELETE /users/:id
│   └── posts.js                     # GET|POST /posts  and  GET|PUT|DELETE /posts/:id
├── middleware/
│   ├── errorHandler.js              # Centralised error response middleware
│   ├── formatResponse.js            # Content negotiation — JSON default, XML on request
│   └── async.js                     # Async wrapper — forwards rejections to errorHandler
├── utils/
│   ├── mockData.js                  # In-memory arrays: users[], posts[]
│   └── errorResponse.js             # Custom ErrorResponse class (extends Error)
├── config/                          # Reserved for future config modules
├── public/
│   └── docs.html                    # HTML API documentation page (served at /api-docs)
├── .env                             # PORT=3000
├── .gitignore                       # node_modules, .env, .DS_Store
└── package.json
```

---

## Setup and Installation

```bash
# 1. Create project directory
mkdir social-media-api
cd social-media-api

# 2. Initialise Node project
npm init -y

# 3. Install production dependencies
npm install express morgan cors helmet dotenv

# 4. Install dev dependency
npm install nodemon --save-dev

# 5. Create directory and file structure
mkdir -p controllers routes middleware config utils public
touch server.js .env .gitignore

# 6. Set up .env
 "PORT=3000" > .env

# 7. Set up .gitignore
"node_modules\n.env\n.DS_Store" > .gitignore
```

---

## package.json Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev":   "nodemon server.js"
}
```

---

## Environment Variables

```env
PORT=3000
```

---

## Part 1 — API Design

### Users Resource

| URI | Method | Description | Auth |
|-----|--------|-------------|------|
| `/users` | GET | List all users (paginated) | No |
| `/users` | POST | Create a new user | No |
| `/users/:id` | GET | Get a specific user by ID | No |
| `/users/:id` | PUT | Update a user | Simulated |
| `/users/:id` | DELETE | Delete a user | Simulated |

**GET /users — Request:**
```
Header: Authorization: Bearer {token}
Query:  ?page=1&limit=10
```

**GET /users — Response (200 OK):**
```json
{
  "success": true,
  "count": 50,
  "page": 1,
  "total_pages": 5,
  "data": [
    {
      "id": "1",
      "username": "traveler",
      "full_name": "Karma",
      "profile_picture": "https://example.com/profiles/traveler.jpg",
      "bio": "Travel photographer",
      "created_at": "2023-01-15"
    }
  ]
}
```

**POST /users — Request Body:**
```json
{
  "username": "new_traveler",
  "email": "new@example.com",
  "password": "securepassword",
  "full_name": "New Traveler",
  "bio": "Adventure seeker"
}
```

**POST /users — Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "4",
    "username": "new_traveler",
    "full_name": "New Traveler",
    "created_at": "2023-03-20"
  }
}
```

---

### Posts Resource

| URI | Method | Description | Auth |
|-----|--------|-------------|------|
| `/posts` | GET | List all posts (paginated, with user data) | No |
| `/posts` | POST | Create a new post | Yes (`X-User-Id` header) |
| `/posts/:id` | GET | Get a specific post | No |
| `/posts/:id` | PUT | Update a post (owner only) | Yes (`X-User-Id` header) |
| `/posts/:id` | DELETE | Delete a post (owner only) | Yes (`X-User-Id` header) |

> **Authentication simulation:** Protected routes require the `X-User-Id` request header. Missing header → `401 Unauthorized`. Mismatched owner → `401 Unauthorized`.

---

## Part 2 — Implementation Details

### `server.js` — Middleware Stack Order

```js
app.use(express.json());                              // parse JSON bodies
app.use(morgan('dev'));                               // HTTP request logging
app.use(helmet());                                   // security headers
app.use(cors());                                     // cross-origin requests
app.use(require('./middleware/formatResponse'));      // content negotiation

app.use(express.static('public'));                   // serve docs.html
app.get('/api-docs', (req, res) => res.sendFile(...));

app.use('/users', require('./routes/users'));         // user routes
app.use('/posts', require('./routes/posts'));         // post routes

app.use(require('./middleware/errorHandler'));        // MUST be last
```

> **Critical:** `errorHandler` must be registered **after** all routes — Express identifies it as error middleware by its 4-parameter signature `(err, req, res, next)`.

---

### `middleware/async.js` — Async Handler

Wraps every async controller function so unhandled promise rejections are automatically forwarded to `errorHandler` — eliminating the need for `try-catch` in every controller:

```js
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
```

---

### `utils/errorResponse.js` — Custom Error Class

```js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
```

---

### `middleware/errorHandler.js` — Centralised Error Handler

```js
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.log(err);

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
```

---

### `middleware/formatResponse.js` — Content Negotiation

Intercepts all `res.json()` calls. Returns **XML** when the client sends `Accept: application/xml`, otherwise defaults to **JSON**:

```js
const formatResponse = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(obj) {
    const acceptHeader = req.headers.accept;

    if (acceptHeader && acceptHeader.includes('application/xml')) {
      // convert obj to XML string and send
      res.set('Content-Type', 'application/xml');
      return res.send(convertToXml(obj));
    } else {
      res.set('Content-Type', 'application/json');
      return originalJson.call(this, obj);
    }
  };

  next();
};
```

---

### `controllers/userController.js` — Key Functions

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| `getUsers` | GET | `/users` | Paginated list using `slice(startIndex, endIndex)` |
| `getUser` | GET | `/users/:id` | Find by ID; 404 if not found via `ErrorResponse` |
| `createUser` | POST | `/users` | Check username uniqueness; push to array; return 201 |
| `updateUser` | PUT | `/users/:id` | Spread existing + `req.body`; preserve `id` |
| `deleteUser` | DELETE | `/users/:id` | `splice()` from array; return `data: {}` |

**Pagination logic (used in both `getUsers` and `getPosts`):**
```js
const page       = parseInt(req.query.page,  10) || 1;
const limit      = parseInt(req.query.limit, 10) || 10;
const startIndex = (page - 1) * limit;
const endIndex   = page * limit;
const total      = users.length;
const results    = users.slice(startIndex, endIndex);

const pagination = {};
if (endIndex   < total) pagination.next = { page: page + 1, limit };
if (startIndex > 0)     pagination.prev = { page: page - 1, limit };
```

---

### `controllers/postController.js` — Key Features

- **Data enrichment:** Each post in `getPosts` and `getPost` is enhanced with the author's `username`, `full_name`, and `profile_picture` by joining on `post.user_id === user.id`
- **Auth simulation:** `createPost`, `updatePost`, `deletePost` read `req.header('X-User-Id')` and return `401` if absent
- **Ownership check:** `updatePost` and `deletePost` verify `post.user_id === userId` before allowing the operation

---

### Routes — `router.route()` Chaining

```js
// routes/users.js
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);
```

This chains multiple HTTP methods on the same URI — clean and concise.

---

## HTTP Status Codes Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Missing/invalid fields |
| 401 | Unauthorized | Missing or invalid `X-User-Id` header |
| 404 | Not Found | Resource with given ID does not exist |
| 500 | Internal Server Error | Unhandled exceptions |

---

## API Documentation Page

A static HTML documentation page is served at:

```
http://localhost:3000/api-docs
```

Located at `public/docs.html`. It documents endpoints with colour-coded HTTP method badges (GET=blue, POST=green, PUT=orange, DELETE=red), parameter tables, and example request/response bodies.

---

## Running the Server

```bash
# Development (auto-restarts on save)
npm run dev

# Production
npm start
```

**Expected output:**
```
Server running in development mode on port 3000
```

Visit `http://localhost:3000` for the welcome message.

---

## Extending to Other Resources

To add **Comments**, **Likes**, or **Followers**:

1. Add data arrays to `utils/mockData.js`
2. Create `controllers/commentController.js` following the same `asyncHandler` pattern
3. Create `routes/comments.js` using `router.route()` chaining
4. Uncomment and mount in `server.js`:
   ```js
   app.use('/comments',  require('./routes/comments'));
   app.use('/likes',     require('./routes/likes'));
   app.use('/followers', require('./routes/followers'));
   ```