# Week 10 — Express.js: REST APIs from Scratch

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand what Express adds on top of Node's
> raw http module, how middleware works (the most important Express concept),
> how to design and build a complete REST API, and how to handle errors properly.**

---

## Table of Contents

1. [What Express Is and Why It Exists](#1-what-express-is-and-why-it-exists)
2. [Middleware — The Core Concept](#2-middleware--the-core-concept)
3. [Routing — Organizing Your Endpoints](#3-routing--organizing-your-endpoints)
4. [Request Object — Reading Input](#4-request-object--reading-input)
5. [Response Object — Sending Output](#5-response-object--sending-output)
6. [REST API Design Conventions](#6-rest-api-design-conventions)
7. [Building a Complete CRUD API](#7-building-a-complete-crud-api)
8. [Error Handling Middleware](#8-error-handling-middleware)
9. [Exercises](#9-exercises)
10. [Milestone Project](#10-milestone-project)
11. [Sources](#11-sources)

---

## 1. What Express Is and Why It Exists

- **Express is a minimal Node.js framework that wraps the raw `http` module with
  a clean, extensible API** — It solves all the repetitive boilerplate you saw in
  Week 9: route matching, body parsing, response helpers, and the middleware pipeline.
  Express is the most widely used Node framework. Learning it teaches you patterns
  used in every Node framework (Fastify, Koa, NestJS).

  ```bash
  npm install express
  ```

  ```js
  // Week 9 raw http server — verbose and manual:
  const http = require('http');
  const server = http.createServer((req, res) => {
    if (req.url === '/users' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(users));
    }
  });

  // Express equivalent — clean and readable:
  const express = require('express');
  const app = express();

  app.get('/users', (req, res) => {
    res.json(users); // sets Content-Type, status 200, and sends JSON automatically
  });

  app.listen(3000, () => console.log('Server running'));
  ```

---

## 2. Middleware — The Core Concept

Middleware is the most important concept in Express. Understanding it unlocks
authentication, logging, rate limiting, body parsing, and error handling.

- **Middleware is a function with signature `(req, res, next)` that sits in the
  request-response pipeline** — Every HTTP request passes through a chain of
  middleware functions in order. Each function can: read/modify `req` and `res`,
  end the request (send a response), or call `next()` to pass control to the next
  middleware.

  ```
  Request arrives
       ↓
  [Logger middleware]   → logs the request, calls next()
       ↓
  [Auth middleware]     → checks token, calls next() or sends 401
       ↓
  [Body parser]         → parses JSON body, attaches to req.body, calls next()
       ↓
  [Route handler]       → your application logic, sends response
  ```

  ```js
  // A custom logging middleware:
  function logger(req, res, next) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next(); // must call next() or the request hangs forever
  }

  app.use(logger); // mount globally — runs for every request
  ```

- **`app.use(fn)` registers middleware that runs for ALL routes and methods** —
  Order matters. Middleware registered earlier runs first.

  ```js
  const app = express();

  app.use(express.json());         // 1. parse JSON bodies (built-in Express middleware)
  app.use(express.urlencoded({ extended: true })); // 2. parse form data
  app.use(logger);                 // 3. your custom logger

  app.get('/users', handleGetUsers); // 4. route handler
  ```

- **Third-party middleware extends Express** — Common middleware packages:

  ```bash
  npm install cors        # enable Cross-Origin Resource Sharing (for React frontend)
  npm install morgan      # HTTP request logger
  npm install helmet      # security headers
  npm install express-rate-limit  # rate limiting
  ```

  ```js
  const cors   = require('cors');
  const morgan = require('morgan');

  app.use(cors({ origin: 'http://localhost:5173' })); // allow React dev server
  app.use(morgan('dev'));  // logs: GET /users 200 5ms
  ```

---

## 3. Routing — Organizing Your Endpoints

- **`app.METHOD(path, handler)` registers a route for a specific HTTP method and
  path** — `METHOD` is `get`, `post`, `put`, `patch`, or `delete`.

  ```js
  app.get('/posts',      handleGetAll);    // GET  /posts
  app.post('/posts',     handleCreate);    // POST /posts
  app.get('/posts/:id',  handleGetOne);    // GET  /posts/42
  app.put('/posts/:id',  handleUpdate);    // PUT  /posts/42 (full replace)
  app.patch('/posts/:id', handlePatch);    // PATCH /posts/42 (partial update)
  app.delete('/posts/:id', handleDelete);  // DELETE /posts/42
  ```

- **Use `express.Router()` to group related routes into a separate file** —
  As your API grows, defining all routes in one file becomes unmaintainable.
  Router creates a mini Express app for a specific resource.

  ```js
  // routes/users.js
  const router = require('express').Router();

  router.get('/',        getAll);
  router.post('/',       create);
  router.get('/:id',     getOne);
  router.put('/:id',     update);
  router.delete('/:id',  remove);

  module.exports = router;
  ```

  ```js
  // server.js — mount the router at a prefix
  const usersRouter = require('./routes/users');
  const postsRouter = require('./routes/posts');

  app.use('/api/users', usersRouter); // all routes in usersRouter are now /api/users/*
  app.use('/api/posts', postsRouter);
  ```

---

## 4. Request Object — Reading Input

- **`req.params` contains URL path parameters (`:id`, `:slug`)** — Values captured
  from the URL path. Always a string — convert to number if needed.

  ```js
  // Route: GET /users/:id
  app.get('/users/:id', (req, res) => {
    const userId = Number(req.params.id); // "42" → 42
    res.json({ userId });
  });

  // Route: GET /categories/:category/products/:slug
  app.get('/categories/:category/products/:slug', (req, res) => {
    const { category, slug } = req.params;
    // URL /categories/electronics/products/iphone → { category: "electronics", slug: "iphone" }
  });
  ```

- **`req.query` contains URL query string parameters** — Values after `?` in the URL.
  Always strings — parse numbers/booleans manually.

  ```js
  // URL: GET /products?category=electronics&sort=price&page=2&limit=10
  app.get('/products', (req, res) => {
    const {
      category = 'all',
      sort     = 'name',
      page     = 1,
      limit    = 10
    } = req.query;

    const pageNum  = Number(page);
    const limitNum = Number(limit);
    // use them for database query...
  });
  ```

- **`req.body` contains the parsed request body for POST/PUT/PATCH** — Only
  available after the `express.json()` middleware. Without it, `req.body` is `undefined`.

  ```js
  app.use(express.json()); // must come before routes that read req.body

  app.post('/users', (req, res) => {
    const { name, email, password } = req.body;
    // validate and create user...
  });
  ```

- **`req.headers` contains the raw HTTP headers** — Use for authentication tokens,
  content type, and custom headers.

  ```js
  app.get('/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    // "Bearer eyJhbGc..." → split on space to get the token
    const token = authHeader?.split(' ')[1];
  });
  ```

---

## 5. Response Object — Sending Output

- **`res.json(data)` sends a JSON response with `Content-Type: application/json`** —
  This is the primary method for REST APIs. It automatically serializes the data.

  ```js
  res.json({ name: "Chethan", age: 22 });             // 200 OK with JSON
  res.status(201).json({ id: 1, message: "Created" }); // 201 Created with JSON
  res.status(404).json({ error: "User not found" });   // 404 with error JSON
  ```

- **Always set the appropriate HTTP status code** — Status codes communicate the
  result to the client (and to developers debugging the API).

  ```
  200 OK         — successful GET, PUT, PATCH, DELETE
  201 Created    — successful POST (resource created)
  204 No Content — successful DELETE (nothing to return)
  400 Bad Request — invalid input (missing fields, wrong type)
  401 Unauthorized — not authenticated (no token)
  403 Forbidden  — authenticated but not authorized
  404 Not Found  — resource does not exist
  409 Conflict   — duplicate (email already exists)
  500 Internal Server Error — unexpected server error
  ```

- **`res.status(code)` sets the status code** — Chain with `.json()` or `.send()`.

  ```js
  // Pattern: validate → respond with appropriate code
  app.post('/users', (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const newUser = createUser({ name, email });
    res.status(201).json(newUser);
  });
  ```

---

## 6. REST API Design Conventions

- **REST uses nouns (resources) in URLs, and HTTP methods as verbs** — The URL
  identifies WHAT you are acting on; the HTTP method says HOW.

  ```
  ✅ RESTful:
  GET    /users           → list all users
  POST   /users           → create a user
  GET    /users/42        → get user with id 42
  PUT    /users/42        → replace user 42 entirely
  PATCH  /users/42        → partially update user 42
  DELETE /users/42        → delete user 42

  ❌ Not RESTful:
  GET  /getUsers          → verb in URL
  POST /createUser        → verb in URL
  GET  /deleteUser?id=42  → DELETE via GET
  ```

- **Use plural nouns for resource collections** — `/users`, `/posts`, `/products`,
  not `/user`, `/post`, `/product`.

- **Nest resources only one level deep** — Avoid deeply nested URLs; they become
  hard to read and maintain.

  ```
  ✅ One level: /posts/:id/comments      (get comments for post 42)
  ❌ Too deep: /users/:id/posts/:id/comments/:id  (hard to use)

  Alternative — flatten with query params:
  GET /comments?postId=42  (often cleaner)
  ```

- **Version your API** — Prefix with `/api/v1/` from day one. When you make
  breaking changes, release `/api/v2/` without breaking existing clients.

  ```
  /api/v1/users
  /api/v1/posts
  ```

---

## 7. Building a Complete CRUD API

Here is a full in-memory CRUD API that demonstrates all patterns together:

```js
// server.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// In-memory data store (replace with MongoDB in Week 11)
let users = [
  { id: 1, name: "Chethan", email: "chethan@example.com", role: "admin" },
  { id: 2, name: "Ravi",    email: "ravi@example.com",    role: "user"  },
];
let nextId = 3;

// GET /api/users — list all (with optional ?role= filter)
app.get('/api/users', (req, res) => {
  const { role } = req.query;
  const result = role ? users.filter(u => u.role === role) : users;
  res.json(result);
});

// GET /api/users/:id — get one
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// POST /api/users — create
app.post('/api/users', (req, res) => {
  const { name, email, role = 'user' } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  const exists = users.some(u => u.email === email);
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const newUser = { id: nextId++, name, email, role };
  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /api/users/:id — full replace
app.put('/api/users/:id', (req, res) => {
  const id   = Number(req.params.id);
  const idx  = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: "All fields required for PUT" });

  users[idx] = { id, name, email, role };
  res.json(users[idx]);
});

// PATCH /api/users/:id — partial update
app.patch('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });

  Object.assign(user, req.body); // merge changes
  res.json(user);
});

// DELETE /api/users/:id — delete
app.delete('/api/users/:id', (req, res) => {
  const id  = Number(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  users.splice(idx, 1);
  res.status(204).send(); // 204 No Content — nothing to return
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
```

---

## 8. Error Handling Middleware

- **Express error-handling middleware has 4 parameters: `(err, req, res, next)`** —
  The first parameter `err` is what distinguishes it from regular middleware.
  Must be registered AFTER all routes. Express automatically forwards any error
  passed to `next(err)` to this handler.

  ```js
  // Wrap async route handlers to catch errors automatically:
  function asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next); // forwards errors to error middleware
    };
  }

  // Route — throw or call next(err) on error:
  app.get('/users/:id', asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id); // might throw
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err; // asyncHandler catches this and calls next(err)
    }
    res.json(user);
  }));

  // Global error handler — MUST be after all routes
  app.use((err, req, res, next) => {
    const status  = err.status || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[${new Date().toISOString()}] ${status} — ${message}`);
    if (process.env.NODE_ENV === 'development') console.error(err.stack);

    res.status(status).json({
      error:   message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });
  ```

---

## 9. Exercises

1. **Basic Express** — Create an Express server with at least 3 routes. Use
   `morgan` for logging and `cors` for cross-origin support. Test with `curl` or
   Postman.

2. **CRUD API** — Build a full in-memory CRUD API for `posts` resource with:
   `GET /posts`, `GET /posts/:id`, `POST /posts`, `PATCH /posts/:id`,
   `DELETE /posts/:id`. Validate required fields and return proper status codes.

3. **Router** — Split the posts and users routes into separate Router files. Mount
   them at `/api/v1/posts` and `/api/v1/users`.

4. **Auth middleware** — Write middleware that checks for an `Authorization: Bearer
   <token>` header. If the token equals the string `"secret123"` (hardcoded for
   now), call `next()`. Otherwise return 401. Protect the `POST`, `PATCH`, and
   `DELETE` routes.

5. **Error handling** — Add the global error handler and `asyncHandler` wrapper.
   Simulate a database failure (throw in a route) and verify the error handler
   catches it and returns proper JSON.

---

## 10. Milestone Project

### REST API: Books CRUD

Build a complete REST API for managing a library of books:

1. **Resource**: `books` with fields: `id`, `title`, `author`, `isbn`, `year`, `genre`, `available` (boolean)
2. **All 5 CRUD endpoints** with proper status codes
3. **Filtering**: `GET /books?genre=fiction&available=true`
4. **Pagination**: `GET /books?page=1&limit=10` — response includes `{ data, total, page, totalPages }`
5. **Search**: `GET /books?search=chethan` — searches in title and author fields
6. **Validation middleware** — validates required fields on POST/PUT
7. **Router file** — routes in `routes/books.js`
8. **Global error handler**
9. **Test with Postman or Thunder Client (VS Code extension)** — test all endpoints

---

## 11. Sources

| Resource | What to Search |
|----------|---------------|
| Express docs | https://expressjs.com/en/guide/routing.html, expressjs.com/en/guide/using-middleware.html |
| YouTube | `"Traversy Media — Express Crash Course"`, `"Fireship — Express in 100 Seconds"` |
| MDN | `"HTTP response status codes"` |