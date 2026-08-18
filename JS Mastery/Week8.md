# Week 8 — Promises, Async/Await, and the Event Loop

# The Complete Deep-Dive Lesson

> **JavaScript is single-threaded but non-blocking. This apparent paradox is
> resolved by the Event Loop — the single most important concept for
> understanding async JavaScript, Node.js performance, and React rendering.**

---

## Table of Contents

1. [The Event Loop — How JavaScript Handles Async](#1-the-event-loop--how-javascript-handles-async)
2. [Microtasks vs Macrotasks](#2-microtasks-vs-macrotasks)
3. [Promises — States, Chaining, and Error Handling](#3-promises--states-chaining-and-error-handling)
4. [Building a Promise From Scratch](#4-building-a-promise-from-scratch)
5. [Promise Combinators — all, race, allSettled, any](#5-promise-combinators--all-race-allsettled-any)
6. [Async/Await — The Modern Way](#6-asyncawait--the-modern-way)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. The Event Loop — How JavaScript Handles Async

**Practical Mental Model (The Main Worker and Background APIs):**
JavaScript runs on a single thread. This means it can only do **one thing at a time**. Imagine JavaScript as a single worker managing a task queue.

If the worker has to wait 10 seconds for a network request to finish, and they just sit there doing nothing, the entire application freezes. No buttons can be clicked, no animations can run. This is called **blocking**.

To solve this, JavaScript uses the **Event Loop architecture**. Instead of waiting, the worker hands the slow network request off to the browser's background threads (Web APIs) and immediately moves on to the next task in their queue. When the background thread finishes the network request, it puts a message in a special queue saying "The data is ready, here is the callback." The Event Loop's job is to constantly check that queue and give the callback back to the single worker to execute when they are free.

### Single Thread, Non-Blocking

JavaScript runs on a single thread — it can only execute one piece of code at a time. A **blocking** operation (like a network request that takes 2 seconds) would freeze the entire page if JavaScript had to sit and wait for it to finish before running anything else.

Instead, slow operations like `fetch`, `setTimeout`, and file I/O are handed off to the **browser's Web APIs**, which run on separate OS threads. JavaScript registers a callback, then immediately moves on to the next line. When the Web API finishes, it places the callback into a queue. The Event Loop's job is to pick callbacks from those queues and push them onto the call stack when it's free.

Here is how that architecture maps to the browser:

```
┌──────────────────────────────────────────────────────┐
│                    CALL STACK                         │
│  (executes synchronous code, one frame at a time)    │
│  JavaScript can only run ONE thing at a time here.   │
└───────────────────────┬──────────────────────────────┘
                        │
                        │ When async operation starts
                        │ (setTimeout, fetch, etc.)
                        ▼
              ┌───────────────────┐
              │   WEB APIs /      │
              │   Node.js APIs    │ ← Timers, HTTP, DOM events
              │   (separate       │   run OUTSIDE the JS thread
              │    threads)       │
              └────────┬──────────┘
                       │
                       │ When operation completes,
                       │ callback is queued:
                       ▼
         ┌──────────────────────────────┐
         │  MICROTASK QUEUE             │ ← Promise.then/.catch/.finally
         │  (highest priority)          │   queueMicrotask()
         │  Drained completely before   │   MutationObserver
         │  ANY macrotask runs.         │
         └──────────────┬───────────────┘
                        │ Only when empty:
                        ▼
         ┌──────────────────────────────┐
         │  MACROTASK QUEUE             │ ← setTimeout, setInterval
         │  (lower priority)            │   I/O callbacks
         │  ONE macrotask per loop tick.│   UI rendering
         └──────────────────────────────┘
```

### The Event Loop Algorithm

```
1. Execute all synchronous code on the call stack.
2. Call stack empty? Check the MICROTASK queue.
   → Drain ALL microtasks (execute every one).
   → If a microtask schedules MORE microtasks, those run too.
3. Microtask queue empty? Execute ONE macrotask.
4. Go back to step 2.
5. (Between step 3 and 4, the browser may render a frame.)
```

### Example: Event Loop in Action

Let's look at a code snippet and predict the order before we see the output.

```js
console.log("1: Synchronous"); // Task A

setTimeout(() => {
  console.log("2: setTimeout (macrotask)"); // Task B
}, 0);

Promise.resolve().then(() => {
  console.log("3: Promise.then (microtask)"); // Task C
});

queueMicrotask(() => {
  console.log("4: queueMicrotask (microtask)"); // Task D
});

console.log("5: Synchronous"); // Task E
```

**Step-by-step Execution:**
1. **Synchronous Code First:** The Call Stack runs all synchronous code top to bottom. Task A (`"1"`) and Task E (`"5"`) execute immediately.
2. **Scheduling:**
   - Task B (`setTimeout`) is handed to the Web APIs. When its timer fires (0ms), its callback is placed in the **Macrotask Queue**.
   - Task C (`Promise.resolve().then`) and Task D (`queueMicrotask`) are placed directly in the **Microtask Queue**.
3. **Drain Microtasks:** Call Stack is now empty. The Event Loop drains the entire Microtask Queue before touching Macrotasks. Task C (`"3"`) runs, then Task D (`"4"`) runs.
4. **One Macrotask:** Microtask queue is empty. The Event Loop pulls one item from the Macrotask Queue. Task B (`"2"`) runs.

**Final Output:**
```
1: Synchronous
5: Synchronous
3: Promise.then (microtask)
4: queueMicrotask (microtask)
2: setTimeout (macrotask)
```

> **Source:**
> - MDN — "Event loop": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
> - Philip Roberts — "What the heck is the event loop anyway?" (JSConf 2014): https://www.youtube.com/watch?v=8aGhZQkoFbQ
> - Jake Archibald — "In the loop" (JSConf Asia 2018): https://www.youtube.com/watch?v=cCOL7MC4Pl0
> - JavaScript.info — "Event loop: microtasks and macrotasks": https://javascript.info/event-loop

---

## 2. Microtasks vs Macrotasks

### What Goes Where?

| Microtasks (high priority) | Macrotasks (lower priority) |
|---|---|
| `Promise.then/catch/finally` | `setTimeout` |
| `queueMicrotask()` | `setInterval` |
| `MutationObserver` | `requestAnimationFrame`* |
| `async/await` continuations | I/O callbacks (Node.js) |
| | DOM event callbacks |

*`requestAnimationFrame` runs before paint but after microtasks.

### Advanced Puzzle: Nested Microtasks and Macrotasks

```js
setTimeout(() => {
  console.log("T1");
  Promise.resolve().then(() => console.log("P1"));
}, 0);

setTimeout(() => {
  console.log("T2");
  Promise.resolve().then(() => console.log("P2"));
}, 0);

Promise.resolve().then(() => {
  console.log("P3");
  setTimeout(() => console.log("T3"), 0);
});
```

**Output:**
```
P3       ← microtask from initial code (runs before any setTimeout)
T1       ← first macrotask
P1       ← microtask created inside T1 (drains before next macrotask)
T2       ← second macrotask
P2       ← microtask created inside T2
T3       ← macrotask scheduled by P3 (last in queue)
```

### Microtask Starvation

If microtasks keep scheduling more microtasks, macrotasks (and rendering!) are
blocked:

```js
// ❌ This will FREEZE the browser
function blockForever() {
  Promise.resolve().then(blockForever);
}
blockForever();
// Microtask queue is never empty → macrotasks never run → browser hangs
```

> **Source:**
> - MDN — "Using microtasks": https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
> - JavaScript.info — "Event loop: microtasks and macrotasks": https://javascript.info/event-loop

---

## 3. Promises — States, Chaining, and Error Handling

### What is a Promise?

**Practical Mental Model (The Receipt for a Background Task):**
Imagine you drop your car off at the mechanic. They don't make you stand in the garage and wait (which would block you). Instead, they give you a **receipt** — a promise that they will eventually finish fixing the car. You can go home, watch TV, and do other things. Later, that receipt will either become a fixed car (fulfilled) or a phone call saying they couldn't fix it (rejected).

In JavaScript, a `Promise` is this receipt. It is an object that represents the **eventual result of an async operation**. When you call `new Promise(...)` or use `fetch()`, you get this object back immediately — but the actual result isn't ready yet. The Promise object lets you attach callbacks (`.then`, `.catch`) that act as your instructions for what to do when the mechanic is done.

A Promise is always in one of three states:

```
                  ┌─── fulfilled (operation succeeded, result is available)
                  │
pending ──────────┤ (operation is in progress)
                  │
                  └─── rejected (operation failed, error is available)

Once settled (fulfilled or rejected), a Promise NEVER changes state again.
```

### Creating Promises

You pass a function (the **executor**) to `new Promise(...)`. The executor receives two callbacks: `resolve` (call it when the work succeeds and pass the result) and `reject` (call it when the work fails and pass the error).

```js
const promise = new Promise((resolve, reject) => {
  // Simulate an async operation
  const success = true;

  if (success) {
    resolve("Data loaded!");  // transitions to fulfilled
  } else {
    reject(new Error("Failed to load"));  // transitions to rejected
  }
});

promise
  .then(data => console.log(data))    // runs when fulfilled
  .catch(err => console.error(err));  // runs when rejected
```

### Promise Chaining

`.then()` always returns a **new Promise**, enabling chaining:

```js
fetchUser(1)
  .then(user => {
    console.log("User:", user.name);
    return fetchPosts(user.id); // return a new Promise
  })
  .then(posts => {
    console.log("Posts:", posts.length);
    return posts[0]; // return a value (auto-wrapped in Promise)
  })
  .then(firstPost => {
    console.log("First post:", firstPost.title);
  })
  .catch(error => {
    // Catches error from ANY step above
    console.error("Error:", error.message);
  })
  .finally(() => {
    console.log("Done — runs regardless of success/failure");
  });
```

### Error Propagation

Errors flow down the chain until a `.catch()` handles them:

```js
Promise.resolve(1)
  .then(val => {
    throw new Error("Step 2 failed");
  })
  .then(val => {
    console.log("This never runs");
  })
  .then(val => {
    console.log("This never runs either");
  })
  .catch(err => {
    console.error(err.message); // "Step 2 failed"
    return "recovered"; // catch can return a value to continue the chain
  })
  .then(val => {
    console.log(val); // "recovered" — chain continues after catch
  });
```

### Common Mistakes

```js
// ❌ Nested promises (callback hell with promises)
fetchUser(1).then(user => {
  fetchPosts(user.id).then(posts => {
    fetchComments(posts[0].id).then(comments => {
      console.log(comments); // deeply nested!
    });
  });
});

// ✅ Flat chain (return promises from .then)
fetchUser(1)
  .then(user => fetchPosts(user.id))
  .then(posts => fetchComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(err => console.error(err));
```

> **Source:**
> - MDN — "Using Promises": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
> - MDN — "Promise": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
> - JavaScript.info — "Promise": https://javascript.info/promise-basics
> - JavaScript.info — "Promises chaining": https://javascript.info/promise-chaining

---

## 4. Building a Promise From Scratch

Understanding how Promise works internally:

```js
class MyPromise {
  #state = "pending";
  #value = undefined;
  #callbacks = [];

  constructor(executor) {
    const resolve = (value) => {
      if (this.#state !== "pending") return;
      this.#state = "fulfilled";
      this.#value = value;
      this.#callbacks.forEach(cb => cb.onFulfilled(value));
    };

    const reject = (reason) => {
      if (this.#state !== "pending") return;
      this.#state = "rejected";
      this.#value = reason;
      this.#callbacks.forEach(cb => cb.onRejected(reason));
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handle = (callback, fallback) => {
        return (value) => {
          try {
            if (typeof callback === "function") {
              const result = callback(value);
              if (result instanceof MyPromise) {
                result.then(resolve, reject);
              } else {
                resolve(result);
              }
            } else {
              fallback(value);
            }
          } catch (error) {
            reject(error);
          }
        };
      };

      if (this.#state === "fulfilled") {
        queueMicrotask(() => handle(onFulfilled, resolve)(this.#value));
      } else if (this.#state === "rejected") {
        queueMicrotask(() => handle(onRejected, reject)(this.#value));
      } else {
        this.#callbacks.push({
          onFulfilled: handle(onFulfilled, resolve),
          onRejected: handle(onRejected, reject),
        });
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      value => { onFinally(); return value; },
      reason => { onFinally(); throw reason; }
    );
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
}

// Test:
new MyPromise((resolve) => {
  setTimeout(() => resolve(42), 100);
})
  .then(val => {
    console.log("Got:", val); // "Got: 42"
    return val * 2;
  })
  .then(val => console.log("Doubled:", val)) // "Doubled: 84"
  .catch(err => console.error(err));
```

> **Source:**
> - Promises/A+ Specification: https://promisesaplus.com/
> - "Build a Promise from scratch" tutorial: https://www.youtube.com/watch?v=1l4wHWQCCIc

---

## 5. Promise Combinators — all, race, allSettled, any

### Promise.all — All must succeed

```js
const promises = [
  fetch("/api/users"),
  fetch("/api/posts"),
  fetch("/api/comments"),
];

const [users, posts, comments] = await Promise.all(promises);
// All three requests run in PARALLEL.
// Result is an array of responses IN ORDER.
// If ANY one fails → the whole Promise.all rejects.
```

### Promise.allSettled — Wait for all, regardless of success/failure

```js
const results = await Promise.allSettled([
  fetch("/api/fast"),
  fetch("/api/might-fail"),
  fetch("/api/slow"),
]);

results.forEach(result => {
  if (result.status === "fulfilled") {
    console.log("Success:", result.value);
  } else {
    console.log("Failed:", result.reason);
  }
});
// Never rejects — always resolves with an array of results
```

### Promise.race — First to settle wins

```js
const result = await Promise.race([
  fetch("/api/data"),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 5000)
  ),
]);
// If fetch finishes first → result is the response.
// If 5 seconds pass first → throws "Timeout" error.
```

### Promise.any — First to SUCCEED wins

```js
const fastest = await Promise.any([
  fetch("https://cdn1.example.com/data"),
  fetch("https://cdn2.example.com/data"),
  fetch("https://cdn3.example.com/data"),
]);
// Returns the first SUCCESSFUL response.
// Ignores rejections unless ALL fail.
// If ALL fail → AggregateError.
```

### Comparison Table

| Combinator | Resolves When | Rejects When |
|-----------|--------------|-------------|
| `Promise.all` | ALL fulfill | ANY rejects |
| `Promise.allSettled` | ALL settle (fulfilled or rejected) | Never |
| `Promise.race` | First settles (either way) | First settles with rejection |
| `Promise.any` | First fulfills | ALL reject |

> **Source:**
> - MDN — "Promise.all()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
> - MDN — "Promise.allSettled()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
> - MDN — "Promise.race()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
> - MDN — "Promise.any()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any
> - JavaScript.info — "Promise API": https://javascript.info/promise-api

---

## 6. Async/Await — The Modern Way

### How It Works

`async` functions always return a Promise. `await` pauses execution until a
Promise settles.

```js
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const user = await response.json();
  return user;
}

// Equivalent without async/await:
function fetchUserData(userId) {
  return fetch(`/api/users/${userId}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
}
```

### Error Handling with try/catch

```js
async function loadDashboard() {
  try {
    const [users, analytics] = await Promise.all([
      fetchUsers(),
      fetchAnalytics(),
    ]);
    renderDashboard(users, analytics);
  } catch (error) {
    if (error instanceof NetworkError) {
      showRetryButton();
    } else {
      showErrorMessage(error.message);
    }
  } finally {
    hideLoadingSpinner();
  }
}
```

### Sequential vs Parallel Execution

```js
// ❌ SEQUENTIAL — each await waits for the previous one
async function slow() {
  const users = await fetchUsers();     // wait 1 second
  const posts = await fetchPosts();     // wait 1 second
  const comments = await fetchComments(); // wait 1 second
  // Total: ~3 seconds
}

// ✅ PARALLEL — all requests start simultaneously
async function fast() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),      // starts immediately
    fetchPosts(),      // starts immediately
    fetchComments(),   // starts immediately
  ]);
  // Total: ~1 second (limited by the slowest)
}
```

### Async Iteration — for await...of

```js
async function* fetchPages(url) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();
    yield data.items;
    hasMore = data.hasNextPage;
    page++;
  }
}

