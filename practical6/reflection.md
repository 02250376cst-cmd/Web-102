 # Reflection — Token-Based Authentication Lab



---

## 1. What I Did

In this lab, I built a complete token-based authentication system from scratch using Node.js and Express. The system included three main components: a registration endpoint that securely hashes user passwords, a login endpoint that issues a signed JSON Web Token, and a protected profile route that only allows access to users with a valid token.

I also completed the homework extension by adding a `name` field to the registration flow and creating a `GET /auth/users` route that returns all registered users without exposing their passwords.

All endpoints were tested manually using Thunder Client inside VS Code.

> ![alt text](<Screenshot 2026-05-17 121653.png>)


---

## 2. What I Learned

### 2.1 How JWT Authentication Works

Before this lab, I understood that websites have login systems, but I did not know the technical mechanism behind them. I now understand the full flow: the server does not remember who you are between requests. Instead, it gives you a signed token after login, and you carry that token with every future request. The server only needs to check the signature — it does not need to store any session.

The three-part structure of a JWT (header, payload, signature) was something I found particularly interesting. Visiting [jwt.io](https://jwt.io) and seeing my own token decoded in real time made the concept very concrete. I could see my `email`, `id`, `iat` (issued at time), and `exp` (expiry) in plain text, which reinforced the lesson that **JWT payloads are not secret** — anyone who intercepts a token can read the payload.

### 2.2 Why Passwords Must Be Hashed

I had heard of password hashing before but never implemented it. After registering a user and inspecting the stored value in the `users` array, seeing:

```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lLqq
```

...instead of `123456` was a clear demonstration. I understand now that bcrypt is a **one-way function** — there is no way to reverse it to get the original password. This means even if a database is stolen, the attacker still does not have the actual passwords.

### 2.3 Middleware Pattern in Express

The `verifyToken` middleware function was one of the most valuable things I learned in this lab. The idea that a function can intercept a request, inspect it, and either pass it forward with `next()` or stop it with an error response is a very clean and reusable pattern. I can see how this same pattern would apply to role-based access control, logging, and rate limiting in real applications.

### 2.4 HTTP Status Codes Have Specific Meanings

I used to think `401` and `403` were interchangeable "access denied" errors. This lab clarified the distinction: `401` means the server does not know who you are (no token), while `403` means the server knows who you are but is refusing access (invalid or expired token). Using the correct status code is important for clients and debugging tools to interpret responses correctly.

<!-- 📸 INSERT SCREENSHOT: Thunder Client showing the 401 response (Test 4) -->
> ![401 vs 403 Responses](./screenshots/test4-no-token.png)
> ![401](<Screenshot 2026-05-17 113700-1.png>)
>![403](<Screenshot 2026-05-17 113805-1.png>)

---

## 3. Challenges I Faced

### Challenge 1 — Token Not Being Sent Correctly

When I first attempted Test 3 (accessing the protected `/profile` route), I kept getting a `401 Access denied` response even though I had logged in and received a token. After checking, I realised I had not correctly formatted the Authorization header. The correct format is:

```
Authorization: Bearer <token>
```

There must be a space between `Bearer` and the token. I had initially forgotten the space. Once corrected, the request worked immediately.

> ![Authorization Header Fix](<Screenshot 2026-05-17 113608-1.png>)

### Challenge 2 — Users Disappearing After Server Restart

When I ran Test 7 (GET /auth/users), only one user appeared even though I had registered two. I realised this was because I had restarted the server between tests, which wiped the in-memory `users` array. The fix was simple — register both users again in the same session before calling the users endpoint.

This experience made me immediately understand why real applications use databases. An in-memory array is not suitable for production use because all data is lost on every server restart.

### Challenge 3 — Understanding the Middleware Flow

At first, I was not sure how `verifyToken` worked as a second argument in the route definition:

```js
router.get('/profile', verifyToken, (req, res) => { ... });
```

After reading through the code carefully, I understood that Express processes middleware functions in order. `verifyToken` runs first. If it calls `next()`, the main handler runs. If it sends a response (with `return res.status(401)...`), the main handler never runs. This "chain" concept was new to me and I found it very useful.

---

## 4. What I Would Do Differently

- **Use a database:** I would replace the in-memory `users` array with MongoDB or SQL so that data persists across server restarts.

- **Add token refresh:** The current implementation issues a token that expires after 1 day and cannot be renewed without logging in again. A refresh token system would improve the user experience.

- **Add input validation:** Currently the server only checks if fields are present. I would use a library like `express-validator` to also check email format, password length, and sanitize inputs against injection attacks.

- **Use HTTPS:** JWT tokens are sent in plain text over HTTP in this lab. In production, HTTPS is essential to prevent tokens from being intercepted during transmission.

- **Add a logout mechanism:** Since JWT is stateless, there is no server-side logout. I would implement a token blacklist (using Redis or a database table) to allow users to invalidate their token before it expires.0

---

## 5. Overall Experience


This was one of the most practical labs I have completed. Unlike theoretical exercises, building and testing a real API made the concepts stick immediately. Seeing the server reject a request with a fake token, and then accept the same request with a valid token, made the security model very clear.

The most important takeaway for me is understanding that **security is about layers** — hashing passwords, signing tokens, verifying signatures, using proper HTTP status codes, and never exposing sensitive data. Each layer serves a purpose, and removing any one of them weakens the system.

---
