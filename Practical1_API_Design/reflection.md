# Reflection — Designing and Implementing RESTful API Endpoints (Social Media API)

## Introduction

This practical required building a RESTful API for a social media platform from scratch — starting with a design phase (filling in endpoint tables) and progressing through project setup, mock data, middleware, controllers, routes, content negotiation, and an HTML documentation page. It was the most structured backend lab so far, and the step-by-step scaffolding revealed how each piece of a production-oriented Express server fits together.

---

## Part 1 — The Design Phase

The lab began with a design task before any code was written: for each resource (Users, Posts, Comments, Likes, Followers), define the URI, HTTP method, request body, response body, and description. Filling in this table forced me to think carefully about each endpoint as a **contract** — a promise the server makes to every client about what it will accept and what it will return.

The most instructive part of the design phase was deciding which HTTP method maps to which operation:

- `GET` — retrieve data, no side effects, safe to call repeatedly
- `POST` — create a new resource, not idempotent (calling twice creates two records)
- `PUT` — replace/update an existing resource, idempotent (calling twice with the same body leaves the resource unchanged)
- `DELETE` — remove a resource, idempotent (deleting an already-deleted resource results in 404, not an error cascade)

Writing this out in a table before implementing it meant the controller code was almost mechanical to write — I already knew exactly what each function needed to do.

---

## What I Learned

### The Importance of Middleware Order

The single most confusing thing about Express for me was understanding that middleware executes in **registration order**. The error handler must come **last** — after all routes — because it only fires when a route handler calls `next(err)`. I initially registered it before the routes and could not understand why errors were reaching the browser as HTML `Cannot GET /` pages instead of my JSON error format.

Once I understood the rule — `app.use(errorHandler)` is always the final line — the whole middleware pipeline made sense: request enters at the top, flows through each `app.use()` in order, and reaches the matching route handler. If a handler calls `next(err)`, execution skips all remaining regular middleware and jumps to the error handler.

### The `asyncHandler` Wrapper — Why It Exists

Without `asyncHandler`, every async controller function needs its own `try-catch`:

```js
exports.getUsers = async (req, res, next) => {
  try {
    // ... logic
  } catch (err) {
    next(err);
  }
};
```

With `asyncHandler`, the wrapper does this automatically:

```js
exports.getUsers = asyncHandler(async (req, res, next) => {
  // ... logic — no try-catch needed
});
```

This is the **decorator pattern**: wrapping a function to add behaviour (error forwarding) without modifying it. Once I understood what `asyncHandler` was doing, I could see how it kept every controller function clean and focused on its actual job rather than boilerplate error handling.

### Custom `ErrorResponse` Class

Extending the built-in `Error` class to add a `statusCode` property was a small but important design decision:

