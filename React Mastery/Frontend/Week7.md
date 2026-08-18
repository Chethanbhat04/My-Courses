# Week 7 — Global State: Context API & Zustand

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand prop drilling, how React Context
> solves it, where Context causes performance problems, and how Zustand provides
> a simpler, more scalable alternative for global state management.**

---

## Table of Contents

1. [The Prop Drilling Problem](#1-the-prop-drilling-problem)
2. [React Context — Creating & Providing](#2-react-context--creating--providing)
3. [Consuming Context with useContext](#3-consuming-context-with-usecontext)
4. [Context Performance Problem & Fix](#4-context-performance-problem--fix)
5. [Context + useReducer — Lightweight Redux](#5-context--usereducer--lightweight-redux)
6. [Zustand — Global State Without Boilerplate](#6-zustand--global-state-without-boilerplate)
7. [Context vs Zustand — When to Use Which](#7-context-vs-zustand--when-to-use-which)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. The Prop Drilling Problem

- **Prop drilling is passing props through many intermediate components that do
  not actually need the data — they only forward it to a child deeper down** —
  This creates tight coupling between components, makes refactoring painful, and
  clutters component signatures with props they do not use.

  ```jsx
  // App holds the user and needs to pass it all the way to Avatar
  function App() {
    const [user, setUser] = useState({ name: "Chethan", avatar: "/pic.jpg" });
    return <Page user={user} />;          // Page doesn't use user
  }

  function Page({ user }) {
    return <Header user={user} />;        // Header doesn't use user either
  }

  function Header({ user }) {
    return <Navbar user={user} />;        // Navbar doesn't use it...
  }

  function Navbar({ user }) {
    return <Avatar user={user} />;        // Avatar finally uses it
  }

  function Avatar({ user }) {
    return <img src={user.avatar} alt={user.name} />;  // the actual consumer
  }
  ```

  `Page`, `Header`, and `Navbar` are just conveyor belts for `user`. If you
  rename the prop or add a new one, you must update every intermediate component.

  Context and Zustand let `Avatar` access the user directly, bypassing all the
  middle components.

---

## 2. React Context — Creating & Providing

- **`createContext()` creates a Context object — a container for shared data** —
  Any component inside the Provider can access the data without props.

  ```jsx
  // contexts/UserContext.jsx
  import { createContext, useState } from 'react';

  // 1. Create the context (null is the default value — rarely used in practice)
  export const UserContext = createContext(null);

  // 2. Create the Provider component (best practice: encapsulate in a file)
  export function UserProvider({ children }) {
    const [user, setUser] = useState(null);

    function login(userData)  { setUser(userData); }
    function logout()         { setUser(null); }

    // 3. The value object contains everything consumers need
    const value = { user, login, logout };

    return (
      <UserContext.Provider value={value}>
        {children}
      </UserContext.Provider>
    );
  }
  ```

  ```jsx
  // main.jsx — wrap the app with the provider
  import { UserProvider } from './contexts/UserContext';

  ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  );
  ```

---

## 3. Consuming Context with useContext

- **`useContext(MyContext)` returns the current value of that context** —
  Any component inside the Provider can call this hook to access the shared
  data directly, no matter how deeply nested.

  ```jsx
  // Avatar can now directly access user — no prop drilling!
  import { useContext } from 'react';
  import { UserContext } from '../contexts/UserContext';

  function Avatar() {
    const { user } = useContext(UserContext); // direct access

    if (!user) return <button>Log In</button>;
    return <img src={user.avatar} alt={user.name} />;
  }
  ```

- **Best practice: wrap `useContext` in a custom hook** — This gives you a
  cleaner API, lets you add validation (error if used outside provider), and
  hides the Context object from consumers.

  ```jsx
  // contexts/UserContext.jsx — add a custom hook
  export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
      throw new Error("useUser must be used inside a UserProvider");
    }
    return context;
  }

  // Avatar — even cleaner
  import { useUser } from '../contexts/UserContext';

  function Avatar() {
    const { user } = useUser(); // no need to import UserContext at all
    return user ? <img src={user.avatar} alt={user.name} /> : null;
  }
  ```

---

## 4. Context Performance Problem & Fix

- **Every component that consumes a Context re-renders whenever ANY value in the
  Context changes** — This is the key performance pitfall. If you put many things
  in one context, a change to one thing triggers re-renders across all consumers.

  ```jsx
  // ❌ One big context — a theme change re-renders UserProfile, Cart, Settings...
  const AppContext = createContext();

  function AppProvider({ children }) {
    const [user, setUser]   = useState(null);
    const [theme, setTheme] = useState("dark");
    const [cart, setCart]   = useState([]);

    return (
      <AppContext.Provider value={{ user, setUser, theme, setTheme, cart, setCart }}>
        {children}
      </AppContext.Provider>
    );
    // Changing theme → user re-renders | Changing cart → theme consumers re-render
  }
  ```

  ```jsx
  // ✅ Separate contexts — each context change only re-renders its own consumers
  <ThemeProvider>
    <UserProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </UserProvider>
  </ThemeProvider>

  // UserProfile only re-renders when user changes
  // CartBadge only re-renders when cart changes
  // ThemeToggle only re-renders when theme changes
  ```

- **Split context by update frequency** — Group things that change together.
  User data (changes rarely) → one context. Cart (changes often) → separate context.

---

## 5. Context + useReducer — Lightweight Redux

- **Combining Context with `useReducer` gives you a global state manager with
  structured, predictable updates** — All state transitions are described as
  actions, exactly like Redux, but without any external library.

  ```jsx
  // contexts/CartContext.jsx
  import { createContext, useContext, useReducer } from 'react';

  const CartContext = createContext(null);

  function cartReducer(state, action) {
    switch (action.type) {
      case "ADD_ITEM":
        const existing = state.find(i => i.id === action.item.id);
        if (existing) {
          return state.map(i =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          );
        }
        return [...state, { ...action.item, qty: 1 }];

      case "REMOVE_ITEM":
        return state.filter(i => i.id !== action.id);

      case "CLEAR":
        return [];

      default:
        return state;
    }
  }

  export function CartProvider({ children }) {
    const [cart, dispatch] = useReducer(cartReducer, []);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
      <CartContext.Provider value={{ cart, dispatch, total }}>
        {children}
      </CartContext.Provider>
    );
  }

  export function useCart() {
    return useContext(CartContext);
  }

  // Usage — clean dispatch calls from anywhere:
  function ProductCard({ product }) {
    const { dispatch } = useCart();
    return (
      <button onClick={() => dispatch({ type: "ADD_ITEM", item: product })}>
        Add to Cart
      </button>
    );
  }
  ```

---

## 6. Zustand — Global State Without Boilerplate

Zustand is a tiny (1KB) state management library that is much simpler than Redux
and avoids Context's re-render problems.

Install:
```bash
npm install zustand
```

- **Create a store with `create()` — a function that defines state and actions** —
  No provider needed. Any component can import and use the store directly.

  ```js
  // store/useCartStore.js
  import { create } from 'zustand';

  const useCartStore = create((set, get) => ({
    // State:
    items: [],
    total: 0,

    // Actions (functions that call set() to update state):
    addItem: (item) => set((state) => {
      const existing = state.items.find(i => i.id === item.id);
      const newItems = existing
        ? state.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...state.items, { ...item, qty: 1 }];
      return {
        items: newItems,
        total: newItems.reduce((sum, i) => sum + i.price * i.qty, 0)
      };
    }),

    removeItem: (id) => set((state) => {
      const newItems = state.items.filter(i => i.id !== id);
      return { items: newItems, total: newItems.reduce((sum, i) => sum + i.price * i.qty, 0) };
    }),

    clear: () => set({ items: [], total: 0 }),
  }));

  export default useCartStore;
  ```

  ```jsx
  // Use in ANY component — no provider needed
  import useCartStore from '../store/useCartStore';

  function CartBadge() {
    const items = useCartStore(state => state.items); // subscribe to only items
    return <span className="badge">{items.length}</span>;
  }

  function ProductCard({ product }) {
    const addItem = useCartStore(state => state.addItem);
    return (
      <button onClick={() => addItem(product)}>Add to Cart</button>
    );
  }
  ```

- **Zustand only re-renders the components that use the specific slice of state
  they subscribed to** — `CartBadge` subscribes to `items` only. Changing `total`
  does NOT re-render `CartBadge`. This selective subscription is why Zustand
  performs better than naive Context.

  ```jsx
  // These two components subscribe to different slices — only re-render when their slice changes:
  const items = useCartStore(state => state.items);  // re-renders on items change
  const total = useCartStore(state => state.total);  // re-renders on total change
  ```

- **Zustand DevTools — see state in Redux DevTools** — Add the `devtools` middleware
  to debug your store visually.

  ```js
  import { create } from 'zustand';
  import { devtools } from 'zustand/middleware';

  const useCartStore = create(devtools((set) => ({
    items: [],
    addItem: (item) => set(state => ({ items: [...state.items, item] }), false, "addItem"),
  })));
  ```

---

## 7. Context vs Zustand — When to Use Which

| Scenario | Use |
|----------|-----|
| Theme (dark/light) | Context — rarely changes, simple value |
| Auth user data | Context — set on login, rarely updated |
| Shopping cart | Zustand — frequent updates, many consumers |
| Complex server state (pagination, caching) | React Query (Week 8) |
| Form state | useState or useReducer (local) |
| Global filters/sorting | Zustand or URL query params |

- **Context is built-in, no dependency** — Best for simple, rarely-changing global
  data (theme, locale, auth user). Easy to reason about.

- **Zustand is simpler than Redux, solves Context's re-render problem** — Best for
  any state that: is accessed by many components, changes frequently, or needs to
  be updated from anywhere in the tree.

---

## 8. Exercises

1. **Theme context** — Build a `ThemeProvider` with `useTheme()` hook. Toggle
   between dark/light. Apply the theme to the entire app via a CSS class on `<body>`.
   The theme preference should persist in `localStorage`.

2. **Auth context** — Build `AuthProvider` with `useAuth()` hook containing `user`,
   `login(credentials)`, and `logout()`. Connect it to the protected routes from Week 6.

3. **Cart with Context + useReducer** — Implement the full `CartContext` from
   Section 5. Add: Add, Remove, Update Quantity, and Clear actions. Show cart count
   in the Navbar. Show cart total in the cart page.

4. **Cart with Zustand** — Reimplement the same cart using Zustand instead of
   Context. Compare the amount of code and re-render behavior using React DevTools Profiler.

5. **Performance comparison** — Build a component tree where a deeply nested component
   reads from Context. Log renders with `console.log`. Then move to Zustand and compare.

---

## 9. Milestone Project

### Theme + Auth Context Provider

Build a full provider setup for a realistic app:

1. **ThemeProvider** — dark/light theme toggle. CSS variables change based on theme.
   Persisted in `localStorage`.
2. **AuthProvider** — fake login/logout (`POST /api/login` returns mock user).
   User info stored in Context.
3. **CartProvider (Zustand)** — add, remove, update quantity, cart total.
4. **Navbar** — shows: theme toggle, user avatar (from Auth context), cart count badge (from Zustand).
5. **Product listing page** — add to cart works, count updates instantly in Navbar.
6. **Cart page** — full cart with quantity controls and checkout button.
7. **Protected `/checkout`** — redirects to login if not authenticated.

---

## 10. Sources

| Resource | What to Search |
|----------|---------------|
| react.dev | `"Passing Data Deeply with Context"`, `"Scaling Up with Reducer and Context"` |
| zustand docs | https://zustand-demo.pmnd.rs |
| YouTube | `"Codevolution — Zustand Tutorial"`, `"Web Dev Simplified — React Context"` |