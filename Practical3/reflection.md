# Reflection — Practical 3: File Upload Implementation (Backend: Express + Multer)

## Introduction

This practical completed the file upload system by implementing the server side. With the React frontend already built, the challenge was to build an Express server that could correctly receive multipart form data, validate files, store them to disk, and return enough information for the frontend to display the result. This is also where I first worked with **Multer** — a dedicated middleware for file handling in Node.js.

---

## Understanding Multer's Role

Before this practical, I thought file uploads were handled by Express itself. In reality, Express's built-in body parsers (`express.json()`, `express.urlencoded()`) only handle text-based request bodies. Binary file data in `multipart/form-data` format is entirely outside their scope.

Multer fills this gap. It intercepts `multipart/form-data` requests, extracts both text fields and file objects, saves files to disk (using `diskStorage`) or memory (using `memoryStorage`), and attaches the result to `req.file` (single file) or `req.files` (multiple files) for the route handler to use.

Understanding this separation of concerns — Express parses text, Multer handles files — clarified why both middlewares are necessary.

---

## What I Learned

### Multer's Three Configuration Points

Multer's behaviour is controlled by three options:

1. **`storage`** — determines where files go (`diskStorage` to disk, `memoryStorage` to RAM buffer)
2. **`fileFilter`** — a function called before saving that can accept or reject a file based on its `mimetype`
3. **`limits`** — enforces constraints like maximum `fileSize`

Understanding that `fileFilter` runs **before** the file is written to disk was important. If the filter rejects a file, it never touches the filesystem. This is the correct place for type validation.

### MIME Type vs File Extension

The `fileFilter` validates against `file.mimetype`, not the file extension. MIME types are determined by the server reading the file's magic bytes (the first few bytes of the binary data), not by the filename. This means a `.jpg` file renamed to `.txt` would still have `mimetype: 'image/jpeg'` and would be correctly accepted — and a `.jpg` renamed to `.pdf` would have `mimetype: 'image/jpeg'`, not `application/pdf`, and would still be correctly classified.

Validating by extension alone is trivially bypassed by renaming a file. Validating by MIME type is more robust.

### Error Handling for Multer

Multer errors are **not** caught by regular `try-catch` blocks inside route handlers. They are passed to Express's error handling pipeline via the `next(err)` mechanism. The error middleware must check `err instanceof multer.MulterError` to distinguish Multer-specific errors (like `LIMIT_FILE_SIZE`) from general server errors:

```js
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Server error' });
});
```

This was a genuine surprise. I initially wrapped the upload handler in `try-catch` and could not understand why Multer size errors were not being caught. The answer is that Multer errors happen during middleware execution, before the route handler runs — `try-catch` inside the handler never sees them.

### Static File Serving

Serving uploaded files back to clients using `express.static(uploadDir)` mounted at `/uploads` was elegant. The frontend receives a URL like `/uploads/photo.jpg` in the response body and can use it directly in an `<img src>` tag (prefixed with the backend origin: `http://localhost:8000/uploads/photo.jpg`).

### CORS Configuration

Configuring CORS to allow only the frontend origin (`http://localhost:3000`) is a security best practice — it prevents other websites from making requests to the upload endpoint using a user's credentials. Reading the allowed origin from `.env` means the production deployment can be reconfigured without touching the code.

---

## Challenges Faced

### `upload.single('file')` Field Name Matching

Multer's `upload.single('file')` expects the file to be in a form field named `'file'`. On the frontend, `formData.append('file', data.file[0])` must use the exact same field name. A mismatch means Multer receives no file and `req.file` is `undefined`. This caused a confusing "No file uploaded" error that took time to trace back to the field name mismatch.

### File Naming Collisions

The current implementation saves files with their original filenames. If two users upload a file named `photo.jpg`, the second upload overwrites the first. In production, filenames should be unique — typically generated with a timestamp or UUID prefix:

```js
cb(null, `${Date.now()}-${file.originalname}`);
```

I noted this limitation but kept the simpler approach for the lab.

### Testing Without a Frontend

Before connecting the React frontend, I tested the upload endpoint using `curl`. Constructing a multipart `curl` command was unfamiliar:

```bash
curl -X POST http://localhost:8000/api/upload -F "file=@./test.jpg"
```

The `-F` flag sends the file as a form field. Getting the path syntax right and ensuring the file existed at the specified path required several attempts.

---

## Mistakes Made and Lessons Learned

| Mistake | Lesson |
|---------|--------|
| Used `try-catch` in route handler expecting to catch Multer errors | Multer errors bypass route handler try-catch; they need a dedicated error middleware |
| Validated file type by extension instead of MIME type initially | Always validate `file.mimetype`, not the filename extension |
| Forgot to check `req.file` before accessing its properties | Always guard with `if (!req.file) return res.status(400)...` |
| Set `Content-Type: multipart/form-data` manually in the frontend | Let Axios (and FormData) set this automatically; manual setting omits the boundary |

---

## What I Would Do Differently

- **Generate unique filenames.** Use `${Date.now()}-${uuid()}-${file.originalname}` to avoid filename collisions.
- **Scan files for malware.** In a production system, uploaded files should be scanned before being stored or served. A file named `image.jpg` could contain malicious content.
- **Store files in cloud storage.** Saving files to the local filesystem does not scale and is not durable (files are lost if the server is restarted or replaced). Amazon S3, Google Cloud Storage, or similar services are the production solution.
- **Limit upload rate.** Without rate limiting, the upload endpoint could be abused to fill the server's disk. A rate-limiter middleware (like `express-rate-limit`) would mitigate this.
- **Add file hash verification.** Computing a SHA-256 hash of each uploaded file and storing it alongside the filename allows duplicate detection and integrity verification.

---

## Connection to the Frontend

The most satisfying part of this practical was connecting the Express backend to the React frontend and watching the full upload flow work end-to-end:

1. User drops a file onto the dropzone
2. React validates the file client-side
3. Axios POSTs the file to `http://localhost:8000/api/upload`
4. Multer receives and validates the file server-side
5. The file is saved to `./uploads/`
6. Express returns `{ filename, url, size, mimetype }`
7. React displays the success message and the file URL

Seeing both sides of the system work together reinforced how much coordination is required between frontend and backend — field names, CORS, response shapes, and error codes all need to be agreed upon for the integration to work.

---

## Key Takeaway

File upload is deceptively complex. What looks like "just sending a file" involves a specific encoding format, specialised middleware, type validation, storage decisions, error classification, and CORS configuration. This practical gave me a solid mental model of the full upload pipeline — from the browser's `FormData` object through Multer's middleware to the filesystem — and the vocabulary to reason about each step independently.