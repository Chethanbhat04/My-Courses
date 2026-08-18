# Week 12 — Auth, Deployment & Full-Stack Integration

# The Complete Deep-Dive Lesson

> **By the end of this week you will implement JWT authentication end-to-end,
> connect your React frontend to your Express backend, manage secrets properly,
> and deploy a full-stack application live on the internet using Vercel and Render.**

---

## Table of Contents

1. [JWT Authentication — How Tokens Work](#1-jwt-authentication--how-tokens-work)
2. [Hashing Passwords with Bcrypt](#2-hashing-passwords-with-bcrypt)
3. [Building the Auth API](#3-building-the-auth-api)
4. [Auth Middleware — Protecting Routes](#4-auth-middleware--protecting-routes)
5. [Connecting React to Express (CORS)](#5-connecting-react-to-express-cors)
6. [Calling Your API from React](#6-calling-your-api-from-react)
7. [Environment Variables — Frontend & Backend](#7-environment-variables--frontend--backend)
8. [Deployment — Vercel + Render](#8-deployment--vercel--render)
9. [Full-Stack Project Architecture](#9-full-stack-project-architecture)
10. [Exercises](#10-exercises)
11. [Milestone Project — Full-Stack Task Manager](#11-milestone-project--full-stack-task-manager)
12. [Sources](#12-sources)

---

## 1. JWT Authentication — How Tokens Work

- **JWT (JSON Web Token) is a compact, self-contained token that proves who you
  are — without the server needing to store sessions in a database** — The server
  creates the token on login, signs it with a secret key, and sends it to the
  client. The client stores the token and sends it with every future request.
  The server verifies the signature — if valid, it trusts the token's payload.

  ```
  Login:
  Client: POST /auth/login { email, password }
    → Server verifies credentials
    → Server creates JWT: { userId: 42, role: "admin" }
    → Server signs it with SECRET_KEY → token string
    → Server sends token to client

  Every protected request:
  Client: GET /api/tasks  Authorization: Bearer <token>
    → Server extracts token from header
    → Server verifies signature using SECRET_KEY
    → If valid: extract payload (userId, role), proceed
    → If invalid/expired: return 401 Unauthorized
  ```

- **A JWT has three Base64url-encoded parts separated by dots** — Header, Payload,
  and Signature. The payload is NOT encrypted — anyone can decode it. Only the
  signature proves it wasn't tampered with. Never put passwords or secrets in the payload.

  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← Header (algorithm + type)
  .eyJ1c2VySWQiOiI0MiIsInJvbGUiOiJhZG1pbiJ9  ← Payload (your data)
  .SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature (tamper-proof)
  ```

  ```js
  // Decode (without verification) to inspect the payload:
  const payload = JSON.parse(atob(token.split('.')[1]));
  // { userId: "42", role: "admin", iat: 1706745600, exp: 1706832000 }
  ```

---

## 2. Hashing Passwords with Bcrypt

**Never store plain-text passwords.** If your database is breached, plain-text
passwords expose your users on every other site they use (password reuse).

```bash
npm install bcrypt jsonwebtoken
```

- **`bcrypt.hash(password, saltRounds)` produces a one-way hash** — A salt is
  random data added to the password before hashing, making identical passwords
  produce different hashes. `saltRounds` (10–12) controls the CPU cost. Higher
  = slower to crack, but also slower to verify.

  ```js
  const bcrypt = require('bcrypt');

  // Hashing:
  const SALT_ROUNDS = 12;
  const plainPassword = "MyPassword123!";
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  console.log(hash); // "$2b$12$..." — 60-char string, includes the salt

  // Verification (comparing plain vs hash):
  const isMatch = await bcrypt.compare("MyPassword123!", hash); // true
  const isMatch = await bcrypt.compare("wrongpassword",  hash); // false
  ```

  The salt is stored inside the hash string — you never store it separately.
  `bcrypt.compare` extracts the salt from the stored hash automatically.

---

## 3. Building the Auth API

```js
// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;  // from .env — NEVER hardcode
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// Utility: create a signed JWT
function signToken(userId, role) {
  return jwt.sign(
    { userId, role },            // payload
    JWT_SECRET,                  // secret
    { expiresIn: JWT_EXPIRES }   // expiry
  );
}

// POST /auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user   = await User.create({ name, email, password: hashed });

    const token  = signToken(user._id, user.role);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (err) { next(err); }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password'); // include hashed password
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    // Note: same error message for wrong email AND wrong password — prevents user enumeration

    const token = signToken(user._id, user.role);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (err) { next(err); }
}

// GET /auth/me — get current user from token
async function getMe(req, res) {
  // req.user set by auth middleware
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
```

---

## 4. Auth Middleware — Protecting Routes

- **Auth middleware extracts the JWT from the `Authorization` header, verifies it,
  and attaches the user to `req`** — All protected routes call this middleware
  before their handler.

  ```js
  // middleware/auth.js
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');

  async function protect(req, res, next) {
    try {
      // 1. Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No token provided" });
      }
      const token = authHeader.split(' ')[1]; // "Bearer <token>" → "<token>"

      // 2. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // If expired or tampered: throws JsonWebTokenError or TokenExpiredError

      // 3. Find the user (ensures user still exists and is not deleted)
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return res.status(401).json({ error: "User no longer exists" });

      // 4. Attach user to request
      req.user = user;
      next(); // pass to the route handler

    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expired — please log in again" });
      }
      res.status(401).json({ error: "Invalid token" });
    }
  }

  // Role-based access control middleware:
  function restrictTo(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "You do not have permission" });
      }
      next();
    };
  }

  module.exports = { protect, restrictTo };
  ```

  ```js
  // routes/tasks.js — protected routes
  const { protect, restrictTo } = require('../middleware/auth');

  router.use(protect); // all routes below require authentication

  router.get('/',     getMyTasks);
  router.post('/',    createTask);
  router.patch('/:id', updateTask);
  router.delete('/:id', deleteTask);

  // Admin-only route:
  router.get('/all', restrictTo('admin'), getAllUsersAllTasks);
  ```

---

## 5. Connecting React to Express (CORS)

- **CORS (Cross-Origin Resource Sharing) is a browser security mechanism that
  blocks requests from one origin to another by default** — Your React app runs
  on `http://localhost:5173` and your API runs on `http://localhost:3000`. These
  are different origins (different port = different origin). The browser blocks
  the fetch unless the server explicitly allows it via CORS headers.

  ```bash
  npm install cors  # in the Express project
  ```

  ```js
  const cors = require('cors');

  // Development: allow all origins (easy but insecure for production)
  app.use(cors());

  // Production: allow only your frontend domain
  app.use(cors({
    origin: [
      'http://localhost:5173',           // React dev server
      'https://my-app.vercel.app',       // deployed frontend
    ],
    credentials: true,                   // allow cookies (if using cookie auth)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  ```

---

## 6. Calling Your API from React

- **Store the base URL in a Vite environment variable and create an API utility** —
  Centralize all API calls in one place so you never hardcode URLs in components.

  ```js
  // src/utils/api.js — reusable fetch wrapper
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }), // attach token if exists
        ...options.headers,
      },
      ...options,
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.status === 204 ? null : res.json(); // handle 204 No Content
  }

  export const api = {
    get:    (url)        => request(url),
    post:   (url, data)  => request(url, { method: 'POST',   body: JSON.stringify(data) }),
    put:    (url, data)  => request(url, { method: 'PUT',    body: JSON.stringify(data) }),
    patch:  (url, data)  => request(url, { method: 'PATCH',  body: JSON.stringify(data) }),
    delete: (url)        => request(url, { method: 'DELETE' }),
  };
  ```

  ```jsx
  // Usage in a React component:
  import { api } from '../utils/api';

  function TaskList() {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
      api.get('/api/tasks').then(setTasks).catch(console.error);
    }, []);

    async function createTask(title) {
      const newTask = await api.post('/api/tasks', { title });
      setTasks(prev => [...prev, newTask]);
    }

    async function deleteTask(id) {
      await api.delete(`/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
    }
  }
  ```

- **Handle auth state globally with the Auth context from Week 7** — On login,
  save the token to `localStorage` and the user object to Context. On logout,
  clear both.

  ```jsx
  // AuthContext — store token + user globally
  function login(token, user) {
    localStorage.setItem('token', token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  // On app load: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')  // validate token with server
        .then(({ user }) => setUser(user))
        .catch(() => localStorage.removeItem('token')); // invalid token — clear it
    }
  }, []);
  ```

---

## 7. Environment Variables — Frontend & Backend

- **Two separate `.env` files — one for each project** — The backend `.env` holds
  secrets (never exposed to users). The frontend `.env.local` holds public config
  (only non-sensitive values with `VITE_` prefix).

  ```bash
  # backend/.env — NEVER commit this
  NODE_ENV=development
  PORT=3000
  MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskdb
  JWT_SECRET=your-very-long-random-secret-key-here
  JWT_EXPIRES=7d

  # frontend/.env.local — NEVER commit this
  VITE_API_URL=http://localhost:3000   # points to backend in dev
  ```

  ```bash
  # Production environment variables — set in hosting dashboard, NOT in .env file:
  # Render dashboard → Environment → Add environment variable
  # Vercel dashboard → Settings → Environment Variables
  ```

---

## 8. Deployment — Vercel + Render

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI:
npm install -g vercel

# Inside your React project:
npm run build         # make sure it builds first
vercel                # follow prompts: link to project, set env vars
vercel --prod         # deploy to production
```

Or connect GitHub: Vercel → New Project → Import Git Repo → Auto-deploys on push.

Set environment variables in the Vercel dashboard:
- `VITE_API_URL` → `https://your-backend.onrender.com`

### Deploy Backend to Render

1. Push your Express project to GitHub.
2. Render → New → Web Service → connect repo.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add environment variables in Render dashboard (MONGO_URI, JWT_SECRET, etc.).
6. Set `NODE_ENV=production`.

- **Configure CORS in your backend for the production frontend URL** — After
  deploying the frontend, add its Vercel URL to the CORS whitelist.

  ```js
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://my-app.vercel.app']   // from environment variable ideally
      : ['http://localhost:5173'],
  }));
  ```

### Add a `vercel.json` if your backend is an Express app on Vercel

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

---

## 9. Full-Stack Project Architecture

```
task-manager/
├── backend/               ← Express + MongoDB API
│   ├── controllers/
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── tasks.js
│   ├── db.js
│   ├── app.js             ← Express app (no listen)
│   ├── server.js          ← connect DB, then listen
│   ├── .env               ← gitignored secrets
│   └── package.json
│
└── frontend/              ← React + Vite app
    ├── src/
    │   ├── components/
    │   ├── features/
    │   │   ├── auth/
    │   │   └── tasks/
    │   ├── hooks/
    │   ├── pages/
    │   ├── store/
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.local          ← gitignored env
    └── package.json
```

---

## 10. Exercises

1. **JWT Auth** — Implement register + login endpoints with bcrypt + JWT. Test with
   Postman: register a user, login, copy the token, make a protected request.

2. **Protected routes** — Add the `protect` middleware to your Week 11 Notes API.
   Ensure users can only read/edit THEIR OWN notes. Admin can read all.

3. **React auth flow** — Connect the Week 6 Blog frontend to a real backend:
   - Login form → `POST /auth/login` → save token
   - Redirect to `/dashboard` after login
   - Logout button → clear token, redirect to `/login`
   - `useFetch('/auth/me')` on app load to restore session

4. **Full connect** — Replace the Week 7 Task Manager's in-memory state with real
   API calls to your backend. All CRUD actions go through `api.js`.

5. **Deploy** — Deploy your backend to Render and frontend to Vercel. Test the live
   URLs end-to-end. Verify CORS works correctly.

---

## 11. Milestone Project — Full-Stack Task Manager App

Build and **deploy** a complete full-stack task manager application:

### Backend (Express + MongoDB)
- User model: name, email, hashed password, avatar (URL string), createdAt
- Task model: title, description, status (todo/in-progress/done), priority (low/medium/high),
  dueDate, tags[], owner (ref User)
- Auth routes: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Task routes (all protected): full CRUD + `GET /tasks?status=&priority=&sort=&page=&limit=`
- Global error handler + asyncHandler wrapper
- Rate limiting on auth routes (prevent brute force)

### Frontend (React + Vite + Zustand)
- Login and Register pages with form validation
- Auth context that restores session on page load
- Dashboard showing task stats (total, by status, by priority)
- Task board with Kanban columns (todo / in-progress / done) — drag to move
- Task create/edit modal (controlled form)
- Filter bar: by priority, by tag, by due date range
- Profile page: update name and avatar URL

### Deployment
- Backend → Render (free tier)
- Frontend → Vercel
- MongoDB → Atlas (free tier)
- All environment variables set in hosting dashboards

---

## 12. Sources

| Resource | What to Search |
|----------|---------------|
| JWT.io | https://jwt.io — decode and debug tokens |
| bcrypt npm | https://www.npmjs.com/package/bcrypt |
| jsonwebtoken npm | https://www.npmjs.com/package/jsonwebtoken |
| Vercel docs | https://vercel.com/docs |
| Render docs | https://render.com/docs |
| YouTube | `"Traversy Media — MERN Stack From Scratch"`, `"Net Ninja — MERN Auth Tutorial"` |

---

## Congratulations — You've Completed React Mastery!

You can now:
- Build and deploy a full-stack React + Node.js + MongoDB application
- Explain how JWT authentication works end-to-end
- Implement secure routes with role-based access control
- Structure large React projects professionally
- Use modern tooling (Vite, Zustand, React Router) productively

**Next steps:**
- Learn TypeScript — add type safety to everything you built
- Explore Next.js — server-side rendering, file-based routing, Server Actions
- Try Prisma — type-safe ORM for SQL databases
- Open source contribution — contribute to a real project using your skills