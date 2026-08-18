# Week 9 — Fetch, Web APIs, and Real-World Async Patterns

# The Complete Deep-Dive Lesson

> **This week connects everything you've learned to the real world — HTTP
> requests, browser storage, Web Workers, and performance patterns like debounce,
> throttle, and lazy loading. These are the APIs you'll use every day.**

---

## Table of Contents

1. [The Fetch API — Complete Guide](#1-the-fetch-api--complete-guide)
2. [AbortController — Canceling Requests](#2-abortcontroller--canceling-requests)
3. [Client-Side Storage](#3-client-side-storage)
4. [Web Workers — Off-Thread Processing](#4-web-workers--off-thread-processing)
5. [IntersectionObserver — Lazy Loading and Infinite Scroll](#5-intersectionobserver--lazy-loading-and-infinite-scroll)
6. [Debounce and Throttle — Complete Implementations](#6-debounce-and-throttle--complete-implementations)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. The Fetch API — Complete Guide

**Practical Mental Model (The Two-Phase Network Request):**
When you request a large file or data payload from a server across the globe, it doesn't arrive instantly as one solid block. It arrives in a stream of network packets over time.

Because of this, `fetch()` completes its job in two distinct phases:
1. **Phase 1 (The Headers):** The server's initial response arrives. This contains the HTTP status code (like 200 OK or 404 Not Found) and metadata, but the actual data payload is still streaming in over the wire. This is when the first Promise resolves.
2. **Phase 2 (The Body):** You must explicitly tell JavaScript how to parse that incoming stream of data (usually as JSON). This process takes time and returns a second Promise that resolves only when the entire data payload has finished downloading and parsing.

This two-phase architecture is exactly why you always need **two `await`s** when working with `fetch`:

### Basic GET Request

```js
// First await: wait for headers + status
const response = await fetch("https://jsonplaceholder.typicode.com/users/1");

// Second await: wait for the body to fully stream and parse as JSON
const user = await response.json();

console.log(user.name); // "Leanne Graham"
```

### CRITICAL: fetch Does NOT Reject on HTTP Errors

This catches many developers off guard:

```js
// ❌ This won't catch a 404
try {
  const res = await fetch("/api/user/99999");
  const data = await res.json(); // might fail if body isn't JSON
} catch (e) {
  // This only runs for NETWORK errors (offline, DNS failure, CORS)
  // A 404 or 500 response does NOT trigger this catch
}

// ✅ Correct: check response.ok
const res = await fetch("/api/user/99999");
if (!res.ok) {
  throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}
const data = await res.json();
```

### A Reusable Fetch Wrapper

```js
async function api(url, options = {}) {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage:
const user = await api("/api/users/1");
const newUser = await api("/api/users", {
  method: "POST",
  body: JSON.stringify({ name: "Alice", email: "alice@example.com" }),
});
```

### POST, PUT, PATCH, DELETE

```js
// POST — create
await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alice" }),
});

// PUT — full update
await fetch("/api/users/1", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alice", age: 26 }),
});

// PATCH — partial update
await fetch("/api/users/1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ age: 26 }),
});

// DELETE
await fetch("/api/users/1", { method: "DELETE" });
```

> **Source:**
> - MDN — "Fetch API": https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
> - MDN — "Using Fetch": https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
> - JavaScript.info — "Fetch": https://javascript.info/fetch

---

## 2. AbortController — Canceling Requests

### Use Case: Canceling Outdated Search Results

When a user types in a search box, each keystroke might trigger a fetch. If the
user types "hello", you don't want the results from "h", "he", "hel", "hell"
to arrive and overwrite "hello"'s results. You need to **cancel** outdated
requests.

```js
let currentController = null;

async function search(query) {
  // Cancel any in-flight request
  if (currentController) {
    currentController.abort();
  }

  currentController = new AbortController();

  try {
    const response = await fetch(`/api/search?q=${query}`, {
      signal: currentController.signal,
    });
    const results = await response.json();
    renderResults(results);
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Request was cancelled — this is expected");
    } else {
      throw error; // re-throw real errors
    }
  }
}
```

### Timeout with AbortController

```js
async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### React Connection

In React's `useEffect`, you return a cleanup function. This is the same
pattern:

```js
// React useEffect (preview — you'll write this in React):
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => {
      if (err.name !== "AbortError") setError(err);
    });

  return () => controller.abort(); // cleanup on unmount or id change
}, [id]);
```

> **Source:**
> - MDN — "AbortController": https://developer.mozilla.org/en-US/docs/Web/API/AbortController
> - JavaScript.info — "Fetch: Abort": https://javascript.info/fetch-abort

---

## 3. Client-Side Storage

### localStorage — Persistent, Synchronous

```js
// Store data (always strings)
localStorage.setItem("theme", "dark");
localStorage.setItem("user", JSON.stringify({ name: "Alice", id: 1 }));

// Read data
const theme = localStorage.getItem("theme"); // "dark"
const user = JSON.parse(localStorage.getItem("user")); // { name: "Alice", id: 1 }

// Remove specific key
localStorage.removeItem("theme");

// Clear everything
localStorage.clear();
```

### localStorage with Expiry

localStorage doesn't natively support expiry. Here's a wrapper:

```js
const storage = {
  set(key, value, ttlMs = null) {
    const entry = {
      value,
      expiry: ttlMs ? Date.now() + ttlMs : null,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  },

  get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    if (entry.expiry && Date.now() > entry.expiry) {
      localStorage.removeItem(key);
      return null; // expired
    }
    return entry.value;
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};

storage.set("token", "abc123", 3600000); // expires in 1 hour
console.log(storage.get("token")); // "abc123" (or null if expired)
```

### sessionStorage vs localStorage

| Feature | localStorage | sessionStorage |
|---------|-------------|---------------|
| Persists | Forever (until cleared) | Until tab/window is closed |
| Shared between tabs | Yes | No (per tab) |
| Size limit | ~5-10 MB | ~5-10 MB |
| API | Identical | Identical |

> **Source:**
> - MDN — "Window.localStorage": https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
> - MDN — "Web Storage API": https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
> - JavaScript.info — "LocalStorage, sessionStorage": https://javascript.info/localstorage

---

## 4. Web Workers — Off-Thread Processing

### The Need for Web Workers

JavaScript is single-threaded. Heavy computation (sorting millions of records,
image processing, parsing CSV) blocks the main thread and freezes the UI.
Web Workers run JavaScript in a **separate thread**.

```js
// main.js
const worker = new Worker("worker.js");

worker.postMessage({ data: hugeArray, operation: "sort" });

worker.onmessage = (event) => {
  console.log("Sorted:", event.data);
};

worker.onerror = (error) => {
  console.error("Worker error:", error.message);
};
```

```js
// worker.js — runs in a separate thread
self.onmessage = (event) => {
  const { data, operation } = event.data;

  if (operation === "sort") {
    data.sort((a, b) => a - b); // heavy work — doesn't block UI
    self.postMessage(data);
  }
};
```

### Key Limitations

| Main Thread | Worker Thread |
|------------|--------------|
| DOM access ✅ | DOM access ❌ |
| window object ✅ | self object ✅ |
| UI rendering ✅ | No rendering ❌ |
| Can create workers ✅ | Can create sub-workers ✅ |

Data between threads is **copied** (structured clone), not shared. For shared
memory, use `SharedArrayBuffer`.

### Inline Workers (no separate file)

```js
const workerCode = `
  self.onmessage = (e) => {
    const result = e.data.map(n => n * 2);
    self.postMessage(result);
  };
`;

const blob = new Blob([workerCode], { type: "application/javascript" });
const worker = new Worker(URL.createObjectURL(blob));

worker.postMessage([1, 2, 3, 4, 5]);
worker.onmessage = (e) => console.log(e.data); // [2, 4, 6, 8, 10]
```

> **Source:**
> - MDN — "Web Workers API": https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
> - MDN — "Using Web Workers": https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
> - JavaScript.info — "Web Workers": (not covered in detail)

---

## 5. IntersectionObserver — Lazy Loading and Infinite Scroll

### What Is It?

`IntersectionObserver` efficiently detects when an element enters or exits the
viewport, without `scroll` event listeners.

### Lazy Loading Images

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;  // Load the real image
      img.classList.add("loaded");
      observer.unobserve(img);     // Stop watching once loaded
    }
  });
}, {
  rootMargin: "200px",  // Start loading 200px before visible
});

// Observe all lazy images
document.querySelectorAll("img[data-src]").forEach(img => {
  observer.observe(img);
});
```

```html
<img data-src="photo.jpg" src="placeholder.jpg" alt="Photo">
```

### Infinite Scroll

```js
const sentinel = document.querySelector("#load-more-trigger");

const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    const nextPage = await fetchNextPage();
    appendItems(nextPage);
  }
});

observer.observe(sentinel);
```

> **Source:**
> - MDN — "IntersectionObserver": https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
> - MDN — "Intersection Observer API": https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
> - web.dev — "Lazy loading images": https://web.dev/articles/lazy-loading-images

---

## 6. Debounce and Throttle — Complete Implementations

### Debounce — Wait Until User Stops

Only execute after the user has **stopped** triggering for a specified delay:

```js
function debounce(fn, delay) {
  let timeoutId;

  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Usage: search only after user stops typing for 300ms
const searchInput = document.querySelector("#search");
searchInput.addEventListener("input", debounce((e) => {
  console.log("Searching for:", e.target.value);
}, 300));
```

### Debounce with Leading Edge Option

```js
function debounce(fn, delay, { leading = false } = {}) {
  let timeoutId;
  let isLeadingInvoked = false;

  return function(...args) {
    if (leading && !isLeadingInvoked) {
      fn.apply(this, args);
      isLeadingInvoked = true;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (!leading) fn.apply(this, args);
      isLeadingInvoked = false;
    }, delay);
  };
}
```

### Throttle — Execute at Most Once Per Interval

```js
function throttle(fn, interval) {
  let lastCall = 0;
  let timeoutId;

  return function(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastCall);

    if (remaining <= 0) {
      clearTimeout(timeoutId);
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

// Usage: update position at most once per 100ms
window.addEventListener("scroll", throttle(() => {
  console.log("Scroll position:", window.scrollY);
}, 100));
```

### When to Use Which

| Scenario | Use |
|----------|-----|
| Search input (API calls) | Debounce (300ms) |
| Window resize handler | Debounce (200ms) |
| Scroll position tracking | Throttle (100ms) |
| Button click (prevent double-click) | Debounce (leading edge) or Throttle |
| Infinite scroll trigger | Throttle (200ms) |

> **Source:**
> - JavaScript.info — "Debounce": https://javascript.info/task/debounce
> - JavaScript.info — "Throttle": https://javascript.info/task/throttle
> - CSS-Tricks — "Debouncing and Throttling Explained": https://css-tricks.com/debouncing-throttling-explained-examples/

---

## 7. Exercises

```js
// E1. Build fetchWithRetry(url, options, maxRetries, delayMs)
// Retries with exponential backoff on failure

// E2. Build a localStorage cache for API responses
// cache.get(url) → returns cached data if not expired
// cache.set(url, data, ttlMs) → stores with expiry

// E3. Build a lazy-loading image component using IntersectionObserver

// E4. Use a Web Worker to sort an array of 1 million numbers
// Compare UI responsiveness vs doing it on the main thread

// E5. Implement a debounced search with AbortController
// Cancel previous request when user types a new character
```

---

## 8. Milestone Project

### Build: A GitHub Repository Explorer

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This is a full single-page app combining Weeks 7–9 concepts.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | DOM manipulation & event delegation | Week 7 ✅ |
> | `fetch()` API | Week 9 (this week) |
> | `async` / `await` | Week 8 ✅ |
> | `AbortController` | Week 9 (this week) |
> | `IntersectionObserver` | Week 9 (this week) |
> | `localStorage` | Week 9 (this week) |
> | Debounce / throttle | Week 9 (this week) |
>
> ✅ Complete all of Week 9 before starting this project.

A single-page app using all concepts from Weeks 7-9:

**Features:**
- Debounced search input calling GitHub's API (`https://api.github.com/search/repositories?q=...`)
- AbortController cancels in-flight requests on new input
- IntersectionObserver for infinite scroll pagination
- localStorage caching of recent searches
- Loading, error, and empty states
- Event delegation for result card interactions

See the Week 9 section in the roadmap for the full spec.

---

## 9. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Fetch API | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API |
| Using Fetch | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch |
| Fetch | JavaScript.info | https://javascript.info/fetch |
| AbortController | MDN | https://developer.mozilla.org/en-US/docs/Web/API/AbortController |
| Fetch: Abort | JavaScript.info | https://javascript.info/fetch-abort |
| localStorage | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage |
| Web Storage API | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API |
| LocalStorage | JavaScript.info | https://javascript.info/localstorage |
| Web Workers API | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API |
| Using Web Workers | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers |
| IntersectionObserver | MDN | https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver |
| Intersection Observer API | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API |
| Lazy loading images | web.dev | https://web.dev/articles/lazy-loading-images |
| Debounce task | JavaScript.info | https://javascript.info/task/debounce |
| Throttle task | JavaScript.info | https://javascript.info/task/throttle |
| Debounce/Throttle | CSS-Tricks | https://css-tricks.com/debouncing-throttling-explained-examples/ |