// Consume async generator
for await (const items of fetchPages("/api/products")) {
  items.forEach(item => console.log(item.name));
}
```

### Top-Level Await (ES2022)

In ES Modules, you can use `await` at the top level:

```js
// config.js (ES Module)
const response = await fetch("/api/config");
export const config = await response.json();

// main.js
import { config } from "./config.js";
// `config` is already loaded by the time this line runs
```

> **Source:**
> - MDN — "async function": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
> - MDN — "await": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
> - JavaScript.info — "Async/await": https://javascript.info/async-await
> - MDN — "for await...of": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of

---

## 7. Exercises

### Exercise Set A: Event Loop Puzzles

Predict the exact output order for each:

```js
// A1.
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");

// A2.
setTimeout(() => {
  console.log("1");
  Promise.resolve().then(() => console.log("2"));
}, 0);
setTimeout(() => {
  console.log("3");
  Promise.resolve().then(() => console.log("4"));
}, 0);

// A3.
async function foo() {
  console.log("A");
  await Promise.resolve();
  console.log("B");
}
console.log("C");
foo();
console.log("D");

// A4.
Promise.resolve()
  .then(() => { console.log(1); return 2; })
  .then((val) => { console.log(val); throw new Error("oops"); })
  .then(() => console.log(3))
  .catch((err) => { console.log(err.message); return 4; })
  .then((val) => console.log(val));
