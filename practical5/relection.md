# Reflection — Practical 5: Implementing Cloud Storage with Supabase


## Overview

This practical had me migrating the TikTok clone from storing uploaded videos locally on the server to using Supabase Storage. Before this, every uploaded video went into an `uploads/` folder on the Express.js server, which was fine for development but would be a real problem in production. After completing this practical, all uploaded files go straight to Supabase's cloud storage and come back through a CDN URL that the browser can load directly — the server's disk isn't involved anymore.

---

## What I Learned

### Why Local Storage Doesn't Scale

Before this practical I hadn't really thought about the limitations of storing files on the server. It just worked, so I didn't question it. But going through the theory made the problems obvious — the server has limited disk space, video files are large, and if the server gets redeployed all your uploads are gone. There's also no CDN, so every file request hits the same machine regardless of where the user is. For a video platform, that's a serious performance issue.

Understanding this made the motivation for cloud storage feel real rather than just theoretical. It's not just a "best practice" — it's the only approach that actually works at scale.

### How Supabase Storage Works

Setting up Supabase Storage taught me how bucket-based cloud storage is organised. Files go into buckets, each bucket has its own access policies, and every file gets a public URL that's served through a CDN. The fact that the URL structure is completely predictable — project reference, bucket name, filename — made it easy to understand what was happening when I inspected the uploaded files in the dashboard.

The access policy setup was something I hadn't encountered before. I had to create two separate policies per bucket: one that lets authenticated users upload files, and one that lets anyone read them. Without that second public SELECT policy, the browser couldn't load the videos at all — it just got a 403 error. That was a good lesson in how access control actually works at the storage layer.

### Memory Storage vs Disk Storage

The most technically interesting change was switching Multer from disk storage to memory storage. Previously Multer saved every uploaded file to the `uploads/` folder on disk before the controller even saw it. But since we're now sending the file to Supabase instead of keeping it locally, there's no reason to write it to disk first. Memory storage keeps the file as a buffer in RAM, which gets passed directly to the Supabase upload function.

This seems like a small detail but it's actually an important architectural pattern — the server becomes stateless with respect to files. It processes the upload and forwards it to the cloud provider without ever writing anything to its own storage.

### Prisma Schema Migration

Adding the two new fields to the Video model was straightforward, but running the migration on an existing database that already had data in it was something I hadn't done in a practical setting before. The fact that both fields were optional (`String?`) meant the migration could add the columns without breaking any existing rows — they just got `null` values for the new fields. That's something to think carefully about when modifying a schema in production.

---

## Challenges I Faced

### The `prisma.video.create()` Unknown Argument Error

After updating the Prisma schema to add `videoStoragePath` and `thumbnailStoragePath`, I ran the migration but the server still threw an error saying those fields were unknown arguments. The issue was that the Prisma client had been generated from the old schema and hadn't been updated to reflect the new fields.

Running `npx prisma generate` after the migration rebuilt the client and fixed the error immediately. It taught me that schema migrations and client generation are two separate steps in Prisma — running `migrate dev` creates the SQL changes in the database, but the JavaScript client still needs to be regenerated separately to know about those new fields.

### Finding the Supabase Keys

The practical guide used placeholder values like `your-service-role-key` which wasn't immediately obvious to find in the Supabase dashboard. The keys are under **Settings → API**, and the service role key is hidden by default behind an eye icon. The storage URL isn't listed anywhere separately — it's just the project URL with `/storage/v1` appended, which wasn't obvious at first.

### Bucket Policies

I initially only created the authenticated upload policy for the videos bucket and skipped the public SELECT policy, thinking public access was already handled by setting the bucket to Public when I created it. It wasn't — the bucket being "public" just means it can have public policies, it doesn't automatically create them. Without the SELECT policy, every video in the feed showed "Video unavailable" because the browser's requests were being rejected by Supabase's RLS rules.

---

## What I'd Do Differently

I'd set up both bucket policies at the same time before writing any code, and test that a file can be accessed via its public URL directly in the browser before even touching the application. That would have caught the missing SELECT policy immediately rather than only discovering it after a full upload test.

I'd also look at the Supabase dashboard more carefully before starting — the keys, bucket setup, and policies are all in different sections of the sidebar, and knowing where everything is before you need it saves a lot of time.

---

## What Went Well

Once the policies and environment variables were set up correctly, the actual upload flow worked on the first try. The `storageService.js` abstraction was clean — the controller doesn't need to know anything about Supabase directly, it just calls `uploadFile` and gets back a URL and a storage path. That separation makes it easy to swap out the storage provider in the future if needed.

Watching a video upload and then immediately seeing the file appear in the Supabase dashboard with the correct filename and size was satisfying. And seeing the video play in the feed from a Supabase CDN URL rather than `localhost:5000/uploads/filename.mp4` made the whole practical feel like a real upgrade to the application.

---

## Conclusion

This practical made a tangible improvement to the application's architecture. The server is no longer responsible for storing files, and all uploaded media is now reliably stored in the cloud with CDN delivery. The key things I took away were how bucket storage policies work, why memory storage makes sense when uploading to a third-party service, and the importance of regenerating the Prisma client after a schema migration. These are all patterns I'll use again in real projects.