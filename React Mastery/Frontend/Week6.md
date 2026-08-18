# Week 6 — React Router & Navigation

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand why client-side routing exists,
> how React Router v6 works under the hood, how to build dynamic routes, navigate
> programmatically, and protect routes that require authentication.**

---

## Table of Contents

1. [What is Client-Side Routing?](#1-what-is-client-side-routing)
2. [React Router v6 — Setup & Core Concepts](#2-react-router-v6--setup--core-concepts)
3. [Route Parameters — Dynamic URLs](#3-route-parameters--dynamic-urls)
4. [Nested Routes & Layouts](#4-nested-routes--layouts)
5. [Programmatic Navigation with useNavigate](#5-programmatic-navigation-with-usenavigate)
6. [Query Parameters & useSearchParams](#6-query-parameters--usesearchparams)
7. [Protected Routes — Auth Guards](#7-protected-routes--auth-guards)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. What is Client-Side Routing?

- **Traditional (server-side) routing sends a new HTML page from the server for
  every URL change** — Clicking a link causes a full page reload. The browser
  discards everything, makes a network request, and paints a brand-new page.
  This is slow and causes a visible flash.

  ```
  Server-Side Routing:
  User clicks /about
    → Browser sends GET /about
    → Server returns full HTML page
    → Browser re-paints everything
    → State is lost (scroll position, form data)
  ```

- **Client-side routing intercepts link clicks and changes the URL without a
  full page reload** — React Router hooks into the browser's History API
  (`pushState`, `replaceState`) to change the URL and renders the correct
  component based on that URL — all without a network request.

  ```
  Client-Side Routing (React Router):
  User clicks /about
    → React Router intercepts (no page reload)
    → URL changes to /about (History API)
    → React renders <About /> component
    → Rest of the app (header, state) stays intact
  ```

  This makes React apps feel like native apps — instant transitions, preserved
  state, no flicker.

---

## 2. React Router v6 — Setup & Core Concepts

Install React Router:
```bash
npm install react-router-dom
```

- **`BrowserRouter` wraps your entire app and provides routing context** — It
  reads the browser's URL and makes it available to all child components.

  ```jsx
  // main.jsx
  import { BrowserRouter } from 'react-router-dom';
  import App from './App';

  ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  ```

- **`Routes` and `Route` define which component renders for which URL path** —
  `Routes` renders only the first `Route` whose `path` matches the current URL.
  Unlike v5, no need for `exact` — v6 is exact by default.

  ```jsx
  // App.jsx
  import { Routes, Route } from 'react-router-dom';
  import Home      from './pages/Home';
  import About     from './pages/About';
  import UserList  from './pages/UserList';
  import UserDetail from './pages/UserDetail';
  import NotFound  from './pages/NotFound';

  function App() {
    return (
      <div>
        <Navbar />  {/* Always visible */}
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/about"      element={<About />} />
          <Route path="/users"      element={<UserList />} />
          <Route path="/users/:id"  element={<UserDetail />} />
          <Route path="*"           element={<NotFound />} /> {/* catch-all */}
        </Routes>
      </div>
    );
  }
  ```

  The `path="*"` route matches anything that did not match above — your 404 page.

- **Use `<Link>` instead of `<a>` for internal navigation** — `<a href="/about">`
  causes a full page reload. `<Link to="/about">` changes the URL without a
  reload, preserving all React state.

  ```jsx
  import { Link } from 'react-router-dom';

  function Navbar() {
    return (
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/users">Users</Link>
      </nav>
    );
  }
  ```

- **`<NavLink>` is `<Link>` with active-state styling** — It automatically adds
  an `active` class (or a custom class via `className`) when its path matches the
  current URL. Perfect for navigation bars.

  ```jsx
  import { NavLink } from 'react-router-dom';

  function Navbar() {
    return (
      <nav>
        <NavLink
          to="/users"
          className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"}
        >
          Users
        </NavLink>
      </nav>
    );
  }
  ```

---

## 3. Route Parameters — Dynamic URLs

- **Route parameters (`/:id`) capture a segment of the URL as a variable** —
  They allow a single route to handle many similar URLs like `/users/1`,
  `/users/2`, `/products/laptop`, etc.

  ```jsx
  // Route definition:
  <Route path="/users/:id" element={<UserDetail />} />

  // UserDetail reads the :id parameter with the useParams hook:
  import { useParams } from 'react-router-dom';

  function UserDetail() {
    const { id } = useParams(); // { id: "42" } for URL /users/42
    const [user, setUser] = useState(null);

    useEffect(() => {
      fetchUser(id).then(setUser);
    }, [id]); // re-fetches when id changes

    if (!user) return <p>Loading...</p>;
    return <h1>{user.name}</h1>;
  }
  ```

  Note: `id` is always a **string** — convert it with `Number(id)` or `parseInt(id)`
  if your API expects a number.

- **Multiple parameters in a single route** — Combine parameters for complex URLs.

  ```jsx
  <Route path="/categories/:category/products/:productId" element={<Product />} />

  function Product() {
    const { category, productId } = useParams();
    // URL /categories/electronics/products/laptop → { category: "electronics", productId: "laptop" }
  }
  ```

---

## 4. Nested Routes & Layouts

- **Nested routes allow a parent route to define a shared layout that child
  routes render into** — This is how you build consistent layouts (sidebars,
  headers per section) without repeating the layout code.

  ```jsx
  // App.jsx — dashboard has a nested layout
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/dashboard" element={<DashboardLayout />}>
      {/* Child routes render inside DashboardLayout's <Outlet /> */}
      <Route index element={<DashboardHome />} />        {/* /dashboard */}
      <Route path="stats"   element={<Stats />} />       {/* /dashboard/stats */}
      <Route path="settings" element={<Settings />} />   {/* /dashboard/settings */}
    </Route>
  </Routes>
  ```

  ```jsx
  // DashboardLayout.jsx — contains the shared sidebar and <Outlet>
  import { Outlet, NavLink } from 'react-router-dom';

  function DashboardLayout() {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <NavLink to="/dashboard">Overview</NavLink>
          <NavLink to="/dashboard/stats">Stats</NavLink>
          <NavLink to="/dashboard/settings">Settings</NavLink>
        </aside>
        <main className="dashboard-content">
          <Outlet />  {/* Child route component renders here */}
        </main>
      </div>
    );
  }
  ```

  The `<Outlet />` is a placeholder where the active child route renders. This
  is the v6 equivalent of "router-view" in Vue or `{children}` for routing.

---

## 5. Programmatic Navigation with useNavigate

- **`useNavigate()` returns a function to navigate imperatively from JavaScript
  code** — Use it when you need to redirect after a form submission, login
  success, or any event that is not a link click.

  ```jsx
  import { useNavigate } from 'react-router-dom';

  function LoginForm() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(e) {
      e.preventDefault();
      try {
        await login(email, password);   // API call
        navigate("/dashboard");          // redirect on success
      } catch (err) {
        setError(err.message);
      }
    }

    return <form onSubmit={handleSubmit}>...</form>;
  }
  ```

- **`navigate(-1)` goes back, `navigate(1)` goes forward** — Like pressing the
  browser's back button, but from code.

  ```jsx
  function BackButton() {
    const navigate = useNavigate();
    return <button onClick={() => navigate(-1)}>← Back</button>;
  }
  ```

- **Pass state through navigation for data between routes** — `navigate` accepts
  a `state` option. The destination can read it with `useLocation`.

  ```jsx
  // Source page — navigate with state
  navigate("/success", { state: { orderId: "ORD-123", total: 4999 } });

  // Destination page — read the state
  import { useLocation } from 'react-router-dom';

  function SuccessPage() {
    const location = useLocation();
    const { orderId, total } = location.state || {};
    return <p>Order {orderId} placed! Total: ₹{total}</p>;
  }
  ```

---

## 6. Query Parameters & useSearchParams

- **Query parameters are key-value pairs in the URL after `?`** — They are used
  for filtering, sorting, pagination, and search. Example: `/products?category=electronics&sort=price&page=2`.

  ```jsx
  import { useSearchParams } from 'react-router-dom';

  function ProductList() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Read query params:
    const category = searchParams.get("category") || "all";
    const sort     = searchParams.get("sort")     || "name";
    const page     = Number(searchParams.get("page")) || 1;

    // Update query params (changes URL without reload):
    function handleCategoryChange(newCategory) {
      setSearchParams({ category: newCategory, sort, page: 1 }); // reset page on category change
    }

    return (
      <div>
        <select value={category} onChange={e => handleCategoryChange(e.target.value)}>
          <option value="all">All</option>
          <option value="electronics">Electronics</option>
        </select>
        {/* Product list filtered by category, sort, page */}
      </div>
    );
  }
  ```

  Query params are bookmarkable and shareable — the page URL captures the
  entire view state. This is much better than storing filter state locally
  with `useState`.

---

## 7. Protected Routes — Auth Guards

- **A protected route redirects unauthenticated users away from private pages** —
  You create a wrapper component that checks authentication and either renders
  the protected content or redirects to login.

  ```jsx
  // ProtectedRoute.jsx — a reusable auth guard component
  import { Navigate, useLocation } from 'react-router-dom';
  import { useAuth } from './hooks/useAuth'; // your auth context hook

  function ProtectedRoute({ children }) {
    const { user } = useAuth();
    const location = useLocation(); // remember where the user was trying to go

    if (!user) {
      // Redirect to login, but save the intended destination
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children; // user is authenticated — render the protected content
  }

  // App.jsx — wrap protected routes
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      }
    />
  </Routes>
  ```

  ```jsx
  // Login page — redirect back to the intended page after login
  function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    async function handleLogin(credentials) {
      await loginUser(credentials);
      navigate(from, { replace: true }); // go back to where they were trying to go
    }
  }
  ```

  The `replace` option replaces the current entry in the browser history instead
  of adding a new one. This means the user can't press "Back" and end up on the
  login page again after logging in.

---

## 8. Exercises

1. **Basic routing** — Set up a React app with 4 pages: Home, About, Projects,
   Contact. Create a Navbar with NavLinks that highlights the active page.
   Add a 404 page.

2. **Dynamic routes** — Add a `/projects/:slug` route. Clicking a project card
   on the Projects page navigates to its detail page. The detail page reads the
   slug from URL params and fetches project data.

3. **Nested routes** — Create a `/blog` layout with a sidebar showing all post
   titles. Clicking a title shows the post content in the main area. The sidebar
   always stays visible.

4. **Query params** — Add filtering to the Projects page: `?tech=react` filters
   by technology, `?sort=stars` sorts by stars. Use `useSearchParams`. The URL
   must be shareable.

5. **Protected routes** — Implement a fake auth system (store auth in localStorage).
   Protect `/dashboard`. Redirect to `/login` with the intended path. After login,
   redirect back to the intended path.

---

## 9. Milestone Project

### Multi-Page Blog with Protected Admin Route

Build a blog app with:

1. **Public pages**: Home (list of posts), `/posts/:slug` (individual post), About.
2. **NavLink navigation** with active highlighting.
3. **Blog posts** fetched from `https://jsonplaceholder.typicode.com/posts`.
4. **Search & filter** with query params (`?search=react&userId=1`) — bookmarkable URL.
5. **Protected `/admin`** route — requires "login" (fake: check a password stored
   in localStorage). Shows a form to "create" a new post (just updates state).
6. **`/login` page** that redirects back to `/admin` after login.
7. **404 page** with a friendly message and link back home.

---

## 10. Sources

| Resource | What to Search |
|----------|---------------|
| reactrouter.com | Official React Router v6 docs — Tutorial and API reference |
| YouTube | `"Web Dev Simplified — React Router v6"`, `"Codevolution — React Router 6 Tutorial"` |
| react.dev | `"Adding Interactivity"` (for navigation patterns) |