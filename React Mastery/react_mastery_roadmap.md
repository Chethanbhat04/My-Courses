# React Mastery: 12-Week Deep-Dive Roadmap

> **Goal:** Go from essential JavaScript knowledge to building and deploying a
> full-stack React + Node.js + MongoDB application — the skill set that every
> modern web developer needs.

> [!TIP]
> **How to use this roadmap:** Dedicate ~2 hours/day on weekdays and ~4-5 hours
> on weekends (milestone project). Each week builds on the last. Do NOT skip
> the "Under the Hood" explanations — that is where real understanding lives.

---

## Roadmap Overview

| Phase | Weeks | Focus |
|-------|-------|-------|
| **Phase 1 (Frontend)** | 1–5 | JS Essentials + React Core + Hooks |
| **Phase 2 (Frontend)** | 6–8 | React in Production (Routing, State, Performance) |
| **Phase 3 (Backend)**  | 9–12 | Node.js + Express + MongoDB + Auth + Deployment |

---

# Phase 1 — JS Essentials & React Core

> *"You cannot build a reliable React app on a shaky JavaScript foundation."*

---

## Week 1 — JS You MUST Know Before React

### Theme
**The JavaScript features React uses in every file**

### Core Concepts

1. **Destructuring** — object and array destructuring, nested destructuring, default
   values, destructuring in function parameters. Used in: every prop signature,
   useState, useReducer.

2. **Spread and Rest** — spreading objects (immutable state updates), spreading
   arrays (adding/removing items), rest in function params and object rest.

3. **Arrow Functions** — implicit return, no `this` binding (why React hooks use them),
   returning objects with `()`.

4. **Template Literals** — embedding expressions, multi-line strings, tagged templates.

5. **Array Methods** — `.map()` (list rendering), `.filter()` (removing from state),
   `.find()` (single item lookup), `.reduce()` (aggregation).

6. **Short-Circuit & Nullish** — `&&` for conditional JSX, `||` for fallbacks,
   `??` for null/undefined-only fallbacks, `??=` assignment.

7. **Optional Chaining** — `?.` for safe property access, `?.()` for method calls,
   `?.[]` for dynamic properties.

8. **ES Modules** — named exports, default exports, `import * as`, choosing which to use.

9. **Promises & async/await** — Promise states, async functions, try/catch,
   `Promise.all` for parallel requests.

### Under the Hood
When you write `const { name, age } = props`, JavaScript's engine creates bindings
in the current scope pointing to the same values that `props.name` and `props.age`
point to. No copy is made for primitives that are already primitive. For objects,
the destructured variable holds the same reference — modifying the extracted object
modifies the original (relevant when spreading state).

### Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Destructuring"`, `"Spread syntax"`, `"Arrow functions"`, `"Optional chaining"`, `"async function"` |
| javascript.info | `"Destructuring assignment"`, `"Array methods"`, `"Promises"` |
| YouTube | `"Fireship — JavaScript in 100 Seconds"` |

### Milestone Project
**JS Kata Suite** — 5 pure JS functions demonstrating every feature from this week.

---

## Week 2 — React Core: JSX, Components & Props

### Theme
**From HTML to components: React's mental model**

### Core Concepts

1. **What React Is** — a UI library for building component trees, one-way data flow,
   Virtual DOM, reconciliation.

2. **JSX** — compiles to `React.createElement()`, differences from HTML (className,
   self-closing, camelCase events), expressions in `{}`, single root rule, Fragments.

3. **Components** — functions that return JSX, capital letter convention, one
   component per file, returning null.

4. **Props** — passing values, any JS value, read-only rule, default values,
   prop types.

5. **children Prop** — building wrapper/layout components.

6. **Conditional Rendering** — ternary, `&&`, early return.

7. **List Rendering** — `.map()` + the `key` prop requirement, why index keys break things.

8. **Component Composition** — breaking UI into small focused components, composing them.

### Milestone Project
**Profile Card Builder** — grid of developer profile cards with skills badges,
social links, and conditional rendering.

---

## Week 3 — State, Events & Controlled Components

### Theme
**Making things interactive: React's reactivity model**

### Core Concepts

1. **Why State** — why variables reset on re-render, what state actually is.

2. **useState** — array return, setter replaces (does not merge), no direct mutation,
   functional updater form, async nature, per-instance isolation.

3. **Events** — camelCase handlers, function reference not call, SyntheticEvent,
   common event types.

4. **Immutable Object State** — spread + override pattern.

5. **Immutable Array State** — add (spread), remove (filter), update (map).

6. **Lifting State Up** — moving state to the closest common parent, passing
   setter as prop.

7. **Controlled Components** — input value driven by state + onChange, uncontrolled
   alternative, select and checkbox pattern.

### Milestone Project
**Interactive Todo App** — add, toggle, delete, filter, clear completed.

---

## Week 4 — useEffect, Data Fetching & Side Effects

### Theme
**Connecting React to the outside world**

### Core Concepts