```js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

This means the `errorHandler` middleware can read `error.statusCode` and respond with the correct HTTP status without any extra conditional logic. The error carries its own status code — it is self-describing.

### Content Negotiation

The `formatResponse` middleware overrides `res.json()` to check the `Accept` request header. If the client requests `application/xml`, the response is converted to XML before sending. This taught me that **HTTP is a negotiation protocol** — the client communicates what format it wants, and the server decides whether to honour it. JSON and XML are both just representations of the same underlying data.

The `convertToXml` function had to handle three cases: flat key-value pairs, arrays of objects, and nested objects. Getting the recursive logic right for arrays (wrapping each element in `<item>` tags) was the trickiest part.

### Pagination

Returning all records in one response does not scale. The pagination implementation uses `Array.slice()` with calculated `startIndex` and `endIndex` values, then builds a `pagination` object with `next` and `prev` page pointers:

```js
if (endIndex   < total) pagination.next = { page: page + 1, limit };
if (startIndex > 0)     pagination.prev = { page: page - 1, limit };
```

The `pagination` object is only populated when there is actually a next or previous page — it is not included if the current page is the only page. This matches how real APIs like GitHub's REST API work.

### Data Enrichment in `getPosts`

Returning raw post data that only contains a `user_id` is not useful to a frontend. The `postController` enhances each post by joining it with the user data:

```js
const enhancedResults = results.map(post => {
  const user = users.find(u => u.id === post.user_id);
  return {
    ...post,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      profile_picture: user.profile_picture
    }
  };
});
```

This is what a database `JOIN` does — combining data from two sources into a single response. Doing it manually in JavaScript made me appreciate why ORMs and query builders exist.

---

## Challenges Faced

### `router.route()` Chaining

The route chaining syntax was unfamiliar at first:

```js
router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);
```

I initially wrote separate `router.get()`, `router.post()`, etc. calls for each method, which works but is more verbose. The chained version is cleaner and makes it immediately obvious which methods are supported on each URI.

### Simulating Authentication with `X-User-Id`

Using `req.header('X-User-Id')` as a simulated token is obviously not secure — any client can send any user ID in a plain header. But implementing it this way was instructive: it showed exactly where real authentication would slot in. In a real system, this header would be replaced by a JWT token, and a dedicated `protect` middleware would verify the token signature and extract the user ID from the verified payload before the route handler ever runs.

### The XML Conversion Edge Cases

The hand-rolled `convertToXml` function in `formatResponse.js` works for simple objects and arrays of objects, but it does not handle special XML characters (`<`, `>`, `&`) in values. If a user's `bio` contained `<script>`, the XML output would be malformed. In a production system, a library like `fast-xml-parser` or `xml2js` would handle these edge cases automatically.

### Unhandled Promise Rejections

Early in development, before I fully understood `asyncHandler`, I had an unhandled promise rejection that crashed the server silently instead of returning an error response. The `process.on('unhandledRejection')` handler in `server.js` caught it and logged it, but the root fix was wrapping all async controllers in `asyncHandler`. This experience made the value of the wrapper immediately tangible — it was not an abstract pattern, it was the fix to a real bug.

---

## Mistakes Made and Lessons Learned

| Mistake | Lesson |
|---------|--------|
| Registered `errorHandler` before routes | Error middleware must always be the **last** `app.use()` call |
| Wrote `try-catch` in every controller before learning `asyncHandler` | Use `asyncHandler` from the start — it removes all boilerplate error handling |
| Compared `req.params.id` (string) with `user.id` (number) using `===` | Always parse ID params with `parseInt()` before strict comparison |
| Did not return `next(error)` — just called `next(error)` | Without `return`, code after `next()` continues to execute; always use `return next(error)` |
| Forgot `module.exports` at the bottom of controller files | Always export before testing routes — a missing export causes a silent `undefined is not a function` crash |

---

## What I Would Do Differently

- **Add input validation middleware.** Using a schema validation library like `joi` or `zod` as dedicated middleware would keep validation rules explicit and out of controller logic entirely.
- **Write tests from the start.** Using `jest` + `supertest`, I would write a test for each endpoint — checking status codes, response shape, and error cases. This would have caught the `parseInt` bug and the missing `module.exports` immediately.
- **Use a real database.** In-memory arrays reset on every server restart. Even SQLite with a simple ORM like `better-sqlite3` would add persistence without the complexity of a full database setup.
- **Implement proper JWT authentication.** The `X-User-Id` header simulation is useful for learning the pattern, but replacing it with real JWT-based auth (`jsonwebtoken` package) would make the project actually secure.
- **Add rate limiting.** A public API with no rate limiting can be easily abused. `express-rate-limit` middleware would add this with just a few lines of configuration.

---

## Key Takeaway

This practical showed me that a well-designed Express API is a **system of composable layers** — each middleware and utility has a single, clear responsibility, and they work together through Express's `next()` mechanism. The `asyncHandler` catches errors, the `errorHandler` formats them, the `formatResponse` middleware transforms the output, and the controllers focus purely on business logic. Understanding how these layers compose together — and the exact order they must be registered — is what separates a working API from a maintainable, production-ready one.