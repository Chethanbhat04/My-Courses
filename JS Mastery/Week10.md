# Week 10 — Design Patterns and Architecture

# The Complete Deep-Dive Lesson

> **Code that "works" is not enough. Code that is maintainable, extensible, and
> decoupled is what separates a junior from a senior. This lesson teaches the
> design patterns that power every major JavaScript framework — including React,
> Vue, Redux, and Node.js.**

---

## Table of Contents

1. [The Observer Pattern (Pub/Sub)](#1-the-observer-pattern-pubsub)
2. [The Factory Pattern](#2-the-factory-pattern)
3. [The Strategy Pattern](#3-the-strategy-pattern)
4. [Proxy and Reflect — Metaprogramming](#4-proxy-and-reflect--metaprogramming)
5. [Composition Over Inheritance](#5-composition-over-inheritance)
6. [State Machines](#6-state-machines)
7. [The Module and Singleton Patterns](#7-the-module-and-singleton-patterns)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. The Observer Pattern (Pub/Sub)

### What Is It?

The Observer pattern lets an object (the **subject**) maintain a list of
dependents (the **observers**) and notify them automatically when its state
changes. This is the **core idea behind React's state system, Redux, Node.js
EventEmitter, and the browser's DOM events**.

### Building an EventEmitter

```js
class EventEmitter {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);
    return this; // chainable
  }

  off(event, callback) {
    const list = this.#listeners.get(event);
    if (!list) return this;
    this.#listeners.set(event, list.filter(cb => cb !== callback));
    return this;
  }

  emit(event, ...args) {
    const list = this.#listeners.get(event);
    if (!list) return false;
    list.forEach(callback => callback(...args));
    return true;
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
    return this;
  }

  listenerCount(event) {
    return this.#listeners.get(event)?.length ?? 0;
  }

  removeAllListeners(event) {
    if (event) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
    return this;
  }
}
```

### Using EventEmitter

```js
const emitter = new EventEmitter();

// Subscribe
emitter.on("userLogin", (user) => {
  console.log(`Welcome, ${user.name}!`);
});

emitter.on("userLogin", (user) => {
  analytics.track("login", { userId: user.id });
});

emitter.once("firstVisit", () => {
  showOnboarding();
});

// Emit — all subscribers are notified
emitter.emit("userLogin", { id: 1, name: "Alice" });
// "Welcome, Alice!"
// analytics tracks the login

// Unsubscribe
const handler = (data) => console.log(data);
emitter.on("data", handler);
emitter.off("data", handler);
```

### How This Connects to React

```js
// Simplified version of what React does internally:
class Store {
  #state;
  #listeners = new Set();

  constructor(initialState) {
    this.#state = initialState;
  }

  getState() {
    return this.#state;
  }

  setState(updater) {
    const newState = typeof updater === "function"
      ? updater(this.#state)
      : { ...this.#state, ...updater };

    this.#state = newState;
    this.#notify(); // Notify all subscribers (re-render components)
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener); // return unsubscribe function
  }

  #notify() {
    this.#listeners.forEach(listener => listener(this.#state));
  }
}

// This is essentially what useState + React's reconciler does:
const store = new Store({ count: 0 });

const unsubscribe = store.subscribe((state) => {
  console.log("Re-render! Count:", state.count);
});

store.setState({ count: 1 }); // "Re-render! Count: 1"
store.setState(prev => ({ count: prev.count + 1 })); // "Re-render! Count: 2"

unsubscribe(); // component unmounts
```

> **Source:**
> - Node.js — "Events" module: https://nodejs.org/api/events.html
> - JavaScript.info — "Custom events": https://javascript.info/dispatch-events
> - Learning JS Design Patterns (Addy Osmani) — "Observer": https://www.patterns.dev/vanilla/observer-pattern
> - MDN — "EventTarget": https://developer.mozilla.org/en-US/docs/Web/API/EventTarget

---

## 2. The Factory Pattern

### What Is It?

A **factory function** creates and returns objects without using `new` or class
syntax. It encapsulates the creation logic, making it flexible to change later.

### Simple Factory

```js
function createUser(name, role) {
  return {
    name,
    role,
    createdAt: new Date(),
    permissions: role === "admin"
      ? ["read", "write", "delete", "manage"]
      : role === "editor"
        ? ["read", "write"]
        : ["read"],

    hasPermission(perm) {
      return this.permissions.includes(perm);
    },
  };
}

const admin = createUser("Alice", "admin");
const viewer = createUser("Bob", "viewer");

console.log(admin.hasPermission("delete")); // true
console.log(viewer.hasPermission("delete")); // false
```

### Abstract Factory — Creating Families of Objects

```js
function createNotification(type, message) {
  const base = {
    id: crypto.randomUUID(),
    message,
    timestamp: Date.now(),
    read: false,
    markAsRead() { this.read = true; },
  };

  switch (type) {
    case "email":
      return { ...base, type: "email", subject: message.slice(0, 50), send() { /* email logic */ } };
    case "sms":
      return { ...base, type: "sms", truncated: message.slice(0, 160), send() { /* SMS logic */ } };
    case "push":
      return { ...base, type: "push", title: "Notification", send() { /* push logic */ } };
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

const email = createNotification("email", "Your order has shipped!");
const sms = createNotification("sms", "Your code is 123456");
```

### When to Use Factory vs Class

| Use Factory When | Use Class When |
|-----------------|---------------|
| You want to return different object shapes | You need `instanceof` checks |
| You want to hide implementation details | You need prototypal inheritance |
| You don't need `this` binding complexity | You need private fields (`#`) |
| You want simple, functional code | You need multiple instances with shared methods |

> **Source:**
> - Learning JS Design Patterns — "Factory": https://www.patterns.dev/vanilla/factory-pattern
> - JavaScript.info — "Constructor, operator 'new'": https://javascript.info/constructor-new

---

## 3. The Strategy Pattern

### What Is It?

The Strategy pattern replaces conditional logic (if/else, switch) with
interchangeable strategy objects. Each strategy encapsulates a specific
algorithm.

### Before: The Problem

```js
// ❌ Adding a new sort type means modifying this function
function sortUsers(users, strategy) {
  if (strategy === "name") {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  } else if (strategy === "age") {
    return [...users].sort((a, b) => a.age - b.age);
  } else if (strategy === "joinDate") {
    return [...users].sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
  } else if (strategy === "score") {
    return [...users].sort((a, b) => b.score - a.score);
  }
  // More strategies = more if/else = harder to maintain
}
```

### After: Strategy Pattern

```js
// ✅ Each strategy is independent and can be added without modifying sortUsers
const sortStrategies = {
  name: (a, b) => a.name.localeCompare(b.name),
  age: (a, b) => a.age - b.age,
  joinDate: (a, b) => new Date(a.joinDate) - new Date(b.joinDate),
  score: (a, b) => b.score - a.score,
};

function sortUsers(users, strategyName) {
  const strategy = sortStrategies[strategyName];
  if (!strategy) throw new Error(`Unknown strategy: ${strategyName}`);
  return [...users].sort(strategy);
}

// Adding a new strategy is just one line:
sortStrategies.lastActive = (a, b) => new Date(b.lastActive) - new Date(a.lastActive);
```

### Practical Example: Form Validation Strategies

```js
const validators = {
  required: (value) =>
    value !== null && value !== undefined && value !== ""
      ? null : "This field is required",

  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? null : "Invalid email address",

  minLength: (min) => (value) =>
    value.length >= min ? null : `Minimum ${min} characters`,

  maxLength: (max) => (value) =>
    value.length <= max ? null : `Maximum ${max} characters`,

  pattern: (regex, msg) => (value) =>
    regex.test(value) ? null : msg,
};

function validate(value, rules) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

// Usage:
const usernameRules = [
  validators.required,
  validators.minLength(3),
  validators.maxLength(20),
  validators.pattern(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
];

console.log(validate("Al", usernameRules));
// "Minimum 3 characters"

console.log(validate("Alice_123", usernameRules));
// null (valid!)
```

> **Source:**
> - Learning JS Design Patterns — "Strategy": https://www.patterns.dev/vanilla/strategy-pattern
> - Refactoring Guru — "Strategy": https://refactoring.guru/design-patterns/strategy/javascript/example

---

## 4. Proxy and Reflect — Metaprogramming

### What Is a Proxy?

**Practical Mental Model (The Middleware Interceptor):**
Normally, when you interact with an object (like reading a property or changing a value), you interact directly with the object's data in memory. 

A `Proxy` acts like a middleware or an interceptor that sits in front of your object. You provide it with a "handler" object containing specific rules (called "traps"). Any code that wants to read or write to the original object MUST go through the proxy first.

The proxy can:
1. Let the request through normally.
2. Log the operation for debugging.
3. Validate data and throw an error before the object is ever touched.
4. Return computed or fake data dynamically.

Without a Proxy, `obj.name` reads directly from the object. With a Proxy, that read hits the `get` trap first. The trap decides whether to pass through, modify, or block the operation.

This ability to intercept fundamental language operations is called **metaprogramming** — writing code that controls how other code behaves. Modern frameworks like Vue.js and MobX use `Proxy` traps to detect when your data changes, allowing them to automatically re-render the UI without you ever writing a manual update function.

```js
const user = { name: "Alice", age: 25 };

const proxy = new Proxy(user, {
  get(target, property, receiver) {
    console.log(`Reading "${property}"`);
    return Reflect.get(target, property, receiver);
  },

  set(target, property, value, receiver) {
    console.log(`Setting "${property}" to ${value}`);
    return Reflect.set(target, property, value, receiver);
  },
});

proxy.name;       // logs: Reading "name" → returns "Alice"
proxy.age = 26;   // logs: Setting "age" to 26
```

### Proxy Traps (All 13)

| Trap | Intercepts |
|------|-----------|
| `get` | Property read (`obj.prop`) |
| `set` | Property write (`obj.prop = val`) |
| `has` | `in` operator (`"prop" in obj`) |
| `deleteProperty` | `delete obj.prop` |
| `apply` | Function call (`fn()`) |
| `construct` | `new` operator |
| `getOwnPropertyDescriptor` | `Object.getOwnPropertyDescriptor()` |
| `defineProperty` | `Object.defineProperty()` |
| `getPrototypeOf` | `Object.getPrototypeOf()` |
| `setPrototypeOf` | `Object.setPrototypeOf()` |
| `isExtensible` | `Object.isExtensible()` |
| `preventExtensions` | `Object.preventExtensions()` |
| `ownKeys` | `Object.keys()`, `for...in` |

### Validation Proxy

```js
function createValidatedObject(schema) {
  return new Proxy({}, {
    set(target, property, value) {
      const validator = schema[property];
      if (!validator) {
        throw new Error(`Unknown property: ${property}`);
      }
      if (!validator(value)) {
        throw new TypeError(`Invalid value for ${property}: ${value}`);
      }
      target[property] = value;
      return true;
    }
  });
}

const user = createValidatedObject({
  name: (v) => typeof v === "string" && v.length > 0,
  age: (v) => typeof v === "number" && v >= 0 && v <= 150,
  email: (v) => typeof v === "string" && v.includes("@"),
});

user.name = "Alice";   // ✅
user.age = 25;         // ✅
user.age = -5;         // [!] TypeError: Invalid value for age: -5
user.unknown = "x";    // [!] Error: Unknown property: unknown
```

### Building Reactive Data (How Vue.js Works)

```js
function reactive(target, onChange) {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop];
      // If the value is an object, make it reactive too (deep reactivity)
      if (typeof value === "object" && value !== null) {
        return reactive(value, onChange);
      }
      return value;
    },

    set(obj, prop, value) {
      const oldValue = obj[prop];
      obj[prop] = value;
      if (oldValue !== value) {
        onChange(prop, value, oldValue);
      }
      return true;
    },

    deleteProperty(obj, prop) {
      if (prop in obj) {
        const oldValue = obj[prop];
        delete obj[prop];
        onChange(prop, undefined, oldValue);
      }
      return true;
    },
  });
}

const state = reactive({ count: 0, user: { name: "Alice" } }, (prop, newVal, oldVal) => {
  console.log(`Changed: ${prop} from ${JSON.stringify(oldVal)} to ${JSON.stringify(newVal)}`);
});

state.count = 1;           // "Changed: count from 0 to 1"
state.user.name = "Bob";   // "Changed: name from "Alice" to "Bob""
```

### What Is Reflect?

`Reflect` provides default versions of the operations that `Proxy` intercepts.
Always use `Reflect` inside trap handlers to forward the operation correctly:

```js
const proxy = new Proxy(target, {
  get(target, prop, receiver) {
    // Do your custom logic
    console.log(`Accessing ${prop}`);
    // Then forward to the default behavior
    return Reflect.get(target, prop, receiver);
  }
});
```

**Why not just `target[prop]`?** `Reflect.get` correctly handles getters,
inheritance, and the `receiver` (which becomes `this` in getters). Direct
access can break in edge cases.

> **Source:**
> - MDN — "Proxy": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
> - MDN — "Reflect": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect
> - JavaScript.info — "Proxy and Reflect": https://javascript.info/proxy
> - Vue.js Reactivity in Depth: https://vuejs.org/guide/extras/reactivity-in-depth.html

---

## 5. Composition Over Inheritance

### The Problem with Deep Inheritance

```js
// ❌ Inheritance chains become rigid and fragile
class Animal { }
class FlyingAnimal extends Animal { fly() {} }
class SwimmingAnimal extends Animal { swim() {} }
// What if we need a FlyingSwimmingAnimal? JS doesn't support multiple inheritance.
```

### Composition: Mix Behaviors Together

```js
// ✅ Composition — behaviors are standalone functions
const canFly = (state) => ({
  fly() {
    console.log(`${state.name} is flying at ${state.speed}mph`);
  }
});

const canSwim = (state) => ({
  swim() {
    console.log(`${state.name} is swimming`);
  }
});

const canWalk = (state) => ({
  walk() {
    console.log(`${state.name} is walking`);
  }
});

// Compose any combination:
function createDuck(name) {
  const state = { name, speed: 30 };
  return {
    ...state,
    ...canFly(state),
    ...canSwim(state),
    ...canWalk(state),
  };
}

function createPenguin(name) {
  const state = { name, speed: 5 };
  return {
    ...state,
    ...canSwim(state),
    ...canWalk(state),
    // No canFly — penguins can't fly!
  };
}

const duck = createDuck("Donald");
duck.fly();  // "Donald is flying at 30mph"
duck.swim(); // "Donald is swimming"

const penguin = createPenguin("Tux");
penguin.swim(); // "Tux is swimming"
penguin.walk(); // "Tux is walking"
// penguin.fly();  // ❌ undefined — penguins can't fly
```

### compose() and pipe() — Function Composition

```js
// compose: right-to-left
function compose(...fns) {
  return (value) => fns.reduceRight((acc, fn) => fn(acc), value);
}

// pipe: left-to-right (more readable)
function pipe(...fns) {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}

// Build a data processing pipeline:
const processText = pipe(
  (text) => text.trim(),
  (text) => text.toLowerCase(),
  (text) => text.replace(/\s+/g, "-"),
  (text) => text.replace(/[^a-z0-9-]/g, ""),
);

console.log(processText("  Hello, World! 123  "));
// "hello-world-123"
```

> **Source:**
> - "Composition vs Inheritance" in React docs: https://react.dev/learn/thinking-in-react
> - Fun Fun Function — "Composition over Inheritance": https://www.youtube.com/watch?v=wfMtDGfHWpA
> - Patterns.dev — "Mixin Pattern": https://www.patterns.dev/vanilla/mixin-pattern

---

## 6. State Machines

### What Is a State Machine?

A **finite state machine** (FSM) is a model where a system can be in exactly
one of a finite number of states at any time, and transitions between states
are triggered by events.

### The Problem with Boolean Flags

Boolean flags get messy fast:

```js
// ❌ Boolean soup — hard to reason about
let isLoading = false;
let isError = false;
let isSuccess = false;
let data = null;

// Can isLoading AND isError both be true? The code doesn't prevent it.
```

```js
// ✅ State machine — only one state at a time
// State can be: "idle" | "loading" | "success" | "error"
// Impossible to be "loading" and "error" simultaneously.
```

### Building a State Machine

```js
function createMachine(config) {
  let currentState = config.initial;
  const listeners = new Set();

  return {
    get state() { return currentState; },

    send(event) {
      const stateConfig = config.states[currentState];
      if (!stateConfig) throw new Error(`Invalid state: ${currentState}`);

      const transition = stateConfig.on?.[event];
      if (!transition) {
        console.warn(`No transition for event "${event}" in state "${currentState}"`);
        return this;
      }

      const nextState = typeof transition === "string" ? transition : transition.target;

      // Run exit action
      stateConfig.onExit?.();

      // Run transition action
      if (typeof transition === "object" && transition.action) {
        transition.action();
      }

      currentState = nextState;

      // Run entry action
      config.states[nextState]?.onEntry?.();

      // Notify subscribers
      listeners.forEach(fn => fn(currentState));

      return this;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    matches(state) {
      return currentState === state;
    },
  };
}
```

### Example: Fetch Request State Machine

```js
const fetchMachine = createMachine({
  initial: "idle",
  states: {
    idle: {
      on: {
        FETCH: "loading",
      },
    },
    loading: {
      onEntry: () => console.log("⏳ Loading..."),
      on: {
        SUCCESS: "success",
        FAILURE: "error",
      },
    },
    success: {
      onEntry: () => console.log("✅ Data loaded!"),
      on: {
        FETCH: "loading",  // refetch
        RESET: "idle",
      },
    },
    error: {
      onEntry: () => console.log("❌ Error occurred"),
      on: {
        RETRY: "loading",
        RESET: "idle",
      },
    },
  },
});

fetchMachine.subscribe(state => console.log(`State: ${state}`));

fetchMachine.send("FETCH");   // ⏳ Loading... → State: loading
fetchMachine.send("SUCCESS"); // ✅ Data loaded! → State: success
fetchMachine.send("RESET");   // State: idle

fetchMachine.send("FETCH");   // ⏳ Loading...
fetchMachine.send("FAILURE"); // ❌ Error occurred
fetchMachine.send("RETRY");   // ⏳ Loading...
fetchMachine.send("SUCCESS"); // ✅ Data loaded!
```

### State Diagram

```
          FETCH              SUCCESS
  idle ─────────▶ loading ─────────▶ success
   ▲                │                   │
   │      FAILURE   │        FETCH      │
   │                ▼                   │
   │              error                 │
   │                │                   │
   │      RETRY     │                   │
   │                └──▶ loading        │
   │                                    │
   └──────────── RESET ◀───────────────┘
```

> **Source:**
> - XState documentation: https://xstate.js.org/docs/
> - Statecharts — "Introduction": https://statecharts.dev/
> - Patterns.dev — "State Pattern": https://www.patterns.dev/vanilla/state-pattern

---

## 7. The Module and Singleton Patterns

### The Revealing Module Pattern

```js
const Calculator = (() => {
  // Private
  let history = [];

  function addToHistory(operation, result) {
    history.push({ operation, result, timestamp: Date.now() });
  }

  // Public API
  return {
    add(a, b) {
      const result = a + b;
      addToHistory(`${a} + ${b}`, result);
      return result;
    },
    subtract(a, b) {
      const result = a - b;
      addToHistory(`${a} - ${b}`, result);
      return result;
    },
    getHistory() {
      return [...history]; // return a copy
    },
  };
})();

Calculator.add(5, 3);      // 8
Calculator.subtract(10, 4); // 6
console.log(Calculator.getHistory());
// [{ operation: "5 + 3", result: 8, ... }, { operation: "10 - 4", result: 6, ... }]
// Calculator.history — undefined (private)
```

### Singleton via ES Modules

ES Modules are evaluated once and cached — making them natural singletons:

```js
// database.js
class Database {
  #connection = null;

  connect(url) {
    if (this.#connection) return this.#connection;
    console.log(`Connecting to ${url}...`);
    this.#connection = { url, connected: true };
    return this.#connection;
  }

  query(sql) {
    if (!this.#connection) throw new Error("Not connected");
    console.log(`Executing: ${sql}`);
    return [];
  }
}

// Export a single instance — every file that imports gets the SAME object
export default new Database();
```

```js
// In file A:
import db from './database.js';
db.connect("postgres://localhost/mydb");

// In file B:
import db from './database.js';
db.query("SELECT * FROM users"); // works — same instance, already connected
```

> **Source:**
> - Learning JS Design Patterns — "Module Pattern": https://www.patterns.dev/vanilla/module-pattern
> - Learning JS Design Patterns — "Singleton": https://www.patterns.dev/vanilla/singleton-pattern
> - JavaScript.info — "Modules, introduction": https://javascript.info/modules-intro

---

## 8. Exercises

### Exercise Set A: Design Patterns

```js
// A1. Build a complete EventEmitter with: on, off, emit, once,
//     removeAllListeners, listenerCount

// A2. Build a createStore(reducer, initialState) — a mini Redux
//     Must have: dispatch(action), getState(), subscribe(listener)
function createStore(reducer, initialState) {
  // YOUR CODE
}
// Usage:
// const store = createStore(
//   (state, action) => {
//     switch (action.type) {
//       case "INCREMENT": return { count: state.count + 1 };
//       case "DECREMENT": return { count: state.count - 1 };
//       default: return state;
//     }
//   },
//   { count: 0 }
// );

// A3. Use Proxy to create an "observable" object that logs all changes

// A4. Build a state machine for a traffic light: green → yellow → red → green

// A5. Refactor a 10-branch if/else using the Strategy pattern
```

<details>
<summary><strong>A2 Solution — Mini Redux</strong></summary>

```js
function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState() {
      return state;
    },

    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach(listener => listener(state));
      return action;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener); // unsubscribe
    },
  };
}

// Test:
const store = createStore(
  (state, action) => {
    switch (action.type) {
      case "INCREMENT": return { ...state, count: state.count + 1 };
      case "DECREMENT": return { ...state, count: state.count - 1 };
      case "SET": return { ...state, count: action.payload };
      default: return state;
    }
  },
  { count: 0 }
);

const unsub = store.subscribe((state) => console.log("State:", state));
store.dispatch({ type: "INCREMENT" }); // State: { count: 1 }
store.dispatch({ type: "INCREMENT" }); // State: { count: 2 }
store.dispatch({ type: "SET", payload: 10 }); // State: { count: 10 }
unsub();
store.dispatch({ type: "DECREMENT" }); // (no log — unsubscribed)
console.log(store.getState()); // { count: 9 }
```

</details>

<details>
<summary><strong>A4 Solution — Traffic Light State Machine</strong></summary>

```js
const trafficLight = createMachine({
  initial: "green",
  states: {
    green: {
      onEntry: () => console.log("[GREEN] GREEN — Go!"),
      on: { NEXT: "yellow" },
    },
    yellow: {
      onEntry: () => console.log("[YELLOW] YELLOW — Slow down!"),
      on: { NEXT: "red" },
    },
    red: {
      onEntry: () => console.log("[RED] RED — Stop!"),
      on: { NEXT: "green" },
    },
  },
});

// Auto-cycle every 2 seconds:
setInterval(() => trafficLight.send("NEXT"), 2000);
```

</details>

---

## 9. Milestone Project

### Build: A Reactive State Management Library

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project uses Proxy, Map, Set, and advanced object patterns.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | `Proxy` & `Reflect` | Week 10 (this week) |
> | `Map` and `Set` | Week 5 ✅ |
> | `structuredClone()` | Week 10 (this week) |
> | Closures & getter syntax | Week 1 ✅ / Week 4 ✅ |
> | Spread operator `[...arr]`, `{...obj}` | Week 5 ✅ |
> | `Array.prototype.map()`, `.filter()` | Week 5 ✅ |
>
> ✅ Complete all of Week 10 before starting this project.

Build a store with Proxy-based reactivity, selective subscriptions, computed
getters, and action middleware. Full spec in the roadmap's Week 10 section.

Starter:

```js
function createReactiveStore({ state, actions, getters = {} }) {
  const listeners = new Map(); // property → Set<callback>
  const cache = new Map();     // getter name → cached value

  const reactiveState = new Proxy(structuredClone(state), {
    set(target, prop, value) {
      const old = target[prop];
      target[prop] = value;
      if (old !== value) {
        cache.clear(); // invalidate computed getters
        const propListeners = listeners.get(prop);
        if (propListeners) {
          propListeners.forEach(fn => fn(value, old));
        }
      }
      return true;
    },
  });

  return {
    get state() { return reactiveState; },

    dispatch(actionName, payload) {
      const action = actions[actionName];
      if (!action) throw new Error(`Unknown action: ${actionName}`);
      action(reactiveState, payload);
    },

    computed(name) {
      if (cache.has(name)) return cache.get(name);
      const getter = getters[name];
      if (!getter) throw new Error(`Unknown getter: ${name}`);
      const value = getter(reactiveState);
      cache.set(name, value);
      return value;
    },

    subscribe(properties, callback) {
      for (const prop of properties) {
        if (!listeners.has(prop)) listeners.set(prop, new Set());
        listeners.get(prop).add(callback);
      }
      return () => {
        for (const prop of properties) {
          listeners.get(prop)?.delete(callback);
        }
      };
    },
  };
}

// Usage:
const store = createReactiveStore({
  state: { todos: [], filter: "all" },
  actions: {
    addTodo(state, text) {
      state.todos = [...state.todos, { id: Date.now(), text, done: false }];
    },
    toggleTodo(state, id) {
      state.todos = state.todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    },
  },
  getters: {
    completedCount: (state) => state.todos.filter(t => t.done).length,
  },
});

store.subscribe(["todos"], (newTodos) => {
  console.log("Todos changed:", newTodos);
});

store.dispatch("addTodo", "Learn Proxy");
console.log(store.computed("completedCount")); // 0
```

---

## 10. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Events module (Node.js) | Node.js Docs | https://nodejs.org/api/events.html |
| Custom events | JavaScript.info | https://javascript.info/dispatch-events |
| Observer pattern | Patterns.dev | https://www.patterns.dev/vanilla/observer-pattern |
| EventTarget | MDN | https://developer.mozilla.org/en-US/docs/Web/API/EventTarget |
| Factory pattern | Patterns.dev | https://www.patterns.dev/vanilla/factory-pattern |
| Constructor/new | JavaScript.info | https://javascript.info/constructor-new |
| Strategy pattern | Patterns.dev | https://www.patterns.dev/vanilla/strategy-pattern |
| Strategy (Refactoring Guru) | Refactoring Guru | https://refactoring.guru/design-patterns/strategy/javascript/example |
| Proxy | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy |
| Reflect | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect |
| Proxy and Reflect | JavaScript.info | https://javascript.info/proxy |
| Vue Reactivity in Depth | Vue.js Docs | https://vuejs.org/guide/extras/reactivity-in-depth.html |
| Composition (React) | React Docs | https://react.dev/learn/thinking-in-react |
| Composition over Inheritance | Fun Fun Function (YouTube) | https://www.youtube.com/watch?v=wfMtDGfHWpA |
| Mixin pattern | Patterns.dev | https://www.patterns.dev/vanilla/mixin-pattern |
| XState docs | XState | https://xstate.js.org/docs/ |
| Statecharts intro | statecharts.dev | https://statecharts.dev/ |
| Module pattern | Patterns.dev | https://www.patterns.dev/vanilla/module-pattern |
| Singleton pattern | Patterns.dev | https://www.patterns.dev/vanilla/singleton-pattern |
| Modules intro | JavaScript.info | https://javascript.info/modules-intro |