1. **Side Effects** — what breaks React's purity, why effects need a special place.

2. **useEffect Mental Model** — runs AFTER render, optional cleanup return, execution timing.

3. **Dependency Array** — no array (every render), `[]` (once), `[a, b]` (on change),
   exhaustive deps rule, stale closure bug.

4. **Data Fetching Pattern** — loading/error/data state trio, async function inside
   useEffect, why you can't async the callback.

5. **Cleanup Functions** — `isCancelled` flag pattern, AbortController (preferred).

6. **Race Conditions** — what they are, how AbortController prevents them.

7. **Common Mistakes** — infinite loop from updating deps, stacking event listeners.

### Milestone Project
**GitHub User Explorer** — search by username, fetch profile + repos, AbortController, history.

---

## Week 5 — Advanced Hooks & Custom Hooks

### Theme
**The hooks that separate beginners from intermediate developers**

### Core Concepts

1. **useRef** — mutable without re-render, DOM node access, storing previous values.

2. **useReducer** — when to use over useState, reducer purity, dispatch pattern,
   comparison with Redux.

3. **useMemo** — caching expensive computations, dependency array, when NOT to use.

4. **useCallback** — stable function references, only useful with React.memo.

5. **Custom Hooks** — extraction pattern, independent state per call, `useFetch`,
   `useLocalStorage`, `useDebounce`.

6. **Rules of Hooks** — top-level only, function components/custom hooks only, why
   order matters.

### Milestone Project
**Stopwatch (useReducer) + Persistent Preferences (useLocalStorage)**

---

# Phase 2 — React in Production

---

## Week 6 — React Router & Navigation

### Theme
**Multi-page apps without page reloads**

### Core Concepts

1. **Client-Side Routing** — server-side vs client-side, History API, no page reload.

2. **React Router v6 Setup** — BrowserRouter, Routes, Route, path="*" 404.

3. **Link & NavLink** — why not `<a>`, NavLink active styling.

4. **Route Params** — `:id`, `useParams`, string conversion.

5. **Nested Routes** — layout components, `<Outlet />`, index routes.

6. **useNavigate** — programmatic navigation, `navigate(-1)`, state passing.

7. **useSearchParams** — query params for filters/pagination, bookmarkable URLs.

8. **Protected Routes** — auth guard component, `<Navigate replace>`, redirect back.

### Milestone Project
**Multi-Page Blog** — public pages, search with query params, protected `/admin`.

---

## Week 7 — Global State: Context API & Zustand

### Theme
**Sharing state without prop drilling**

### Core Concepts

1. **Prop Drilling** — the problem, tight coupling, maintenance burden.

2. **Creating Context** — `createContext`, Provider component, value object.

3. **Consuming Context** — `useContext`, custom hook pattern, validation.

4. **Context Performance** — every consumer re-renders on any change, split by frequency.

5. **Context + useReducer** — structured global state without external libraries.

6. **Zustand** — `create()`, state + actions in one object, selective subscription,
   no Provider needed, DevTools.

7. **When to Use Which** — decision table, Context for simple/rare, Zustand for frequent/complex.

### Milestone Project
**Theme + Auth Context + Cart Zustand** — full provider architecture with dark/light mode, auth, cart.

---

## Week 8 — Performance, Patterns & Production Readiness

### Theme
**Building React apps that scale**

### Core Concepts

1. **Re-render Mental Model** — 3 triggers, React DevTools Profiler.

2. **React.memo** — shallow prop comparison, breaks with inline functions/objects.

3. **Code Splitting** — why bundle size matters, `React.lazy + dynamic import`, route-level splitting.

4. **Suspense** — declarative loading states, nested boundaries.

5. **Error Boundaries** — class component requirement, catching render errors,
   `react-error-boundary` library.

6. **Compound Components** — Context + sub-components, flexible API, Tab example.

7. **Folder Structure** — feature-based vs type-based, when each scales.

8. **Vite** — vs webpack, `vite.config.js`, path aliases, env variables, proxy.

### Milestone Project
**Optimized Infinite Scroll List** — GitHub Search API, IntersectionObserver, React.memo, Zustand, Vite aliases.

---

# Phase 3 — Backend: Node.js + Express + MongoDB

---

## Week 9 — Node.js & the Runtime Model

### Theme
**JavaScript that runs on servers**

### Core Concepts

1. **What Node.js Is** — V8 + libuv, not a browser, server APIs vs browser APIs.

2. **Event Loop** — phases (timers, poll, check), microtasks (nextTick, Promise),
   single-threaded async I/O.

3. **CommonJS vs ESM** — `require/module.exports` vs `import/export`, `.mjs`,
   `"type": "module"`, which to use.

4. **Built-in Modules** — `path` (join, resolve, basename), `fs/promises` (read, write, readdir),
   `os` (platform, cpus, homedir).

5. **npm** — install, devDependencies, semver, package-lock.json.

6. **Raw HTTP Server** — `http.createServer`, req/res objects, routing manually,
   reading POST body from stream.

