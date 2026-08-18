# Week 8 — Performance, Patterns & Production Readiness

# The Complete Deep-Dive Lesson

> **By the end of this week you will know how to measure React performance,
> prevent unnecessary re-renders, split your code for faster loads, handle
> runtime errors gracefully, structure large projects professionally, and set
> up a production-grade Vite toolchain.**

---

## Table of Contents

1. [How React Re-renders — The Mental Model](#1-how-react-re-renders--the-mental-model)
2. [React.memo — Preventing Unnecessary Re-renders](#2-reactmemo--preventing-unnecessary-re-renders)
3. [Code Splitting & Lazy Loading](#3-code-splitting--lazy-loading)
4. [Suspense — Handling Loading States Declaratively](#4-suspense--handling-loading-states-declaratively)
5. [Error Boundaries — Graceful Failure](#5-error-boundaries--graceful-failure)
6. [The Compound Component Pattern](#6-the-compound-component-pattern)
7. [Folder Structure for Large Projects](#7-folder-structure-for-large-projects)
8. [Vite — The Modern Dev Toolchain](#8-vite--the-modern-dev-toolchain)
9. [Exercises](#9-exercises)
10. [Milestone Project](#10-milestone-project)
11. [Sources](#11-sources)

---

## 1. How React Re-renders — The Mental Model

Before optimizing, you need to understand exactly when React re-renders.

- **A component re-renders when: (1) its own state changes, (2) its parent
  re-renders, or (3) a context it consumes changes** — The most common performance
  issue is #2: a parent re-renders, causing all children to re-render even if
  their props did not change.

  ```jsx
  function Parent() {
    const [count, setCount] = useState(0);

    return (
      <>
        <button onClick={() => setCount(c => c + 1)}>Increment</button>
        <ExpensiveChild name="Chethan" /> {/* Re-renders on EVERY count change */}
      </>
    );
  }

  function ExpensiveChild({ name }) {
    // This runs on every Parent re-render even though `name` never changes
    console.log("ExpensiveChild rendered");
    return <p>Hello, {name}</p>;
  }
  ```

- **Use React DevTools Profiler to measure before optimizing** — Do not guess.
  Open Chrome DevTools → React tab → Profiler → Record → interact → Stop.
  The flamegraph shows exactly which components re-rendered and how long they took.
  Only optimize components that show measurable render time.

---

## 2. React.memo — Preventing Unnecessary Re-renders

- **`React.memo` wraps a component and tells React: "only re-render if the props
  actually changed"** — React does a shallow comparison of props. If they are the
  same (by reference for objects/functions, by value for primitives), React skips
  re-rendering and reuses the last rendered output.

  ```jsx
  import { memo } from 'react';

  // Without memo — re-renders every time Parent re-renders:
  function ExpensiveChild({ name }) {
    console.log("Rendered");
    return <p>Hello, {name}</p>;
  }

  // With memo — only re-renders when `name` changes:
  const ExpensiveChild = memo(function ExpensiveChild({ name }) {
    console.log("Rendered");
    return <p>Hello, {name}</p>;
  });
  ```

- **`React.memo` breaks when you pass a new function or object on every render** —
  Primitive values (strings, numbers, booleans) compare by value. Objects and
  functions compare by reference. A new `{}` or `() => {}` created during render
  is a different reference every time, so memo thinks props changed.

  ```jsx
  function Parent() {
    const [count, setCount] = useState(0);

    // ❌ New function object every render — memo is bypassed
    const handleClick = () => console.log("clicked");

    // ✅ Stable reference — use useCallback
    const handleClick = useCallback(() => console.log("clicked"), []);

    // ❌ New object every render — memo is bypassed
    const style = { color: "red" };

    // ✅ Stable reference — use useMemo
    const style = useMemo(() => ({ color: "red" }), []);

    return <MemoizedChild onClick={handleClick} style={style} />;
  }

  const MemoizedChild = memo(function Child({ onClick, style }) { ... });
  ```

  The trio `memo + useCallback + useMemo` works together to prevent re-renders.

---

## 3. Code Splitting & Lazy Loading

- **By default, Vite/webpack bundles all your JS into one file** — If your app is
  large, the user downloads ALL the code (including pages they may never visit)
  before seeing anything. Code splitting breaks the bundle into smaller chunks
  that load only when needed.

- **`React.lazy()` + dynamic `import()` loads a component only when it is first
  rendered** — The component's code is fetched from the server on demand, not upfront.
  This dramatically reduces the initial bundle size.

  ```jsx
  import { lazy, Suspense } from 'react';

  // ❌ Eager import — always included in main bundle
  import Dashboard from './pages/Dashboard';
  import Settings  from './pages/Settings';

  // ✅ Lazy import — each page is a separate chunk, loaded on demand
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  const Settings  = lazy(() => import('./pages/Settings'));

  function App() {
    return (
      <Suspense fallback={<PageSpinner />}>  {/* Required wrapper */}
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings"  element={<Settings />} />
        </Routes>
      </Suspense>
    );
  }
  ```

  When the user navigates to `/dashboard` for the first time, the browser fetches
  `Dashboard.chunk.js`. The `Suspense` fallback shows while it loads.

- **Split at the route level first** — Splitting by route gives you the best
  return for minimal effort. Each page loads only its own code. You rarely need
  to split individual components unless they are very large (rich text editor,
  chart libraries, map components).

---

## 4. Suspense — Handling Loading States Declaratively

- **`Suspense` is React's declarative way to show a fallback UI while async
  operations complete** — Currently works with `React.lazy`. In the future (and
  with libraries like React Query v5, Next.js), it will work for data fetching too.

  ```jsx
  import { Suspense } from 'react';

  function App() {
    return (
      // Outer Suspense: page-level loading (full-page spinner)
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* Inner Suspense: section-level loading (skeleton) */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<DashboardSkeleton />}>
                <Dashboard />
              </Suspense>
            }
          />
        </Routes>
      </Suspense>
    );
  }
  ```

  Nest `Suspense` boundaries to get granular loading states. The closest ancestor
  Suspense catches the "loading" signal.

---

## 5. Error Boundaries — Graceful Failure

- **An Error Boundary is a class component that catches JavaScript errors in its
  child tree and shows a fallback UI instead of crashing the entire app** —
  Without error boundaries, a single component throwing an error unmounts the
  entire React tree and the user sees a blank page.

  Error boundaries must be class components (no hook equivalent yet). You write
  one and use it everywhere:

  ```jsx
  // ErrorBoundary.jsx — write this once, reuse everywhere
  import { Component } from 'react';

  class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      // Update state to show the fallback UI
      return { hasError: true, error };
    }

    componentDidCatch(error, info) {
      // Log the error to an error reporting service (Sentry, etc.)
      console.error("Caught error:", error, info.componentStack);
    }

    render() {
      if (this.state.hasError) {
        return this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong.</h2>
            <button onClick={() => this.setState({ hasError: false })}>Try again</button>
          </div>
        );
      }
      return this.props.children;
    }
  }

  export default ErrorBoundary;
  ```

  ```jsx
  // Wrap any component that might fail:
  <ErrorBoundary fallback={<p>The user profile failed to load.</p>}>
    <UserProfile userId={id} />
  </ErrorBoundary>

  // Or wrap entire sections:
  <ErrorBoundary>
    <Dashboard />
  </ErrorBoundary>
  ```

- **Use `react-error-boundary` library for a cleaner functional approach** —
  The library provides `ErrorBoundary` and `useErrorBoundary` hook.

  ```bash
  npm install react-error-boundary
  ```

  ```jsx
  import { ErrorBoundary } from 'react-error-boundary';

  function ErrorFallback({ error, resetErrorBoundary }) {
    return (
      <div role="alert">
        <p>Something went wrong:</p>
        <pre>{error.message}</pre>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    );
  }

  <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => refetch()}>
    <UserProfile userId={id} />
  </ErrorBoundary>
  ```

---

## 6. The Compound Component Pattern

- **Compound components are a group of components that work together and share
  implicit state through Context** — They provide a flexible, expressive API
  without requiring the consumer to manage state or pass many props. Think of
  HTML's `<select>` + `<option>` — they work together implicitly.

  ```jsx
  // Building a Tab component with compound pattern:
  import { createContext, useContext, useState } from 'react';

  const TabsContext = createContext(null);

  function Tabs({ children, defaultTab = 0 }) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab }}>
        <div className="tabs">{children}</div>
      </TabsContext.Provider>
    );
  }

  function TabList({ children }) {
    return <div className="tab-list" role="tablist">{children}</div>;
  }

  function Tab({ children, index }) {
    const { activeTab, setActiveTab } = useContext(TabsContext);
    return (
      <button
        className={`tab ${activeTab === index ? "tab--active" : ""}`}
        onClick={() => setActiveTab(index)}
        role="tab"
      >
        {children}
      </button>
    );
  }

  function TabPanel({ children, index }) {
    const { activeTab } = useContext(TabsContext);
    return activeTab === index ? <div className="tab-panel">{children}</div> : null;
  }

  // Attach sub-components for a clean API:
  Tabs.List  = TabList;
  Tabs.Tab   = Tab;
  Tabs.Panel = TabPanel;

  export default Tabs;
  ```

  ```jsx
  // Consumer API — clean, readable, no prop threading:
  <Tabs defaultTab={0}>
    <Tabs.List>
      <Tabs.Tab index={0}>Profile</Tabs.Tab>
      <Tabs.Tab index={1}>Settings</Tabs.Tab>
      <Tabs.Tab index={2}>Activity</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel index={0}><ProfileContent /></Tabs.Panel>
    <Tabs.Panel index={1}><SettingsContent /></Tabs.Panel>
    <Tabs.Panel index={2}><ActivityFeed /></Tabs.Panel>
  </Tabs>
  ```

---

## 7. Folder Structure for Large Projects

There is no single "correct" structure, but here is a proven, scalable approach:

```
src/
├── assets/             # Images, fonts, icons
├── components/         # Truly reusable, UI-only components (Button, Card, Modal)
│   ├── Button/
│   │   ├── Button.jsx
│   │   ├── Button.module.css
│   │   └── index.js    # re-exports Button for cleaner imports
│   └── ...
├── features/           # Feature-based grouping (recommended for medium/large apps)
│   ├── auth/
│   │   ├── components/ # Components specific to auth (LoginForm, SignupForm)
│   │   ├── hooks/      # useAuth, useSession
│   │   ├── store/      # Auth Zustand store
│   │   └── index.js    # public API of the auth feature
│   ├── cart/
│   └── products/
├── hooks/              # Global custom hooks (useDebounce, useWindowSize)
├── pages/              # Page-level components (route endpoints)
│   ├── HomePage.jsx
│   ├── DashboardPage.jsx
│   └── ...
├── store/              # Global Zustand stores
├── utils/              # Pure utility functions (formatDate, validateEmail)
├── App.jsx
└── main.jsx
```

- **Feature-based structure scales better than type-based** — `features/auth/`
  keeps everything auth-related together. Type-based structure (`components/`,
  `hooks/`, `utils/` at the top level) works for small apps but gets unwieldy
  as the app grows — you end up hunting across folders to understand one feature.

---

## 8. Vite — The Modern Dev Toolchain

- **Vite is a build tool that starts a development server in milliseconds and
  bundles for production using Rollup** — Unlike webpack (which bundles everything
  before serving), Vite serves source files directly as ES modules. The browser
  requests what it needs, so startup is near-instant regardless of app size.

  ```bash
  # Create a new React + Vite project:
  npm create vite@latest my-app -- --template react
  cd my-app
  npm install
  npm run dev      # dev server at http://localhost:5173
  npm run build    # production build → dist/
  npm run preview  # preview production build locally
  ```

- **Vite's `vite.config.js` is where you configure the project** — Aliases,
  proxy (to avoid CORS in dev), plugins, and build options.

  ```js
  // vite.config.js
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // @/components/Button instead of ../../components/Button
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000', // forward /api calls to your backend in dev
      },
    },
  });
  ```

- **Environment variables in Vite must be prefixed with `VITE_`** — Only variables
  with the `VITE_` prefix are exposed to the browser bundle. Server-only secrets
  (like database passwords) must NOT have this prefix.

  ```bash
  # .env.local
  VITE_API_BASE_URL=https://api.example.com
  VITE_APP_NAME=My App
  DB_PASSWORD=secret123  # NOT exposed to the client — no VITE_ prefix
  ```

  ```js
  // Access in code:
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  ```

---

## 9. Exercises

1. **Profiling** — Open your Week 3 Todo App. Use React DevTools Profiler to find
   which components re-render when you type in the search filter. Are they
   necessary? Apply `React.memo` and verify the fix.

2. **Lazy loading** — Convert a 3-page app to use lazy loading for each page.
   Open the browser Network tab and confirm each page's JS chunk loads only when
   you navigate to it.

3. **Error boundary** — Wrap your GitHub User Explorer (Week 4) in an
   `ErrorBoundary`. Write a component that randomly throws an error (Math.random()
   > 0.5). Verify the boundary catches it and shows a retry button.

4. **Compound pattern** — Build an `Accordion` component using the compound pattern:
   `Accordion`, `Accordion.Item`, `Accordion.Header`, `Accordion.Body`. Only one
   item can be open at a time. State lives in `Accordion`.

5. **Folder refactor** — Take your blog app from Week 6 and reorganize it using
   the feature-based folder structure. Update all import paths.

---

## 10. Milestone Project

### Optimized Infinite Scroll List

Build a React app that:

1. Fetches paginated data from the GitHub Search API: `GET /search/repositories?q=react&per_page=10&page=N`
2. Implements infinite scroll using `IntersectionObserver` (attach a `ref` to a
   sentinel `<div>` at the bottom; load next page when it becomes visible).
3. Uses `React.memo` on repo cards to prevent re-renders.
4. Uses `useMemo` to compute language statistics from loaded repos.
5. Is split into lazy-loaded sections: SearchSection and ResultsSection.
6. Has a global `ErrorBoundary` with retry.
7. Uses Zustand to store the loaded repos, current page, and query.
8. Uses Vite path aliases (`@/components/...`).

---

## 11. Sources

| Resource | What to Search |
|----------|---------------|
| react.dev | `"Keeping Components Pure"`, `"React.memo"`, `"lazy"`, `"Suspense"` |
| Vite docs | https://vite.dev |
| react-error-boundary | https://github.com/bvaughn/react-error-boundary |
| YouTube | `"Jack Herrington — React Performance"`, `"Theo — When to use useMemo"` |