```

<details>
<summary><strong>Answers</strong></summary>

```
A1: A, D, C, B
    (sync: A, D → microtask: C → macrotask: B)

A2: 1, 2, 3, 4
    (macrotask 1: "1" → microtask: "2" → macrotask 2: "3" → microtask: "4")

A3: C, A, D, B
    (sync: C → foo starts sync: A → await pauses foo → sync: D →
     microtask resumes foo: B)

A4: 1, 2, "oops", 4
    (1 → returns 2 → logs 2 → throws → skips .then(3) → catch: "oops" →
     returns 4 → logs 4)
```

</details>

### Exercise Set B: Build These

```js
// B1. Implement promiseAll(promises) that works like Promise.all
function promiseAll(promises) {
  // YOUR CODE
}

// B2. Implement promiseRace(promises) that works like Promise.race

// B3. Implement delay(ms) — returns a Promise that resolves after ms
function delay(ms) {
  // YOUR CODE
}

// B4. Implement retry(fn, maxAttempts, delayMs) — retries async function
async function retry(fn, maxAttempts, delayMs) {
  // YOUR CODE
}

// B5. Implement timeout(promise, ms) — rejects if promise takes too long
function timeout(promise, ms) {
  // YOUR CODE
}
```

<details>
<summary><strong>Answers</strong></summary>

```js
// B1.
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(value => {
        results[index] = value;
        completed++;
        if (completed === promises.length) resolve(results);
      }).catch(reject);
    });
    if (promises.length === 0) resolve([]);
  });
}

