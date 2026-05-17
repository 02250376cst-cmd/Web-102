# Reflection — Practical 2: TikTok REST API Design and Implementation

## Introduction

This practical required designing and implementing a full RESTful backend API for a TikTok-like platform using Node.js and Express. Unlike previous practicals that focused on the frontend, this one was entirely server-side — no browser rendering, no React, just HTTP requests and responses. It was a significant shift in mindset and one of the more challenging labs so far.

---

## The Design Phase

Before writing any code, I had to design the API endpoint table: which URIs to expose, which HTTP methods to support, and what request/response bodies to expect. This design-first approach was new to me and initially felt like unnecessary extra work. In hindsight it was the most important step.

Designing the endpoints forced me to think about **resource relationships**. For example:
- Should comments be nested under `/api/videos/:id/comments` or always accessed at `/api/comments`?
- Should likes be a sub-resource (`/api/videos/:id/likes`) or a field on the video object?

I decided to support both patterns — a top-level `/api/comments` for general access and `/api/videos/:id/comments` as a convenient sub-resource for fetching a video's comments. This is consistent with how real APIs like Twitter's and YouTube's are structured.

---

## What I Learned

### REST Constraints Are Intentional

REST is not just a set of naming conventions — it is a set of architectural constraints. The most important ones I applied:
- **Uniform interface**: every resource uses the same HTTP verbs with consistent meaning (GET = read, POST = create, PUT = update, DELETE = remove)
- **Statelessness**: the server holds no session state; every request carries all the information needed to process it
- **Resource-based URIs**: URIs identify things (`/videos/1`), not actions (`/getVideo?id=1`)

### Express Router and Controller Separation

Separating route definitions (`src/routes/`) from handler logic (`src/controllers/`) made the codebase significantly cleaner. The routes file is just a list of endpoint definitions, and the controller file contains all the business logic. This pattern scales well — adding a new endpoint means adding one line to the routes file and one function to the controller.

### In-Memory Data and Its Limitations

Using a plain JavaScript array as a database was convenient for getting the API running quickly, but it exposed important limitations:
- All data is **lost when the server restarts** — there is no persistence
- There are no transactions — two simultaneous requests could corrupt the data (race conditions)
- Querying is O(n) — finding a user by ID requires scanning the entire array

These are the exact problems that databases (SQL or NoSQL) solve. This practical made me appreciate why a database is essential for any real application.

### Cascade Deletes

When deleting a user, I had to remove their videos, their comments, and also remove them from the `followers`/`following` arrays of every other user. Getting this right required careful thought about data integrity. In a real database, this would be handled by foreign key constraints or cascade rules.

---

## Challenges Faced

### Designing Sub-Resource Routes

Deciding which operations belong on sub-resources (e.g., `/api/videos/:id/likes`) versus the top-level resource was not always obvious. I resolved this by asking: "Is this operation logically scoped to a specific parent resource?" If yes, it becomes a sub-resource route. Likes and comments are meaningless without their parent video, so they belong under `/api/videos/:id/`.

### Preventing Duplicate Likes

Allowing a user to like the same video multiple times would corrupt the data. I added a check using `Array.includes()` before pushing a new like, and returned HTTP 409 (Conflict) if the like already exists. This was a good introduction to **idempotency** — the idea that some operations (like liking) should be safe to call multiple times without producing unintended side effects.

### Follow/Unfollow Bi-Directional State

A follow relationship is bi-directional: when User A follows User B, User B's `followers` array gains User A's ID, AND User A's `following` array gains User B's ID. Forgetting to update one side caused the data to become inconsistent. I resolved this by always updating both arrays in the same controller function — making the relationship "atomic" within the function body.

### Validating Request Bodies

Early versions of the controller trusted all incoming data. Later I added validation (`if (!title || !url || !userId) return res.status(400)...`) to reject incomplete requests. This is critical for real APIs — never trust client-supplied data.

---

## Mistakes Made and Lessons Learned

| Mistake | Lesson |
|---------|--------|
| Wrote routes and controllers in the same file initially | Separate concerns from the start — routes file = "what", controller = "how" |
| Forgot to delete associated data when deleting a user | Always think about cascade effects when deleting a resource |
| Returned 200 for resource creation | Use 201 Created for POST responses that create a new resource |
| Used `req.params.id` as a string without parsing | Always `parseInt()` ID params before comparing to numeric IDs in the data store |

---

## What I Would Do Differently

- **Add input sanitisation.** The current validation only checks for presence of required fields. A real API should also sanitise inputs (strip HTML, check length limits, validate email format).
- **Use a proper database.** Even a lightweight embedded database like SQLite would add persistence and remove the data-loss-on-restart problem.
- **Write automated tests.** Using a tool like Postman's test runner or Jest + Supertest would let me verify all endpoints work correctly after every change, rather than manually re-running curl commands.
- **Add pagination from the start.** Returning all videos or users in a single response will not scale. Pagination (`?page=1&limit=10`) should be a first-class design decision, not an afterthought.

---

## Key Takeaway

Building an API from scratch — designing the URIs, choosing the right HTTP methods, handling edge cases like duplicates and missing resources, and structuring the codebase for maintainability — gave me a much deeper understanding of how web services actually work. Every time I use a third-party API in a frontend project, I now think about the design decisions the server team made and why.