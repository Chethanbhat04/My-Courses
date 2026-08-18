# Week 5 — Advanced Hooks & Custom Hooks

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand useRef, useReducer, useMemo,
> useCallback, how to build your own reusable hooks, and the rules that all
> hooks must follow — the tools that separate junior React developers from
> senior ones.**

---

## Table of Contents

1. [useRef — Access Without Re-renders](#1-useref--access-without-re-renders)
2. [useReducer — Complex State Machines](#2-usereducer--complex-state-machines)
3. [useMemo — Expensive Computations](#3-usememo--expensive-computations)
4. [useCallback — Stable Function References](#4-usecallback--stable-function-references)
5. [Custom Hooks — Reusable Stateful Logic](#5-custom-hooks--reusable-stateful-logic)
6. [Rules of Hooks](#6-rules-of-hooks)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. useRef — Access Without Re-renders

- **`useRef` returns a mutable object `{ current: value }` that persists across
  renders but does NOT trigger a re-render when changed** — This is the key
  difference from `useState`. Use refs when you need to store something that should
  persist across renders but whose change should not cause the UI to update.

  ```jsx
  import { useRef } from 'react';

  function Stopwatch() {
    const [time, setTime] = useState(0);
    const intervalRef = useRef(null); // stores the interval ID — changing it won't re-render

    function start() {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }

    function stop() {
      clearInterval(intervalRef.current); // read the stored interval ID
    }

    return (
      <div>
        <p>Time: {time}s</p>
        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
      </div>
    );
  }
  ```

  If you used `useState` to store the interval ID, calling `setIntervalId(id)`
  would trigger an unnecessary re-render. `useRef` avoids this.

- **`useRef` is the React way to access a real DOM node** — Attach a ref to a
  JSX element with the `ref` attribute. After render, `ref.current` points to the
  actual DOM element. Use this for: focus management, measuring element dimensions,
  integrating third-party DOM libraries.

  ```jsx
  function AutoFocusInput() {
    const inputRef = useRef(null);

    useEffect(() => {
      inputRef.current.focus(); // directly call DOM API on the real input element
    }, []);

    return <input ref={inputRef} type="text" placeholder="I auto-focus!" />;
  }
  ```

- **`useRef` stores the previous value of a prop or state** — This pattern is
  useful when you need to compare current vs previous.

  ```jsx
  function PreviousValue({ count }) {
    const prevCountRef = useRef(null);

    useEffect(() => {
      prevCountRef.current = count; // save current count after render
    });

    const prevCount = prevCountRef.current; // still the OLD value during this render

    return (
      <p>
        Now: {count} | Before: {prevCount ?? "—"}
      </p>
    );
  }
  ```

---

## 2. useReducer — Complex State Machines

- **`useReducer` is an alternative to `useState` for complex state that involves
  multiple sub-values or where the next state depends on the current state** —
  Instead of multiple `useState` calls that must be updated together, you describe
  all state transitions as "actions" and a single "reducer" function handles them.

  ```
  useState is good for:   one value, simple updates
  useReducer is good for: multiple related values, complex transitions, many event types
  ```

  ```jsx
  import { useReducer } from 'react';

  // 1. Define the initial state:
  const initialState = { count: 0, step: 1 };

  // 2. Define the reducer — a pure function: (state, action) => newState
  function reducer(state, action) {
    switch (action.type) {
      case "increment":
        return { ...state, count: state.count + state.step };
      case "decrement":
        return { ...state, count: state.count - state.step };
      case "setStep":
        return { ...state, step: action.payload };
      case "reset":
        return initialState;
      default:
        throw new Error(`Unknown action: ${action.type}`);
    }
  }

  // 3. Use it in the component:
  function Counter() {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
      <div>
        <p>Count: {state.count} (step: {state.step})</p>
        <button onClick={() => dispatch({ type: "increment" })}>+</button>
        <button onClick={() => dispatch({ type: "decrement" })}>-</button>
        <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
        <input
          type="number"
          value={state.step}
          onChange={e => dispatch({ type: "setStep", payload: Number(e.target.value) })}
        />
      </div>
    );
  }
  ```

- **The reducer must be a pure function — no side effects, no mutation** — Given
  the same state and action, it must always return the same new state. Never call
  APIs, set timers, or mutate the state object inside a reducer.

  ```js
  // ❌ Wrong — mutates state directly
  function reducer(state, action) {
    if (action.type === "addItem") {
      state.items.push(action.item); // mutation!
      return state; // same reference — React won't re-render
    }
  }

  // ✅ Correct — returns new state
  function reducer(state, action) {
    if (action.type === "addItem") {
      return { ...state, items: [...state.items, action.item] }; // new objects
    }
  }
  ```

- **`useReducer` + Context is the lightweight alternative to Redux** — By
  combining a reducer (in Week 7's Context lesson) you can have global state
  management without any third-party library.

---

## 3. useMemo — Expensive Computations

- **`useMemo` caches the result of an expensive computation and only re-runs it
  when its dependencies change** — Every time a component re-renders, all code in
  the function body runs again. If you have a slow calculation (sorting 10,000 items,
  building a lookup table), `useMemo` ensures it only re-runs when necessary.

  ```jsx
  import { useMemo } from 'react';

  function ProductList({ products, sortBy, filterText }) {
    // This runs on EVERY render (slow if products is large):
    const filtered = products
      .filter(p => p.name.includes(filterText))
      .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);

    // With useMemo — only re-runs when products, sortBy, or filterText changes:
    const filteredAndSorted = useMemo(() => {
      return products
        .filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()))
        .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
    }, [products, sortBy, filterText]); // dependencies

    return (
      <ul>
        {filteredAndSorted.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>
    );
  }
  ```

- **Do NOT use `useMemo` everywhere — it has overhead** — Memoization costs memory
  and comparison time. Only use it when:
  - The computation is measurably slow (benchmark it)
  - The component re-renders very frequently
  - The computation's dependencies change infrequently

  ```jsx
  // ❌ Pointless useMemo — simple addition is not expensive
  const total = useMemo(() => price + tax, [price, tax]);

  // ✅ Better — just compute it directly
  const total = price + tax;
  ```

---

## 4. useCallback — Stable Function References

- **`useCallback` returns a memoized version of a function that only changes when
  its dependencies change** — In JavaScript, every time a component re-renders,
  every function defined in the component body is re-created as a new object.
  This matters when you pass functions to child components or use them as
  `useEffect` dependencies — a new function reference triggers unnecessary effects
  and re-renders.

  ```jsx
  import { useCallback } from 'react';

  function Parent() {
    const [count, setCount] = useState(0);

    // Without useCallback: new function object on every Parent re-render
    const handleClick = () => console.log("clicked");

    // With useCallback: same function reference unless deps change
    const handleClick = useCallback(() => {
      console.log("clicked");
    }, []); // no deps → created once and reused

    return (
      <>
        <button onClick={() => setCount(c => c + 1)}>Increment</button>
        <MemoizedChild onClick={handleClick} /> {/* won't re-render unnecessarily */}
      </>
    );
  }
  ```

- **`useCallback` only makes sense in combination with `React.memo`** — If the
  child component is NOT memoized, it re-renders on every parent render regardless
  of whether the function reference changed. The pair works together.

  ```jsx
  // Memoize the child component:
  const MemoizedChild = React.memo(function Child({ onClick }) {
    console.log("Child rendered"); // only logs when onClick reference changes
    return <button onClick={onClick}>Click me</button>;
  });

  // Now useCallback in the parent prevents unnecessary re-renders of Child.
  ```

- **`useCallback(fn, deps)` is essentially `useMemo(() => fn, deps)`** — They are
  the same mechanism; `useCallback` is just a convenience shorthand for functions.

  ```js
  useCallback(fn, deps) === useMemo(() => fn, deps) // conceptually identical
  ```

---

## 5. Custom Hooks — Reusable Stateful Logic

- **A custom hook is a JavaScript function whose name starts with `use` that
  calls other hooks** — It is NOT a special React feature — it is just a
  convention. Custom hooks let you extract and reuse stateful logic across
  multiple components.

  ```jsx
  // Without a custom hook — duplicated logic in every component:
  function ComponentA() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
      const handler = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, []);
    return <p>Width in A: {width}</p>;
  }

  function ComponentB() {
    // Exact same logic repeated...
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => { /* ... same code ... */ }, []);
    return <p>Width in B: {width}</p>;
  }
  ```

  ```jsx
  // ✅ With a custom hook — logic extracted and reused:
  function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
      const handler = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, []);

    return width; // expose what consumers need
  }

  function ComponentA() {
    const width = useWindowWidth(); // one line — logic is hidden
    return <p>Width in A: {width}</p>;
  }

  function ComponentB() {
    const width = useWindowWidth(); // reused — both instances are independent
    return <p>Width in B: {width}</p>;
  }
  ```

- **Each call to a custom hook creates an independent state instance** — Two
  components calling `useWindowWidth()` each get their own width state. They
  do not share state; they share logic.

- **A `useFetch` custom hook — the most common real-world pattern** — Encapsulates
  loading, error, and data state for any URL.

  ```jsx
  function useFetch(url) {
    const [data, setData]         = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]       = useState(null);

    useEffect(() => {
      const controller = new AbortController();
      setIsLoading(true);
      setError(null);

      fetch(url, { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          setData(data);
          setIsLoading(false);
        })
        .catch(err => {
          if (err.name !== "AbortError") {
            setError(err.message);
            setIsLoading(false);
          }
        });

      return () => controller.abort();
    }, [url]);

    return { data, isLoading, error };
  }

  // Usage — clean and declarative:
  function UserProfile({ userId }) {
    const { data: user, isLoading, error } = useFetch(
      `https://api.github.com/users/${userId}`
    );

    if (isLoading) return <Spinner />;
    if (error)     return <ErrorMessage text={error} />;
    return <h2>{user.name}</h2>;
  }
  ```

- **A `useLocalStorage` custom hook — persisting state across page refreshes** —
  Drops in as a replacement for `useState` but reads/writes from `localStorage`.

  ```jsx
  function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    });

    function setValue(value) {
      const newValue = value instanceof Function ? value(storedValue) : value;
      setStoredValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    }

    return [storedValue, setValue]; // same API as useState
  }

  // Usage — drop-in useState replacement with persistence:
  function Settings() {
    const [theme, setTheme] = useLocalStorage("theme", "dark");
    return (
      <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
        Switch to {theme === "dark" ? "light" : "dark"} mode
      </button>
    );
  }
  ```

---

## 6. Rules of Hooks

These are not suggestions — breaking them causes bugs that are very hard to debug.

- **Only call hooks at the top level of a component or custom hook** — Never call
  hooks inside loops, conditionals, or nested functions. React relies on the order
  of hook calls to associate state with the right hook. If the order changes between
  renders, React reads the wrong state for the wrong hook.

  ```jsx
  // ❌ Hook inside a conditional — order changes if isAdmin changes
  function Dashboard({ isAdmin }) {
    if (isAdmin) {
      const [reports, setReports] = useState([]); // breaks the order!
    }
    const [user, setUser] = useState(null);
  }

  // ✅ Correct — hook always at the top level, condition is inside
  function Dashboard({ isAdmin }) {
    const [reports, setReports] = useState([]);
    const [user, setUser]       = useState(null);

    // Use the condition inside the hook or effect, not around it
    useEffect(() => {
      if (isAdmin) fetchReports().then(setReports);
    }, [isAdmin]);
  }
  ```

- **Only call hooks from React function components or custom hooks** — Never
  call hooks from regular JavaScript functions, class components, or event handlers.

  ```js
  // ❌ Wrong — useState in a plain function
  function formatUser(user) {
    const [formatted, setFormatted] = useState(user.name); // invalid!
  }

  // ✅ Correct — hooks only inside components or custom hooks
  function useFormattedUser(user) { // starts with "use" → it's a custom hook
    const [formatted] = useState(user.name);
    return formatted;
  }
  ```

---

## 7. Exercises

1. **useRef** — Build a `VideoPlayer` component with Play/Pause and Mute/Unmute
   buttons that control an `<video>` element using a ref (`.play()`, `.pause()`,
   `.muted`). No state needed for this — only refs.

2. **useReducer** — Rewrite the Todo App from Week 3 using `useReducer`. Actions:
   `ADD_TODO`, `TOGGLE_TODO`, `DELETE_TODO`, `SET_FILTER`, `CLEAR_COMPLETED`.

3. **useMemo** — Build a list of 10,000 items. Add a filter input. Without `useMemo`,
   measure the lag with React DevTools Profiler. Then add `useMemo` and measure again.

4. **Custom hook** — Build `useDebounce(value, delay)` that returns a debounced
   version of a value. Use it in a search input that only triggers a fetch after
   the user stops typing for 300ms.

5. **Custom hook** — Build `useToggle(initialValue)` that returns `[value, toggle]`
   where `toggle` flips the boolean. Use it to control a modal's open/close state.

---

## 8. Milestone Project

### useLocalStorage Hook + Stopwatch

Build two small apps that demonstrate custom hooks:

**App 1: Persistent Preferences**
- Build a settings panel with: theme (dark/light), font size (small/medium/large),
  language (en/hi/kn).
- Use `useLocalStorage` for each setting — they persist after page refresh.
- Show a live preview of the settings applied to a sample card component.

**App 2: Stopwatch with useReducer**
- State: `{ status: "idle" | "running" | "paused", elapsed: number, laps: number[] }`
- Actions: START, PAUSE, RESUME, RESET, LAP
- Display elapsed time as MM:SS.ms
- Show list of lap times
- Interval runs via useEffect, stored via useRef

---

## 9. Sources

| Resource | What to Search |
|----------|---------------|
| react.dev | `"Referencing Values with Refs"`, `"Extracting State Logic into a Reducer"`, `"Reusing Logic with Custom Hooks"` |
| YouTube | `"Web Dev Simplified — useMemo and useCallback"`, `"Jack Herrington — Custom React Hooks"` |
| MDN | `"AbortController"` |