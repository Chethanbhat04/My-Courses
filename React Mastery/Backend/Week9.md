# Week 9 — Node.js & the Runtime Model

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand what Node.js actually is, how its
> event loop differs from the browser, how to use built-in modules, manage packages
> with npm, and build a basic HTTP server without any framework — the foundation
> that makes Express, databases, and APIs make sense.**

---

## Table of Contents

1. [What Node.js Actually Is](#1-what-nodejs-actually-is)
2. [The Node.js Event Loop](#2-the-nodejs-event-loop)
3. [CommonJS vs ES Modules in Node](#3-commonjs-vs-es-modules-in-node)
4. [Built-in Modules: fs, path, os](#4-built-in-modules-fs-path-os)
5. [npm — Managing Packages](#5-npm--managing-packages)
6. [Building a Raw HTTP Server](#6-building-a-raw-http-server)
7. [Environment Variables & dotenv](#7-environment-variables--dotenv)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. What Node.js Actually Is

- **Node.js is a JavaScript runtime built on Chrome's V8 engine plus libuv** —
  V8 compiles and executes your JavaScript. libuv provides the event loop, the
  thread pool, and system API wrappers (file system, networking, timers) that
  are NOT in V8 itself. Together they let JavaScript run outside the browser.

  ```
  Your JavaScript code
          ↓
       V8 Engine        ← compiles and executes JS (same engine as Chrome)
          ↓
        libuv           ← event loop + async I/O + OS interfaces
          ↓
   Operating System     ← actual file reads, network calls, etc.
  ```

  The browser also uses V8 but surrounds it with browser APIs (DOM, window, fetch,
  localStorage). Node replaces those with server APIs (fs, http, path, process).
  The JavaScript language itself is identical.

- **Node.js is single-threaded but handles thousands of concurrent connections
  through async I/O** — Node does not create a new thread per HTTP request (like
  Apache). It processes all requests on one thread using the event loop. While
  waiting for a database query or file read, it handles other requests. This is
  why Node is great for I/O-heavy apps (APIs, chat apps) but not CPU-heavy tasks
  (video encoding, ML inference).

---

## 2. The Node.js Event Loop

The event loop is the same conceptual model as the browser's, but with different
queue names.

- **Node's event loop has multiple phases; each phase drains its queue before
  moving to the next** — The six phases cycle continuously while there is work to do.

  ```
  ┌───────────────────────────────┐
  │     timers (setTimeout)       │  ← Phase 1: run expired timers
  ├───────────────────────────────┤
  │  pending callbacks             │  ← Phase 2: I/O callbacks deferred from last tick
  ├───────────────────────────────┤
  │     idle, prepare              │  ← Phase 3: internal Node use
  ├───────────────────────────────┤
  │     poll (I/O)                 │  ← Phase 4: retrieve new I/O events (most time here)
  ├───────────────────────────────┤
  │     check (setImmediate)       │  ← Phase 5: setImmediate callbacks
  ├───────────────────────────────┤
  │   close callbacks              │  ← Phase 6: cleanup (socket.on('close'))
  └───────────────────────────────┘
  ```

- **`process.nextTick` and `Promise.then` run between EVERY phase** — They are
  "microtasks" and have the highest priority. They run before any I/O or timer
  callbacks, even before the next event loop phase.

  ```js
  setTimeout(() => console.log("1. setTimeout"), 0);
  setImmediate(() => console.log("2. setImmediate"));
  Promise.resolve().then(() => console.log("3. Promise microtask"));
  process.nextTick(() => console.log("4. nextTick"));

  // Output:
  // 4. nextTick         — highest priority, runs before all else
  // 3. Promise microtask — also microtask, runs before phases
  // 1. setTimeout        — timer phase
  // 2. setImmediate      — check phase (may come before or after setTimeout for 0ms)
  ```

---

## 3. CommonJS vs ES Modules in Node

Node.js supports two module systems. You will see both in the wild.

- **CommonJS (CJS) is Node's original module system — `require` and `module.exports`** —
  This is synchronous (loads the file, runs it, returns the export). All older
  Node packages use this. Files use the `.js` extension (without config) or `.cjs`.

  ```js
  // math.js — CJS export
  function add(a, b) { return a + b; }
  module.exports = { add };
  // or: module.exports.add = add;

  // app.js — CJS import
  const { add } = require('./math');   // relative path, no extension needed
  const express  = require('express'); // node_modules package
  ```

- **ES Modules (ESM) is the modern standard — `import` and `export`** — Same
  syntax as the browser (what you used in React). To use ESM in Node, either:
  - Name files `.mjs`, OR
  - Add `"type": "module"` to `package.json`

  ```js
  // math.mjs — ESM export
  export function add(a, b) { return a + b; }

  // app.mjs — ESM import
  import { add } from './math.mjs'; // extension IS required in Node ESM
  ```

- **Which to use in your projects** — For new Express/Node projects today, use
  CJS unless you have a specific reason for ESM. Most tutorials, npm packages,
  and Express examples still use CJS. The React frontend uses ESM (handled by Vite).
  Keep them separate — don't mix in the same project.

  ```json
  // package.json — choose ONE:
  { "type": "module" }      // enables ESM for all .js files
  { "type": "commonjs" }    // (default) enables CJS for all .js files
  ```

---

## 4. Built-in Modules: fs, path, os

These are Node's built-in modules — no npm install needed.

### `path` — File Path Utilities

- **`path` provides cross-platform utilities for working with file and directory
  paths** — Windows uses `\`, Unix uses `/`. `path` handles the difference.
  Always use `path` instead of string concatenation for file paths.

  ```js
  const path = require('path');

  path.join('/users', 'chethan', 'docs');     // '/users/chethan/docs'
  path.join(__dirname, 'views', 'index.html'); // absolute path to a file in this dir

  path.basename('/users/chethan/file.txt');    // 'file.txt'
  path.extname('/users/chethan/file.txt');     // '.txt'
  path.dirname('/users/chethan/file.txt');     // '/users/chethan'

  path.resolve('src', 'app.js'); // absolute path: /current/working/dir/src/app.js
  ```

  `__dirname` is a CJS global that contains the directory of the current file.
  ESM equivalent: `import.meta.url` + `new URL()`.

### `fs` — File System

- **`fs.readFile` and `fs.writeFile` read and write files asynchronously** —
  Always use the callback or Promise version (`fs.promises`) — never the sync
  version (`fs.readFileSync`) in a server, as sync operations block the event loop.

  ```js
  const fs = require('fs/promises'); // Promise-based fs

  // Read a file:
  async function readConfig() {
    try {
      const content = await fs.readFile('./config.json', 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Could not read config:', err.message);
    }
  }

  // Write a file:
  async function saveData(data) {
    await fs.writeFile('./data.json', JSON.stringify(data, null, 2), 'utf-8');
  }

  // List directory contents:
  const files = await fs.readdir('./src');
  console.log(files); // ['App.jsx', 'main.jsx', ...]
  ```

### `os` — Operating System Info

- **`os` provides information about the host machine** — Useful for CLI tools
  and environment diagnostics.

  ```js
  const os = require('os');

  console.log(os.platform());    // 'win32', 'linux', 'darwin'
  console.log(os.arch());        // 'x64', 'arm64'
  console.log(os.cpus().length); // number of CPU cores
  console.log(os.freemem());     // free memory in bytes
  console.log(os.homedir());     // '/home/chethan' or 'C:\Users\Chethan'
  ```

---

## 5. npm — Managing Packages

- **`package.json` is the manifest of your Node project** — It records the
  project name, version, scripts, and dependencies. Always commit it. Always
  add `node_modules/` to `.gitignore`.

  ```bash
  npm init -y                  # create package.json with defaults
  npm install express          # install + add to "dependencies"
  npm install nodemon --save-dev  # install + add to "devDependencies"
  npm uninstall express        # remove
  npm install                  # install all deps from package.json (for new teammates)
  ```

  ```json
  // package.json
  {
    "name": "my-api",
    "version": "1.0.0",
    "scripts": {
      "start":  "node server.js",
      "dev":    "nodemon server.js",  // auto-restart on file change
      "test":   "jest"
    },
    "dependencies": {
      "express": "^4.18.2"           // production dependency
    },
    "devDependencies": {
      "nodemon": "^3.0.1"            // only needed during development
    }
  }
  ```

- **`package-lock.json` locks exact dependency versions** — Commit this file.
  It ensures every developer and CI server installs the exact same versions,
  preventing "works on my machine" bugs.

- **Semantic versioning (semver): `^major.minor.patch`** — `^4.18.2` means
  "accept any version `>=4.18.2` and `<5.0.0`". Understanding semver prevents
  accidental breaking updates.

  ```
  ^4.18.2  → accepts 4.18.3, 4.19.0, 4.99.0  but NOT 5.0.0
  ~4.18.2  → accepts 4.18.3, 4.18.9          but NOT 4.19.0
  4.18.2   → accepts ONLY 4.18.2 (exact)
  ```

---

## 6. Building a Raw HTTP Server

Understanding Node's raw `http` module shows you what Express wraps.

- **`http.createServer()` creates a server that calls your function for every
  incoming request** — The function receives a `req` (IncomingMessage) and
  `res` (ServerResponse) object. You read from `req` and write to `res`.

  ```js
  const http = require('http');

  const server = http.createServer((req, res) => {
    // Route based on URL and method:
    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Hello from Node!' }));

    } else if (req.url === '/users' && req.method === 'GET') {
      const users = [{ id: 1, name: 'Chethan' }];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(users));

    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
  ```

  You can now see why Express exists — parsing body, routing, middleware, error
  handling — all the boilerplate above is manual. Express automates it.

- **Reading the request body from POST/PUT requests requires collecting chunks** —
  The body arrives as a stream of chunks, not all at once.

  ```js
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/data') {
      let body = '';
      req.on('data', chunk => { body += chunk; });        // collect chunks
      req.on('end', () => {
        const data = JSON.parse(body);                    // parse when done
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: data }));
      });
    }
  });
  ```

  Express's `express.json()` middleware automates this for you.

---

## 7. Environment Variables & dotenv

- **Environment variables store secrets and config outside your code** — Database
  passwords, API keys, and port numbers should NEVER be hardcoded in your source.
  They are loaded from the environment (OS or `.env` file) at runtime.

  ```bash
  # .env — add this file to .gitignore, NEVER commit it
  PORT=3000
  MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/mydb
  JWT_SECRET=supersecretkey123
  NODE_ENV=development
  ```

  ```js
  // Install dotenv: npm install dotenv
  require('dotenv').config(); // loads .env into process.env

  // Access anywhere in the app:
  const port = process.env.PORT || 3000;
  const dbUri = process.env.MONGO_URI;
  const secret = process.env.JWT_SECRET;

  console.log(`Starting on port ${port}`);
  ```

- **Never put your `.env` file on GitHub** — Add it to `.gitignore`. Instead,
  provide a `.env.example` file with placeholder values so teammates know what
  variables are needed.

  ```bash
  # .env.example — safe to commit, no real secrets
  PORT=3000
  MONGO_URI=your_mongodb_connection_string_here
  JWT_SECRET=your_jwt_secret_here
  ```

---

## 8. Exercises

1. **fs module** — Write a Node script that:
   - Reads all `.js` files in the current directory
   - Counts the lines in each file
   - Writes a summary JSON file: `{ "app.js": 120, "server.js": 85 }`

2. **HTTP server** — Build a raw HTTP server that serves a simple JSON REST API:
   - `GET /` → `{ status: "OK", time: "<current time>" }`
   - `GET /users` → array of 3 hardcoded users
   - `POST /echo` → reads the body and echoes it back
   - Everything else → 404

3. **Event loop** — Predict the output order of this code BEFORE running it,
   then run it and verify:
   ```js
   setTimeout(() => console.log('A'), 0);
   setImmediate(() => console.log('B'));
   Promise.resolve().then(() => console.log('C'));
   process.nextTick(() => console.log('D'));
   console.log('E');
   ```

4. **npm scripts** — Set up a Node project with:
   - `npm run dev` → starts server with nodemon
   - `npm run lint` → runs ESLint
   - `npm start` → starts server with node (production)

5. **dotenv** — Add environment variables to your HTTP server. Port, a fake
   API key, and a "debug mode" flag. Log requests only when debug mode is on.

---

## 9. Milestone Project

### Node.js File Stats CLI Tool

Build a command-line tool that:

1. Accepts a directory path as an argument: `node stats.js ./src`
2. Recursively scans all files in the directory
3. Collects: total files, total lines of code, files per extension (`.js`, `.jsx`, `.css`, etc.)
4. Outputs a pretty-printed summary table to the terminal
5. Saves the result to `stats.json`

Use: `fs.promises`, `path`, `os`, command-line args via `process.argv`.

---

## 10. Sources

| Resource | What to Search |
|----------|---------------|
| Node.js docs | https://nodejs.org/docs/latest/api — fs, path, http, os |
| YouTube | `"Fireship — Node.js explained in 100 Seconds"`, `"Traversy Media — Node.js Crash Course"` |
| MDN | `"Event Loop"` (same concept) |
| dotenv | https://github.com/motdotla/dotenv |