// B3.
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// B4.
async function retry(fn, maxAttempts, delayMs) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await delay(delayMs * attempt); // exponential-ish backoff
    }
  }
}

// B5.
function timeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}
```

</details>

---

## 8. Milestone Project

### Build: An Async Task Queue with Concurrency Control

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project uses async/await, Promises, and advanced private class fields.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | `class`, private fields `#field` | Week 4 ✅ |
> | Promises — `new Promise()`, `.then()`, `.catch()` | Week 8 (this week) |
> | `async` / `await` | Week 8 (this week) |
> | `try / catch / finally` | Week 8 (this week) |
> | `Array.shift()` (remove first element) | Week 5 ✅ |
> | `Math.random()`, `Math.round()` | Week 3 ✅ |
>
> ✅ Complete all of Week 8 before starting this project.

```js
class AsyncQueue {
  #concurrency;
  #running = 0;
  #queue = [];
  #results = [];
  #completed = 0;
  #total = 0;
  #onProgressFn = null;
  #paused = false;

  constructor({ concurrency = 3 } = {}) {
    this.#concurrency = concurrency;
  }

  add(asyncFn) {
    this.#queue.push(asyncFn);
    this.#total++;
    return this;
  }

  onProgress(fn) {
    this.#onProgressFn = fn;
    return this;
  }

  pause()  { this.#paused = true; }
  resume() { this.#paused = false; this.#processQueue(); }

  async run() {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      this.#processQueue();
    });
  }

  #processQueue() {
    while (!this.#paused && this.#running < this.#concurrency && this.#queue.length > 0) {
      const task = this.#queue.shift();
      this.#running++;
      this.#executeTask(task);
    }
  }

  async #executeTask(task) {
    try {
      const result = await task();
      this.#results.push({ status: "fulfilled", value: result });
    } catch (error) {
      this.#results.push({ status: "rejected", reason: error });
    } finally {
      this.#running--;
      this.#completed++;

      if (this.#onProgressFn) {
        this.#onProgressFn({
          completed: this.#completed,
          total: this.#total,
          percent: Math.round((this.#completed / this.#total) * 100),
        });
      }

      if (this.#queue.length > 0) {
        this.#processQueue();
      } else if (this.#running === 0) {
        this._resolve(this.#results);
      }
    }
  }
}

// Test:
const queue = new AsyncQueue({ concurrency: 2 });

for (let i = 1; i <= 10; i++) {
  queue.add(async () => {
    const delay = Math.random() * 1000;
    await new Promise(r => setTimeout(r, delay));
    console.log(`Task ${i} done (${Math.round(delay)}ms)`);
    return `Result ${i}`;
  });
}

queue.onProgress(({ completed, total, percent }) => {
  console.log(`Progress: ${percent}%`);
});

queue.run().then(results => {
  console.log("All done!", results.length, "tasks completed");
});
```

---

## 9. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Event loop | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop |
| Event loop talk | Philip Roberts (JSConf) | https://www.youtube.com/watch?v=8aGhZQkoFbQ |
| "In the loop" talk | Jake Archibald (JSConf Asia) | https://www.youtube.com/watch?v=cCOL7MC4Pl0 |
| Event loop details | JavaScript.info | https://javascript.info/event-loop |
| Microtask guide | MDN | https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide |
| Using Promises | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises |
| Promise | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise |
| Promise basics | JavaScript.info | https://javascript.info/promise-basics |
| Promise chaining | JavaScript.info | https://javascript.info/promise-chaining |
| Promises/A+ Spec | promisesaplus.com | https://promisesaplus.com/ |
| Promise.all | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all |
| Promise.allSettled | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled |
| Promise.race | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race |
| Promise.any | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any |
| Promise API | JavaScript.info | https://javascript.info/promise-api |
| async function | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function |
| await | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await |
| Async/await | JavaScript.info | https://javascript.info/async-await |
| for await...of | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of |
| JS Visualizer 9000 | Tool | https://www.jsv9000.app/ |
