# Week 11 — Performance, Testing, and Tooling

# The Complete Deep-Dive Lesson

> **Production-grade code isn't just correct — it's fast, tested, and
> debuggable. This lesson teaches you to find and fix performance bottlenecks,
> write tests without a framework, understand bundling and tree shaking, and use
> the scheduling APIs that inspired React's Concurrent Mode.**

---

## Table of Contents

1. [Performance Profiling](#1-performance-profiling)
2. [Memory Leaks — Finding and Fixing Them](#2-memory-leaks--finding-and-fixing-them)
3. [WeakMap and WeakSet — Weak References](#3-weakmap-and-weakset--weak-references)
4. [Unit Testing Without a Framework](#4-unit-testing-without-a-framework)
5. [Bundling and Tree Shaking](#5-bundling-and-tree-shaking)
6. [requestIdleCallback and Scheduling](#6-requestidlecallback-and-scheduling)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. Performance Profiling

### Using the Performance API

```js
// Measure execution time
const start = performance.now();
expensiveOperation();
const end = performance.now();
console.log(`Took ${(end - start).toFixed(2)}ms`);

// Named markers and measures
performance.mark("fetchStart");
await fetch("/api/data");
performance.mark("fetchEnd");
performance.measure("API Fetch", "fetchStart", "fetchEnd");

const [measure] = performance.getEntriesByName("API Fetch");
console.log(`Fetch took: ${measure.duration.toFixed(2)}ms`);
```

### PerformanceObserver — Detecting Long Tasks

A "long task" is any task that blocks the main thread for more than 50ms:

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
    console.log("  Name:", entry.name);
    console.log("  Start:", entry.startTime.toFixed(2));
  }
});

observer.observe({ entryTypes: ["longtask"] });
```

### A Reusable Benchmark Utility

```js
function benchmark(name, fn, iterations = 1000) {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const min = times[0];
  const max = times[times.length - 1];

  console.log(`[stats] ${name} (${iterations} iterations):`);
  console.log(`   avg: ${avg.toFixed(4)}ms | median: ${median.toFixed(4)}ms`);
  console.log(`   p95: ${p95.toFixed(4)}ms | min: ${min.toFixed(4)}ms | max: ${max.toFixed(4)}ms`);

  return { avg, median, p95, min, max };
}

// Compare two approaches:
const arr = Array.from({ length: 10000 }, (_, i) => i);

benchmark("for loop", () => {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
});

benchmark("reduce", () => {
  arr.reduce((a, b) => a + b, 0);
});
```

### Chrome DevTools Performance Tab

**How to profile:**
1. Open DevTools → Performance tab
2. Click Record
3. Perform the action you want to profile
4. Click Stop
5. Analyze the flame chart:
   - **Yellow** = JavaScript execution
   - **Purple** = Rendering (layout/reflow)
   - **Green** = Painting
   - Long bars = slow operations

> **Source:**
> - MDN — "Performance API": https://developer.mozilla.org/en-US/docs/Web/API/Performance_API
> - MDN — "PerformanceObserver": https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
> - Chrome DevDocs — "Analyze runtime performance": https://developer.chrome.com/docs/devtools/performance
> - web.dev — "Long Tasks API": https://web.dev/articles/custom-metrics#long-tasks-api

---

## 2. Memory Leaks — Finding and Fixing Them

### The 5 Most Common Memory Leaks

#### 1. Forgotten Event Listeners

```js
// ❌ LEAK — listener is never removed
function setupFeature() {
  const handler = () => console.log(window.scrollY);
  window.addEventListener("scroll", handler);
  // If setupFeature is called multiple times, handlers stack up!
}

// ✅ FIX — return a cleanup function
function setupFeature() {
  const handler = () => console.log(window.scrollY);
  window.addEventListener("scroll", handler);
  return () => window.removeEventListener("scroll", handler);
}
const cleanup = setupFeature();
// Later: cleanup();
```

#### 2. Detached DOM Nodes

```js
// ❌ LEAK — removed from DOM but JS still references it
let detachedNode;
function createBanner() {
  const banner = document.createElement("div");
  banner.textContent = "Hello!";
  document.body.appendChild(banner);
  detachedNode = banner; // stored in a variable
}
function removeBanner() {
  detachedNode.remove(); // removed from DOM
  // BUT detachedNode still holds a reference → can't be GC'd!
}

// ✅ FIX — null out the reference
function removeBanner() {
  detachedNode.remove();
  detachedNode = null;
}
```

#### 3. Forgotten Timers

```js
// ❌ LEAK — interval runs forever
function startPolling() {
  setInterval(async () => {
    const data = await fetch("/api/status");
    updateUI(data); // what if the component/page is gone?
  }, 5000);
}

// ✅ FIX — store and clear the interval
function startPolling() {
  const id = setInterval(async () => {
    const data = await fetch("/api/status");
    updateUI(data);
  }, 5000);
  return () => clearInterval(id);
}
```

#### 4. Closures Capturing Large Data

```js
// ❌ LEAK — closure keeps entire `hugeData` alive
function processData() {
  const hugeData = new Array(1_000_000).fill("x");
  return function getLength() {
    return hugeData.length; // only needs length, but holds the whole array
  };
}

// ✅ FIX — extract what you need
function processData() {
  const hugeData = new Array(1_000_000).fill("x");
  const length = hugeData.length;
  return function getLength() {
    return length; // only captures the number
  };
}
```

#### 5. Growing Collections

```js
// ❌ LEAK — cache grows without bound
const cache = new Map();
function getCachedData(key) {
  if (!cache.has(key)) {
    cache.set(key, expensiveComputation(key));
  }
  return cache.get(key);
}
// cache grows indefinitely — never cleared

// ✅ FIX — LRU cache with a max size
class LRUCache {
  #max;
  #cache = new Map();

  constructor(max = 100) { this.#max = max; }

  get(key) {
    if (!this.#cache.has(key)) return undefined;
    const value = this.#cache.get(key);
    this.#cache.delete(key);
    this.#cache.set(key, value); // move to end (most recent)
    return value;
  }

  set(key, value) {
    this.#cache.delete(key);
    this.#cache.set(key, value);
    if (this.#cache.size > this.#max) {
      const oldest = this.#cache.keys().next().value;
      this.#cache.delete(oldest);
    }
  }
}
```

### Detecting Leaks with Chrome DevTools

1. Open DevTools → Memory tab
2. Take a **Heap Snapshot** (baseline)
3. Perform the suspected leaking action
4. Take another **Heap Snapshot**
5. Select "Comparison" view between the two snapshots
6. Look for objects with high **Retained Size** that shouldn't exist

> **Source:**
> - Chrome DevDocs — "Fix memory problems": https://developer.chrome.com/docs/devtools/memory-problems
> - MDN — "Memory management": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management
> - JavaScript.info — "Garbage collection": https://javascript.info/garbage-collection

---

## 3. WeakMap and WeakSet — Weak References

### The Problem WeakMap Solves

**Practical Mental Model (Caching DOM Elements):**
Imagine you are building a tool that tracks how many times a user clicks on different buttons on a page. You want to store this click-count data in a dictionary, using the DOM element itself as the key. 

If you use a regular `Map`, it holds a **strong reference** to its keys. This means even if the button is removed from the DOM and the user navigates away, the button element *cannot* be garbage collected because your `Map` is still holding onto it. This creates a memory leak.

A `WeakMap` solves this by holding a **weak reference** to its keys. If the only remaining reference to that button object is the `WeakMap` key, the garbage collector is free to delete the button entirely. When the button is garbage collected, its corresponding entry in the `WeakMap` magically disappears. This is the perfect data structure for attaching metadata to objects you don't own (like DOM nodes or objects from third-party libraries) without keeping them alive indefinitely.

```js
// Regular Map — PREVENTS garbage collection of the key
const cache = new Map();
let user = { name: "Alice" };
cache.set(user, "some data");
user = null; // user is gone, but the Map still holds a reference → NOT GC'd

// WeakMap — ALLOWS garbage collection
const weakCache = new WeakMap();
let user2 = { name: "Bob" };
weakCache.set(user2, "some data");
user2 = null; // nobody references the object → it CAN be GC'd
// The WeakMap entry is automatically cleaned up
```

### WeakMap Restrictions

| Feature | Map | WeakMap |
|---------|-----|---------|
| Keys | Any type | Objects only |
| Iterable | ✅ (`for...of`, `.keys()`, `.values()`) | ❌ Not iterable |
| `.size` | ✅ | ❌ |
| GC of keys | ❌ Prevents | ✅ Allows |

### Practical Uses

#### 1. Private Data for Class Instances

```js
const privateData = new WeakMap();

class Person {
  constructor(name, ssn) {
    this.name = name;
    privateData.set(this, { ssn }); // ssn is stored outside the instance
  }

  getSSN(pin) {
    if (pin !== "1234") throw new Error("Wrong PIN");
    return privateData.get(this).ssn;
  }
}

const alice = new Person("Alice", "123-45-6789");
console.log(alice.name);        // "Alice"
console.log(alice.ssn);         // undefined — not on the instance
console.log(alice.getSSN("1234")); // "123-45-6789"
// When alice is GC'd, the WeakMap entry is automatically cleaned up
```

#### 2. Caching Computed Data for DOM Elements

```js
const elementMetrics = new WeakMap();

function getMetrics(element) {
  if (elementMetrics.has(element)) {
    return elementMetrics.get(element); // cache hit
  }

  // Expensive calculation
  const metrics = {
    width: element.offsetWidth,
    height: element.offsetHeight,
    area: element.offsetWidth * element.offsetHeight,
  };

  elementMetrics.set(element, metrics);
  return metrics;
}

// When the element is removed from the DOM and no longer referenced,
// the WeakMap entry is automatically garbage collected.
```

### WeakSet

Same concept but for sets — tracks objects without preventing GC:

```js
const visited = new WeakSet();

function processNode(node) {
  if (visited.has(node)) return; // already processed
  visited.add(node);
  // process node...
}
```

> **Source:**
> - MDN — "WeakMap": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
> - MDN — "WeakSet": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet
> - JavaScript.info — "WeakMap and WeakSet": https://javascript.info/weakmap-weakset

---

## 4. Unit Testing Without a Framework

### Building a Mini Test Runner

```js
// test-runner.js

let passed = 0;
let failed = 0;
let currentSuite = "";

function describe(name, fn) {
  currentSuite = name;
  console.log(`\n[list] ${name}`);
  fn();
  currentSuite = "";
}

function it(description, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${description}`);
  } catch (error) {
    failed++;
    console.log(`  ❌ ${description}`);
    console.log(`     Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
      }
    },
    toThrow(expectedMessage) {
      if (typeof actual !== "function") {
        throw new Error("Expected a function");
      }
      try {
        actual();
        throw new Error("Expected function to throw, but it didn't");
      } catch (error) {
        if (expectedMessage && !error.message.includes(expectedMessage)) {
          throw new Error(`Expected error containing "${expectedMessage}", got "${error.message}"`);
        }
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
      }
    },
    toHaveLength(length) {
      if (actual.length !== length) {
        throw new Error(`Expected length ${length}, got ${actual.length}`);
      }
    },
    toBeInstanceOf(constructor) {
      if (!(actual instanceof constructor)) {
        throw new Error(`Expected instance of ${constructor.name}`);
      }
    },
  };
}

function summary() {
  console.log(`\n${"─".repeat(40)}`);
  console.log(`✅ ${passed} passed | ❌ ${failed} failed | [stats] ${passed + failed} total`);
  console.log(`${"─".repeat(40)}\n`);
}
```

### Using the Test Runner

```js
// Example: testing a Stack data structure
class Stack {
  #items = [];
  push(item) { this.#items.push(item); }
  pop() {
    if (this.#items.length === 0) throw new Error("Stack is empty");
    return this.#items.pop();
  }
  peek() { return this.#items[this.#items.length - 1]; }
  get size() { return this.#items.length; }
  get isEmpty() { return this.#items.length === 0; }
}

describe("Stack", () => {
  it("starts empty", () => {
    const stack = new Stack();
    expect(stack.isEmpty).toBe(true);
    expect(stack.size).toBe(0);
  });

  it("pushes items", () => {
    const stack = new Stack();
    stack.push(1);
    stack.push(2);
    expect(stack.size).toBe(2);
    expect(stack.peek()).toBe(2);
  });

  it("pops in LIFO order", () => {
    const stack = new Stack();
    stack.push("a");
    stack.push("b");
    stack.push("c");
    expect(stack.pop()).toBe("c");
    expect(stack.pop()).toBe("b");
    expect(stack.pop()).toBe("a");
  });

  it("throws on empty pop", () => {
    const stack = new Stack();
    expect(() => stack.pop()).toThrow("empty");
  });
});

summary();
```

Output:
```
[list] Stack
  ✅ starts empty
  ✅ pushes items
  ✅ pops in LIFO order
  ✅ throws on empty pop

────────────────────────────────────
✅ 4 passed | ❌ 0 failed | [stats] 4 total
────────────────────────────────────
```

> **Source:**
> - Node.js built-in test runner: https://nodejs.org/api/test.html
> - Node.js assert module: https://nodejs.org/api/assert.html
> - Jest docs (reference for patterns): https://jestjs.io/docs/getting-started

---

## 5. Bundling and Tree Shaking

### What Is Bundling?

Bundlers (Vite/Rollup, Webpack, esbuild) combine multiple JavaScript modules
into fewer files for the browser — reducing HTTP requests and enabling
optimizations.

### Tree Shaking — Dead Code Elimination

Tree shaking analyzes `import`/`export` statements to remove unused code:

```js
// math.js
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; } // NOT imported anywhere
export function subtract(a, b) { return a - b; } // NOT imported anywhere

// app.js
import { add } from './math.js'; // only imports `add`
console.log(add(2, 3));
```

**After tree shaking, the bundle only contains `add`.** `multiply` and
`subtract` are eliminated because they're never used.

### ES Modules and Tree Shaking

ES Module `import`/`export` statements are **static** — they must be at the
top level and can't be inside conditionals. This means the bundler can analyze
the dependency graph at build time, before any code runs.

CommonJS `require()` is **dynamic** — it can be inside `if` statements, loops,
or even computed. The bundler can't know which exports are used until runtime,
so it can't tree-shake.

```js
// ✅ ES Modules — tree-shakeable
import { add } from './math.js';

// ❌ CommonJS — NOT tree-shakeable
const math = require('./math.js'); // imports everything
```

### Side Effects

A module has **side effects** if importing it runs code (modifies globals,
registers polyfills, etc.) even if no exports are used. Tree shaking keeps
side-effectful modules even if nothing is imported from them.

```js
// This has side effects — importing it runs code
import './polyfills.js'; // no exports used, but it patches Array.prototype

// package.json can declare side-effect-free modules:
// "sideEffects": false  ← tells bundler it's safe to tree-shake everything
```

### Source Maps

Source maps map minified/bundled code back to your original source code.
Without them, debugging production code shows unreadable one-line files.

```js
// Minified code (production):
function a(b,c){return b+c}a(1,2)

// Source map points this back to:
function add(num1, num2) {
  return num1 + num2;
}
add(1, 2);
```

Browsers automatically load source maps when they find the comment:
```js
//# sourceMappingURL=app.js.map
```

> **Source:**
> - MDN — "Tree shaking": https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking
> - Webpack — "Tree Shaking": https://webpack.js.org/guides/tree-shaking/
> - Rollup — "Tree-shaking": https://rollupjs.org/introduction/#tree-shaking
> - MDN — "Use a source map": https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map

---

## 6. requestIdleCallback and Scheduling

### What Is requestIdleCallback?

`requestIdleCallback` runs a callback during the browser's idle periods —
when the main thread has nothing else to do. This prevents low-priority work
from blocking user interactions and rendering.

```js
requestIdleCallback((deadline) => {
  // deadline.timeRemaining() → ms of idle time available
  // deadline.didTimeout → true if the timeout was exceeded

  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    processTask(tasks.shift()); // do work while we have time
  }

  if (tasks.length > 0) {
    requestIdleCallback(processMoreTasks); // schedule more work
  }
});
```

React's Fiber architecture breaks rendering into small "units of work" and checks if the browser needs to handle user input between units, much like `requestIdleCallback`:

```js
// Simplified version of React's work loop concept:
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // yield if < 1ms left
  }

  if (nextUnitOfWork) {
    requestIdleCallback(workLoop); // schedule remaining work
  }
}

requestIdleCallback(workLoop);
```

### Building a Task Scheduler

```js
class TaskScheduler {
  #highPriority = [];
  #normalPriority = [];
  #lowPriority = [];
  #isRunning = false;

  schedule(task, priority = "normal") {
    switch (priority) {
      case "high": this.#highPriority.push(task); break;
      case "normal": this.#normalPriority.push(task); break;
      case "low": this.#lowPriority.push(task); break;
    }

    if (!this.#isRunning) {
      this.#isRunning = true;
      this.#flush();
    }
  }

  #getNextTask() {
    if (this.#highPriority.length) return this.#highPriority.shift();
    if (this.#normalPriority.length) return this.#normalPriority.shift();
    if (this.#lowPriority.length) return this.#lowPriority.shift();
    return null;
  }

  #flush() {
    requestIdleCallback((deadline) => {
      while (deadline.timeRemaining() > 1) {
        const task = this.#getNextTask();
        if (!task) {
          this.#isRunning = false;
          return;
        }
        task();
      }

      if (this.#getNextTask()) {
        // More work remains — put current task back and reschedule
        this.#flush();
      } else {
        this.#isRunning = false;
      }
    });
  }
}

const scheduler = new TaskScheduler();

// High-priority: user-visible updates
scheduler.schedule(() => updateUI(), "high");

// Normal: data processing
scheduler.schedule(() => processData(), "normal");

// Low: analytics, logging
scheduler.schedule(() => sendAnalytics(), "low");
```

> **Source:**
> - MDN — "requestIdleCallback": https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
> - React — "Fiber Architecture" (concept): https://github.com/acdlite/react-fiber-architecture
> - web.dev — "Using requestIdleCallback": https://web.dev/articles/using-requestidlecallback

---

## 7. Exercises

```js
// E1. Write a benchmark that compares:
//     a) for loop vs forEach vs map for summing 100,000 numbers
//     b) Object.keys().forEach vs for...in for iterating object properties

// E2. Create a memory leak on purpose (3 different types).
//     Then fix each one. Document what you did.

// E3. Build a WeakMap-based memoize function: memoizeWeak(fn)
//     that caches results keyed by object arguments
function memoizeWeak(fn) {
  // YOUR CODE — cache should auto-clean when keys are GC'd
}

// E4. Write tests for your Week 10 EventEmitter using the mini test runner

// E5. Use requestIdleCallback to defer non-critical initialization
//     (e.g., preloading images, setting up analytics, loading fonts)
```

<details>
<summary><strong>E3 Solution</strong></summary>

```js
function memoizeWeak(fn) {
  const cache = new WeakMap();

  return function(obj, ...args) {
    if (cache.has(obj)) return cache.get(obj);
    const result = fn.call(this, obj, ...args);
    cache.set(obj, result);
    return result;
  };
}

const getExpensiveReport = memoizeWeak((user) => {
  console.log("Computing report for", user.name);
  return { userId: user.id, score: Math.random() * 100 };
});

const user = { id: 1, name: "Alice" };
getExpensiveReport(user); // "Computing report for Alice" → cached
getExpensiveReport(user); // cache hit — no log

// When `user` is garbage collected, the cache entry is auto-cleaned
```

</details>

---

## 8. Milestone Project

### Build: A Performance Monitoring Dashboard

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project focuses on performance profiling, garbage collection, and Web APIs.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | `PerformanceObserver` & `performance.memory` | Week 11 (this week) |
> | Memory management / Garbage Collection concepts | Week 11 (this week) |
> | `WeakMap` and `WeakSet` | Week 11 (this week) |
> | HTML Canvas API & `requestAnimationFrame()` | Week 11 / general DOM web APIs |
> | DOM querying (`querySelector`, count nodes) | Week 7 ✅ |
> | `class`, `constructor`, `this` | Week 4 ✅ |
>
> ✅ Complete all of Week 11 before starting this project.

See the Week 11 section in the roadmap for the full spec. Build a tool that
monitors FPS, memory usage, long tasks, and DOM node count, with a live-updating
canvas chart.

---

## 9. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Performance API | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Performance_API |
| PerformanceObserver | MDN | https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver |
| DevTools Performance | Chrome DevDocs | https://developer.chrome.com/docs/devtools/performance |
| Long Tasks API | web.dev | https://web.dev/articles/custom-metrics#long-tasks-api |
| Fix memory problems | Chrome DevDocs | https://developer.chrome.com/docs/devtools/memory-problems |
| Memory management | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management |
| Garbage collection | JavaScript.info | https://javascript.info/garbage-collection |
| WeakMap | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap |
| WeakSet | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet |
| WeakMap/WeakSet | JavaScript.info | https://javascript.info/weakmap-weakset |
| Node.js test runner | Node.js Docs | https://nodejs.org/api/test.html |
| Node.js assert | Node.js Docs | https://nodejs.org/api/assert.html |
| Jest (reference) | Jest Docs | https://jestjs.io/docs/getting-started |
| Tree shaking | MDN | https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking |
| Tree shaking (Webpack) | Webpack Docs | https://webpack.js.org/guides/tree-shaking/ |
| Tree shaking (Rollup) | Rollup Docs | https://rollupjs.org/introduction/#tree-shaking |
| Source maps | MDN | https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map |
| requestIdleCallback | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback |
| React Fiber Architecture | Andrew Clark | https://github.com/acdlite/react-fiber-architecture |
| Using requestIdleCallback | web.dev | https://web.dev/articles/using-requestidlecallback |
