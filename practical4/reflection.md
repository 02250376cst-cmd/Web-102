
## Practical 4: Connecting TikTok to PostgreSQL with Prisma ORM

---

## Overview

This practical had me building the entire backend for a TikTok clone. I went from zero to a fully working REST API with persistent database storage, JWT authentication, file uploads, and all the social features — likes, comments, follows. It was a big step up from the in-memory data I was using before, and honestly it felt like the point where the project started feeling like a real application rather than just an exercise.

---

## What I Learned

### Prisma ORM and Database Migrations

I had never used an ORM before this practical, so Prisma was completely new to me. The thing that clicked first was how the `schema.prisma` file works as a single source of truth for the entire database structure. I defined my models once — User, Video, Comment, VideoLike, CommentLike, Follow — and Prisma handled generating all the SQL to actually create those tables.

The migration system was something I really appreciated once I understood it. Every time I ran `npx prisma migrate dev`, it created a versioned SQL file that tracked exactly what changed in the schema. It's like git but for your database structure, which makes a lot of sense for a real project where the schema evolves over time.

The trickiest model to design was `Follow`. I needed a self-referential many-to-many relationship on the `User` model — a user can follow many users, and be followed by many users. In Prisma this required two separate named relations (`"follower"` and `"following"`) pointing back at the same model, which wasn't obvious from the documentation at first.

### JWT Authentication Flow

Building authentication from scratch properly was one of the most valuable parts of this practical. I implemented the full flow myself:

1. User registers — password gets hashed with bcrypt before saving
2. User logs in — bcrypt compares the submitted password to the stored hash
3. Server generates a JWT signed with a secret key
4. Client stores the token and sends it in the `Authorization: Bearer` header on every request
5. The `auth.js` middleware verifies the token before allowing access to protected routes

Understanding each step and why it works made authentication feel a lot less like a black box. I particularly liked how stateless JWT is — the server doesn't need to store sessions anywhere, it just verifies the signature on the token each time.

### File Uploads with Multer

Setting up video uploads was more involved than I expected. I used Multer with a custom disk storage configuration that controls both where files get saved and how they're named. I added file type filtering so only video files can be uploaded to the video field and only images to the thumbnail field, plus a 100MB size limit.

Serving the uploaded files back as static files using `express.static` was the other piece — without that, the frontend can't actually load the videos from the server.

### REST API Design

Designing the API endpoints made me think more carefully about how routes should be structured. Things like making `GET /api/videos` public but `POST /api/videos` protected, or using the same `POST /api/videos/:id/like` endpoint for both liking and unliking (toggling) rather than having separate like and unlike routes — these felt like real decisions, not just following a template.

---

## Challenges I Faced

### Prisma Version 7 Was Completely Different

This was by far the biggest issue I ran into. When I ran `npx prisma init`, it installed version 7, but the practical guide was written for version 6. In Prisma 7, the `url = env("DATABASE_URL")` line inside `schema.prisma` no longer works — the whole connection configuration moved to a separate `prisma.config.ts` file using a driver adapter.

I got an error I'd never seen before:

```
The datasource property `url` is no longer supported in schema files.
```

I had to figure out what `prisma.config.ts` was, install `@prisma/adapter-pg` and `pg`, and rewrite both the config file and the `prisma.js` library file to use the new adapter pattern. The same issue also broke the seed script because every file that creates a `PrismaClient` instance needs the adapter passed in — it wasn't obvious that this applied to seed files too, not just the main app.

It took a while to work through but I understand the new pattern now. Prisma 7 separates "what your schema looks like" from "how you connect to the database," which actually makes more sense architecturally.

### PostgreSQL Permissions

After fixing the Prisma config, I hit two separate permission errors when running migrations. First:

```
ERROR: permission denied to create database
```

Prisma needs to create a temporary shadow database during migrations. My `tiktok_app_user` didn't have that permission, so I had to run `ALTER USER tiktok_app_user CREATEDB` as the postgres superuser.

Then a second error:

```
ERROR: permission denied for schema public
```

Database-level permissions and schema-level permissions are separate in PostgreSQL, which I didn't know before. I had to also run `GRANT ALL ON SCHEMA public TO tiktok_app_user`. Once both were set, migrations ran cleanly.

### Route Ordering Bug

I had a subtle bug in `userRoutes.js` where the `/me` route was being matched by the `/:id` route before it could be reached. Express matches routes in the order they're defined, so `GET /users/me` was being treated as `GET /users/:id` with `id = "me"`, which then failed when it tried to do `parseInt("me")`.

The fix was simple — define `/me` before `/:id` in the routes file — but finding the bug took longer than fixing it.

### CORS for Network Access

When I tried to access the app from another device on the same network using the machine's IP address, all API calls failed with CORS errors. My server was only allowing `localhost:3000` as an origin, and it was also only listening on `localhost` instead of `0.0.0.0`.

I fixed the CORS by switching to a function-based origin that allows any origin in development, and changed `app.listen(PORT)` to `app.listen(PORT, '0.0.0.0')` so the server binds to all network interfaces and can be reached from other devices.

---

## What I'd Do Differently

I'd check the exact installed version of Prisma before writing a single line of code and make sure I'm reading the right version of the documentation. The v6 to v7 change was a breaking change that cost me significant time.

I'd also set up the PostgreSQL user with all the required permissions from the very beginning rather than discovering them one error at a time during migrations.

---

## What Went Well

Once everything was properly configured, the Prisma query API was really pleasant to use. Things like fetching a video and including the user details, like count, and comment count all in a single query with `include` and `_count` felt powerful and readable compared to writing raw SQL joins.

The seed script also worked out well — having 10 users, 50 videos, comments, likes, and follow relationships loaded instantly made testing the API much easier than creating data manually through Postman every time.

---

## Conclusion

Building this backend gave me a genuine understanding of how production-style APIs are structured. Working through real version incompatibilities and permission issues — rather than everything working perfectly the first time — actually made the learning stick better. I now understand Prisma migrations, JWT authentication, file handling, and REST API design from having built them myself, not just read about them.