# Week 4 — useEffect, Data Fetching & Side Effects

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand what a "side effect" is in React's
> model, how useEffect executes, why the dependency array is the most misunderstood
> part of React, and how to safely fetch real data from an API without memory leaks
> or race conditions.**

---

## Table of Contents

1. [What is a Side Effect?](#1-what-is-a-side-effect)
2. [useEffect — The Full Mental Model](#2-useeffect--the-full-mental-model)
3. [The Dependency Array — Every Scenario](#3-the-dependency-array--every-scenario)
4. [Data Fetching with useEffect](#4-data-fetching-with-useeffect)
5. [Cleanup Functions — Preventing Memory Leaks](#5-cleanup-functions--preventing-memory-leaks)
6. [Race Conditions in Data Fetching](#6-race-conditions-in-data-fetching)
7. [Common useEffect Mistakes](#7-common-useeffect-mistakes)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. What is a Side Effect?

- **A side effect is anything a component does that reaches outside of itself** —
  React components are designed to be "pure" — given the same props and state,
  they return the same JSX. Anything that breaks this purity (network calls, timers,
  DOM manipulation, subscriptions) is a side effect.

  ```
  Pure (no side effects):
    props/state → renders JSX → done

  Side effects:
    - Fetching data from an API
    - Setting up a WebSocket connection
    - Writing to localStorage
    - Starting a timer with setInterval
    - Directly modifying a DOM node (outside React)
    - Subscribing to an event source
  ```

  Side effects cannot go in the render function itself — the render must be
  pure and fast. `useEffect` is the designated place to run side effects.

---

## 2. useEffect — The Full Mental Model

- **`useEffect(fn, deps)` runs your function AFTER the component renders to the DOM** —
  React first renders, paints the screen, then runs the effect. This ensures the
  effect never blocks the initial paint.

  ```
  Component renders → React updates DOM → Browser paints screen → useEffect runs
  ```

  ```jsx
  import { useState, useEffect } from 'react';

  function PageTitleUpdater({ title }) {
    useEffect(() => {
      document.title = `${title} | My App`; // runs after every render
    });

    return <h1>{title}</h1>;
  }
  ```

- **The function you pass to useEffect can optionally return a cleanup function** —
  The cleanup runs before the next effect execution AND before the component unmounts.
  This is how you cancel subscriptions, clear timers, and abort requests.

  ```jsx
  useEffect(() => {
    // Setup code runs after render
    const interval = setInterval(() => console.log("tick"), 1000);

    // Cleanup code runs before next effect or unmount
    return () => clearInterval(interval);
  }, []);
  ```

---

## 3. The Dependency Array — Every Scenario

The second argument to `useEffect` is the dependency array. It controls WHEN the
effect re-runs. This is the part most developers get wrong.

- **No dependency array → runs after EVERY render** — The effect re-runs any time
  any state or prop changes. Rarely what you want; can cause infinite loops.

  ```jsx
  useEffect(() => {
    console.log("Runs after every single render");
  }); // no [] — runs every time
  ```

- **Empty array `[]` → runs once, after the first render only** — This is the
  "componentDidMount" equivalent. Use this for initial data fetching, setting up
  subscriptions, or one-time DOM initialization.

  ```jsx
  useEffect(() => {
    fetchInitialData(); // only fetches once when the component first mounts
  }, []); // [] means "no dependencies" → never re-runs
  ```

- **Array with values `[a, b]` → runs when any listed dependency changes** —
  React compares each dependency to its previous value using `Object.is`. If any
  changed, the effect re-runs.

  ```jsx
  function UserProfile({ userId }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
      fetchUser(userId).then(setUser); // re-fetches whenever userId changes
    }, [userId]); // effect depends on userId

    return user ? <p>{user.name}</p> : <p>Loading...</p>;
  }

  // If parent renders <UserProfile userId={1} /> then <UserProfile userId={2} />,
  // the effect fires again because userId changed from 1 to 2.
  ```

- **Every value used inside the effect must be listed as a dependency** — This is
  the "exhaustive deps" rule (enforced by the `eslint-plugin-react-hooks` linter).
  Omitting a dependency creates a stale closure bug.

  ```jsx
  function SearchResults({ query, page }) {
    const [results, setResults] = useState([]);

    // ❌ Bug: page is used inside but not listed — stale closure
    useEffect(() => {
      fetchResults(query, page).then(setResults);
    }, [query]); // page changes go unnoticed!

    // ✅ Correct: all used values listed
    useEffect(() => {
      fetchResults(query, page).then(setResults);
    }, [query, page]); // re-fetches when either changes
  }
  ```

---

## 4. Data Fetching with useEffect

The most common use case for `useEffect` is loading data when a component mounts
or when a prop (like a user ID) changes.

- **The standard data fetching pattern: fetch on mount, store in state** — Combine
  `useEffect`, `useState` for data, loading state, and error state.

  ```jsx
  function GitHubProfile({ username }) {
    const [user, setUser]       = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
      setIsLoading(true);
      setError(null);

      fetch(`https://api.github.com/users/${username}`)
        .then(res => {
          if (!res.ok) throw new Error(`User not found (${res.status})`);
          return res.json();
        })
        .then(data => {
          setUser(data);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setIsLoading(false);
        });
    }, [username]); // re-fetches when username prop changes

    if (isLoading) return <p>Loading...</p>;
    if (error)     return <p className="error">Error: {error}</p>;
    if (!user)     return null;

    return (
      <div>
        <img src={user.avatar_url} alt={user.login} width={80} />
        <h2>{user.name}</h2>
        <p>{user.bio}</p>
        <p>Public Repos: {user.public_repos}</p>
      </div>
    );
  }
  ```

- **You cannot use `async` directly in the useEffect callback** — `useEffect` is
  not async. If you `async`-ify the callback, it returns a Promise — and React
  expects either `undefined` or a cleanup function. Wrap async logic in an inner
  function.

  ```jsx
  // ❌ Wrong — async useEffect callback returns a Promise, not a cleanup function
  useEffect(async () => {
    const data = await fetchUser(username);
    setUser(data);
  }, [username]);

  // ✅ Correct — define async function inside, then call it
  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchUser(username);
        setUser(data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadUser(); // call the async function, don't await it
  }, [username]);
  ```

---

## 5. Cleanup Functions — Preventing Memory Leaks

- **A cleanup function prevents state updates on unmounted components** — If a
  component unmounts while a fetch is in-flight, the fetch completes and tries to
  call `setState` on a component that no longer exists. React warns about this
  and it can cause bugs.

  ```jsx
  useEffect(() => {
    let isCancelled = false; // flag to track if we should ignore the result

    async function loadData() {
      try {
        const data = await fetchUser(username);
        if (!isCancelled) setUser(data); // only update if still mounted
      } catch (err) {
        if (!isCancelled) setError(err.message);
      }
    }

    loadData();

    return () => {
      isCancelled = true; // cleanup: tell loadData to ignore its result
    };
  }, [username]);
  ```

- **The modern way: use AbortController** — The Fetch API supports aborting
  in-flight requests. This is cleaner than the `isCancelled` flag because it
  actually cancels the network request.

  ```jsx
  useEffect(() => {
    const controller = new AbortController(); // native browser API

    async function loadUser() {
      try {
        const res = await fetch(
          `https://api.github.com/users/${username}`,
          { signal: controller.signal } // link fetch to the abort controller
        );
        const data = await res.json();
        setUser(data);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
        // AbortError is expected — ignore it
      }
    }

    loadUser();

    return () => controller.abort(); // cleanup: cancel the request on unmount
  }, [username]);
  ```

- **Cleanup timers to prevent memory leaks** — If a component with a `setInterval`
  unmounts without cleanup, the interval keeps running and trying to update unmounted state.

  ```jsx
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // critical: clean up on unmount
  }, []);
  ```

---

## 6. Race Conditions in Data Fetching

- **A race condition happens when two overlapping async operations finish in the
  wrong order** — If a user types "react" then "reactjs", you fire two fetches.
  If the first ("react") completes AFTER the second ("reactjs"), the UI shows
  stale results for "react" even though the user wants "reactjs".

  ```
  User types "react"   → fetch A starts
  User types "reactjs" → fetch B starts
  fetch B finishes     → UI shows "reactjs" results ✅
  fetch A finishes     → UI shows "react" results ❌ (stale — wrong!)
  ```

  Fix with AbortController — cancels the previous fetch when the effect re-runs:

  ```jsx
  useEffect(() => {
    const controller = new AbortController();

    async function search() {
      try {
        const res = await fetch(`/api/search?q=${query}`, {
          signal: controller.signal
        });
        const data = await res.json();
        setResults(data); // only reached if not aborted
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      }
    }

    if (query) search();

    return () => controller.abort();
    // When query changes, React runs cleanup (abort old fetch) then runs new effect
  }, [query]);
  ```

---

## 7. Common useEffect Mistakes

- **Infinite loop: updating state that is also a dependency** — If you put state
  in the dependency array AND update it inside the effect, the effect runs → state
  changes → effect runs again → infinite loop.

  ```jsx
  // ❌ Infinite loop!
  const [data, setData] = useState([]);
  useEffect(() => {
    setData([...data, "new item"]); // updates data...
  }, [data]); // ...which triggers the effect again!

  // ✅ Fix: think about what should actually trigger the effect
  useEffect(() => {
    fetchInitialData().then(setData);
  }, []); // run once — don't depend on data
  ```

- **Forgetting to clean up event listeners** — Adding a listener without removing
  it on cleanup stacks up duplicate listeners across re-renders.

  ```jsx
  // ❌ Adds a new listener every render, never removes old ones
  useEffect(() => {
    window.addEventListener("resize", handleResize);
  }, []); // even with [], React can remount — cleanup is needed

  // ✅ Correct
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  ```

---

## 8. Exercises

1. **Mount effect** — Build a `Clock` component that shows the current time
   (HH:MM:SS) updated every second. Make sure the interval is cleaned up when
   the component unmounts.

2. **Dependency array** — Build a `PostViewer` that takes a `postId` prop and
   fetches from `https://jsonplaceholder.typicode.com/posts/${postId}` whenever
   the id changes. Add previous/next buttons to the parent to change the id.

3. **Loading + error state** — Wrap the fetch in the PostViewer with full loading
   spinner and error message states. Simulate an error by passing `postId=999`.

4. **AbortController** — Build a search box that fetches results from
   `https://jsonplaceholder.typicode.com/posts?userId=${query}` as the user types.
   Add 300ms debounce and AbortController to cancel in-flight requests.

5. **Race condition demo** — (Educational) Remove the AbortController from exercise 4,
   add artificial delay with `setTimeout`, and demonstrate the race condition
   by typing quickly. Then add back AbortController and show it is fixed.

---

## 9. Milestone Project

### GitHub User Explorer

Build a React app that:

1. Has a search input where the user types a GitHub username.
2. On search (button click or Enter key), fetches `https://api.github.com/users/{username}`
   and `https://api.github.com/users/{username}/repos?sort=stars&per_page=6`.
3. Shows the user's avatar, name, bio, followers, and following count.
4. Shows a grid of their top 6 repos (name, description, stars, language).
5. Handles: loading state (skeleton cards), error state (user not found), empty state.
6. Cancels in-flight requests if the user searches again before the previous
   request completes.
7. Shows a search history (last 5 searches) below the search bar (stored in state).

---

## 10. Sources

| Resource | What to Search |
|----------|---------------|
| react.dev | `"Synchronizing with Effects"`, `"You Might Not Need an Effect"`, `"Lifecycle of Reactive Effects"` |
| MDN | `"AbortController"`, `"Fetch API"` |
| YouTube | `"Web Dev Simplified — useEffect Hook"`, `"Theo — Stop Using useEffect Wrong"` |