7. **dotenv** — `.env` file, `process.env`, `.env.example` pattern.

### Milestone Project
**File Stats CLI Tool** — recursive directory scan, lines of code per extension, JSON output.

---

## Week 10 — Express.js: REST APIs from Scratch

### Theme
**The framework that powers 60% of Node.js APIs**

### Core Concepts

1. **What Express Adds** — vs raw http, routing, middleware pipeline, response helpers.

2. **Middleware** — `(req, res, next)` signature, pipeline order, `app.use()`,
   third-party middleware (cors, morgan, helmet).

3. **Routing** — `app.METHOD(path, handler)`, `express.Router()`, mounting routers.

4. **Request Object** — `req.params`, `req.query`, `req.body`, `req.headers`.

5. **Response Object** — `res.json()`, HTTP status codes, chaining `.status().json()`.

6. **REST Design** — nouns not verbs, plural resources, nesting depth, API versioning.

7. **Full CRUD** — all 5 operations with validation and proper status codes.

8. **Error Handling** — 4-arg middleware, `asyncHandler` wrapper, global handler.

### Milestone Project
**Books REST API** — full CRUD, filtering, pagination, search, Router files, global error handler.

---

## Week 11 — Databases: MongoDB + Mongoose

### Theme
**Persisting data properly**

### Core Concepts

1. **MongoDB** — documents vs rows, BSON, collections, ObjectId, schemaless nature.

2. **Atlas Setup** — cloud cluster, user, network access, connection string.

3. **Mongoose Connect** — `mongoose.connect()`, connect-then-listen pattern.

4. **Schemas** — types, required, trim, unique, enum, default, select:false, timestamps.

5. **Models** — `mongoose.model()`, collection naming, exporting.

6. **CRUD** — `create`, `find`, `findById`, `findOne`, `findByIdAndUpdate` ($set),
   `findByIdAndDelete`.

7. **Querying** — `.select()`, `.sort()`, `.skip()`, `.limit()`, MongoDB operators
   ($gt, $in, $regex, $or), `countDocuments`.

8. **Relationships** — embedding (one document inside another) vs referencing (ObjectId ref),
   `populate()`, decision rules.

9. **Schema Hooks** — `pre('save')` for password hashing, instance methods, virtuals.

10. **Indexing** — single, compound, text, unique, when to add indexes.

### Milestone Project
**Notes API** — full CRUD with search/pagination, User + Note relationship with populate, pre-save hook.

---

## Week 12 — Auth, Deployment & Full-Stack Integration

### Theme
**From localhost to the internet**

### Core Concepts

1. **JWT** — structure (header.payload.signature), signing, verifying, expiry, what NOT to store.

2. **Bcrypt** — hashing vs encryption, salt rounds, `hash()`, `compare()`.

3. **Auth API** — register, login, `/auth/me` endpoints, same error message for security.

4. **Auth Middleware** — extracting Bearer token, `jwt.verify()`, attaching `req.user`,
   `restrictTo()` role guard.

5. **CORS** — why it exists, `cors()` middleware, origins whitelist for production.

6. **React Auth Flow** — `api.js` utility, storing token in localStorage, restoring
   session on load, Auth context integration.

7. **Environment Variables** — backend `.env` (secrets), frontend `.env.local` (`VITE_`
   prefix), hosting dashboards.

8. **Deployment** — Vercel CLI/dashboard for React, Render for Express, Atlas for MongoDB,
   `vercel.json` for Express on Vercel.

### Milestone Project
**Full-Stack Task Manager App** — deployed, authenticated, Kanban board, filter/sort,
React + Express + MongoDB + Vercel + Render.

---

## Tools You Will Use

| Category | Tool | Purpose |
|----------|------|---------|
| Frontend Framework | React 18 | UI library |
| Build Tool | Vite | Dev server + bundler |
| Routing | React Router v6 | Client-side routing |
| State | Zustand | Global state |
| HTTP Client | Fetch API (+ custom wrapper) | API calls |
| Backend Framework | Express.js | REST API |
| Database | MongoDB (Atlas) | Data persistence |
| ODM | Mongoose | Schema + models |
| Auth | JWT + Bcrypt | Authentication |
| Frontend Deploy | Vercel | Hosting React app |
| Backend Deploy | Render | Hosting Express API |
| Dev Tool | Postman / Thunder Client | API testing |
| Dev Tool | React DevTools | Component inspection + profiling |
| Dev Tool | MongoDB Compass | Database GUI |

---

## After This Course

You are now a **full-stack JavaScript developer**. The next frontier:

- **TypeScript** — add type safety to everything you built
- **Next.js** — React with SSR, file-based routing, Server Components, Server Actions
- **Prisma** — type-safe ORM for SQL databases (PostgreSQL)
- **GraphQL** — alternative to REST for flexible APIs
- **Docker** — containerize your backend for consistent deployment
- **Testing** — Vitest (unit), React Testing Library (component), Playwright (E2E)