# Week 6 — Error Handling, Modules, and Code Organization

# The Complete Deep-Dive Lesson

> **Production code doesn't just work — it fails gracefully. This lesson teaches
> you professional error handling, ES Modules for code organization, and the
> Symbol primitive that powers many of JavaScript's internal mechanisms.**

---

## Table of Contents

1. [Error Types and Custom Errors](#1-error-types-and-custom-errors)
2. [try...catch...finally — Control Flow](#2-trycatchfinally--control-flow)
3. [Defensive Programming Patterns](#3-defensive-programming-patterns)
4. [ES Modules — import/export](#4-es-modules--importexport)
5. [Module Patterns and Code Organization](#5-module-patterns-and-code-organization)
6. [Symbols — Unique Identifiers](#6-symbols--unique-identifiers)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. Error Types and Custom Errors

### Built-in Error Types

JavaScript has seven built-in error constructors:

```js
// Error — generic error
throw new Error("Something went wrong");

// TypeError — wrong type used
null.toString();  // TypeError: Cannot read properties of null

// ReferenceError — accessing undeclared/TDZ variable
console.log(x);  // ReferenceError: x is not defined

// SyntaxError — invalid syntax (caught at parse time)
// eval("if(");  // SyntaxError: Unexpected end of input

// RangeError — value outside allowed range
new Array(-1);  // RangeError: Invalid array length

// URIError — bad URI encoding
decodeURIComponent("%");  // URIError

// EvalError — legacy, related to eval() (rarely seen)
```

### Error Object Properties

```js
try {
  undefinedFunction();
} catch (error) {
  console.log(error.name);    // "ReferenceError"
  console.log(error.message); // "undefinedFunction is not defined"
  console.log(error.stack);   // Full stack trace (non-standard but universal)
}
```

### Creating Custom Error Classes

In production, you create specialized error types so callers can handle
different failures differently:

```js
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends AppError {
  constructor(field, constraint) {
    super(`Validation failed: ${field} ${constraint}`, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
    this.constraint = constraint;
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
    this.resource = resource;
    this.id = id;
  }
}

// Usage:
function findUser(id) {
  const user = database.get(id);
  if (!user) throw new NotFoundError("User", id);
  return user;
}

try {
  findUser(999);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log(`404: ${error.message}`);     // specific handling
  } else if (error instanceof ValidationError) {
    console.log(`400: ${error.field} failed`); // different handling
  } else {
    throw error; // re-throw unknown errors
  }
}
```

> **Source:**
> - MDN — "Error": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
> - JavaScript.info — "Custom errors, extending Error": https://javascript.info/custom-errors
> - MDN — "TypeError": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError

---

## 2. try...catch...finally — Control Flow

### Basic Syntax

```js
try {
  // Code that might throw
  const data = JSON.parse('{"invalid json');
} catch (error) {
  // Handle the error
  console.error("Parse failed:", error.message);
} finally {
  // ALWAYS runs — whether error occurred or not
  console.log("Cleanup complete");
}
```

### finally Always Runs

```js
function divide(a, b) {
  try {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  } catch (error) {
    console.error(error.message);
    return null;
  } finally {
    console.log("divide() completed"); // runs even after return!
  }
}

divide(10, 0);
// "Division by zero"
// "divide() completed"
// returns null
```

### The Result Pattern (Rust-style)

Instead of throwing, return success/failure objects. This is increasingly
popular in modern JavaScript:

```js
function trySafe(fn) {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

const result = trySafe(() => JSON.parse('{"name": "Alice"}'));
if (result.success) {
  console.log(result.data); // { name: "Alice" }
} else {
  console.error(result.error);
}

// Async version:
async function trySafeAsync(promise) {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
```

### Error Handling Anti-Patterns

```js
// ❌ SWALLOWING errors — the worst thing you can do
try {
  riskyOperation();
} catch (e) {
  // empty catch block — error is silently ignored
}

// ❌ Catching too broadly
try {
  // 100 lines of code
} catch (e) {
  console.log("Something failed"); // Which line? What kind of error?
}

// ✅ CORRECT — catch specific errors, re-throw unknown ones
try {
  const data = fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    showRetryButton();
  } else if (error instanceof ValidationError) {
    showFormErrors(error.field);
  } else {
    throw error; // Don't swallow errors you don't understand
  }
}
```

> **Source:**
> - MDN — "try...catch": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
> - JavaScript.info — "Error handling, 'try...catch'": https://javascript.info/try-catch

---

## 3. Defensive Programming Patterns

### Guard Clauses

Instead of deep nesting, return early for invalid cases:

```js
// ❌ Deep nesting
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission("admin")) {
        // actual logic buried here
        return doAdminStuff(user);
      }
    }
  }
  return null;
}

// ✅ Guard clauses — flat and readable
function processUser(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission("admin")) return null;

  return doAdminStuff(user);
}
```

### Input Validation

```js
function createUser(name, age, email) {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new ValidationError("name", "must be a non-empty string");
  }
  if (typeof age !== "number" || age < 0 || age > 150) {
    throw new ValidationError("age", "must be between 0 and 150");
  }
  if (typeof email !== "string" || !email.includes("@")) {
    throw new ValidationError("email", "must be a valid email");
  }

  return { name: name.trim(), age, email: email.toLowerCase() };
}
```

### Optional Chaining and Nullish Coalescing

```js
const user = {
  profile: {
    address: null
  }
};

// ❌ Without optional chaining
const city = user && user.profile && user.profile.address
  && user.profile.address.city;

// ✅ With optional chaining (?.)
const city = user?.profile?.address?.city; // undefined — no crash

// With nullish coalescing (??) for defaults
const displayCity = user?.profile?.address?.city ?? "Unknown";
// "Unknown"

// Optional chaining for method calls
const length = user?.profile?.getName?.(); // undefined if getName doesn't exist

// Optional chaining for arrays
const first = user?.friends?.[0]; // undefined if friends doesn't exist
```

> **Source:**
> - MDN — "Optional chaining": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
> - MDN — "Nullish coalescing": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing

---

## 4. ES Modules — import/export

### Named Exports

```js
// math.js
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export const PI = 3.14159;
```

```js
// main.js
import { add, multiply, PI } from './math.js';

console.log(add(2, 3));    // 5
console.log(multiply(4, 5)); // 20
console.log(PI);             // 3.14159

// Rename on import
import { add as sum } from './math.js';
console.log(sum(2, 3)); // 5

// Import everything as a namespace
import * as math from './math.js';
console.log(math.add(2, 3)); // 5
```

### Default Exports

```js
// Logger.js
export default class Logger {
  log(msg) { console.log(msg); }
}

// Can also export a function as default
// export default function greet(name) { return `Hello, ${name}`; }
```

```js
// main.js — name the default import whatever you want
import Logger from './Logger.js';
import MyLogger from './Logger.js'; // same thing, different name

const logger = new Logger();
logger.log("Hello");
```

### Mixing Named and Default Exports

```js
// api.js
export default class ApiClient { /* ... */ }
export const BASE_URL = "https://api.example.com";
export function formatUrl(path) { return `${BASE_URL}${path}`; }
```

```js
// Importing both
import ApiClient, { BASE_URL, formatUrl } from './api.js';
```

### Dynamic import()

`import()` returns a Promise — useful for lazy loading:

```js
// Load a module only when needed
async function loadChart() {
  const { Chart } = await import('./chart.js');
  const chart = new Chart();
  chart.render();
}

// Conditional loading
if (userWantsAdvancedFeatures) {
  const { advancedAnalytics } = await import('./analytics.js');
  advancedAnalytics.init();
}
```

### How ES Modules Work Under the Hood

ES Modules go through **three phases**:

```
1. CONSTRUCTION — Parse the code, resolve imports, build a module graph
2. INSTANTIATION — Create module scopes, link imports to exports (live bindings)
3. EVALUATION — Execute the module code, fill in the values
```

**Live Bindings** — the key difference from CommonJS:

```js
// counter.js
export let count = 0;
export function increment() { count++; }

// main.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1 ← Live binding! The import sees the updated value.

// count = 5; // ❌ TypeError: Assignment to import — imports are read-only
```

In CommonJS (`require`), you get a **copy** of the value. In ES Modules, you
get a **live read-only reference** to the original variable.

### Module Scope

Each module has its own scope. Variables are NOT global:

```js
// a.js
const secret = "hidden";
export const public = "visible";

// b.js
import { public } from './a.js';
console.log(public); // "visible"
console.log(secret); // ReferenceError — secret is not exported
```

> **Source:**
> - MDN — "JavaScript modules": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
> - MDN — "import": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
> - MDN — "export": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export
> - JavaScript.info — "Modules, introduction": https://javascript.info/modules-intro
> - JavaScript.info — "Export and Import": https://javascript.info/import-export
> - V8 blog — "JavaScript modules": https://v8.dev/features/modules

---

## 5. Module Patterns and Code Organization

### Feature-Based Folder Structure

```
project/
├── features/
│   ├── auth/
│   │   ├── auth.js          (main module)
│   │   ├── auth.validators.js
│   │   └── auth.api.js
│   ├── users/
│   │   ├── users.js
│   │   ├── users.api.js
│   │   └── users.utils.js
│   └── products/
│       ├── products.js
│       └── products.api.js
├── shared/
│   ├── utils.js
│   ├── constants.js
│   └── validators.js
├── index.js
└── package.json
```

### Barrel Files (Re-exporting)

A barrel file re-exports from multiple files for cleaner imports:

```js
// features/auth/index.js (barrel file)
export { login, logout, register } from './auth.js';
export { validateEmail, validatePassword } from './auth.validators.js';
export { AuthApi } from './auth.api.js';
```

```js
// Now import from the folder, not individual files
import { login, validateEmail, AuthApi } from './features/auth/index.js';
```

### Singleton Pattern with Modules

ES Modules are evaluated **once** and cached. Subsequent imports return the
same instance:

```js
// config.js — this code runs ONCE, no matter how many files import it
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
};

export default Object.freeze(config);
```

```js
// a.js
import config from './config.js';
// b.js
import config from './config.js';
// Both get the SAME frozen object — singleton behavior for free
```

> **Source:**
> - JavaScript.info — "Modules, introduction": https://javascript.info/modules-intro
> - MDN — "JavaScript modules": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

---

## 6. Symbols — Unique Identifiers

### What Is a Symbol?

A `Symbol` is a **primitive value** that is guaranteed to be unique. No two
symbols are ever equal, even with the same description.

```js
const sym1 = Symbol("id");
const sym2 = Symbol("id");
console.log(sym1 === sym2); // false — always unique

console.log(typeof sym1); // "symbol"
console.log(sym1.toString()); // "Symbol(id)"
console.log(sym1.description); // "id"
```

### Using Symbols as Object Keys

Symbols are invisible to `for...in`, `Object.keys()`, and
`JSON.stringify()` — perfect for "hidden" metadata:

```js
const ID = Symbol("id");
const METADATA = Symbol("metadata");

const user = {
  name: "Alice",
  [ID]: 12345,
  [METADATA]: { created: "2025-01-01" },
};

console.log(user[ID]);       // 12345
console.log(user[METADATA]); // { created: "2025-01-01" }

// Hidden from enumeration:
console.log(Object.keys(user));        // ["name"]
console.log(JSON.stringify(user));     // '{"name":"Alice"}'
for (const key in user) console.log(key); // "name"

// But accessible with:
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id), Symbol(metadata)]
```

### Well-Known Symbols

JavaScript has built-in symbols that let you customize how objects behave:

```js
// Symbol.toPrimitive — control type conversion
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.amount;
    if (hint === "string") return `${this.amount} ${this.currency}`;
    return this.amount; // default
  }
}

const price = new Money(42.99, "USD");
console.log(+price);         // 42.99     (hint: "number")
console.log(`${price}`);     // "42.99 USD" (hint: "string")
console.log(price + 0);      // 42.99     (hint: "default")

// Symbol.iterator — make objects iterable (covered in Week 5)
// Symbol.hasInstance — customize instanceof (covered in Week 4)
```

### Symbol.for() — Global Symbol Registry

```js
// Symbol.for creates/retrieves symbols from a global registry
const s1 = Symbol.for("app.id");
const s2 = Symbol.for("app.id");
console.log(s1 === s2); // true — same symbol from the registry

// Get the key back:
console.log(Symbol.keyFor(s1)); // "app.id"
```

> **Source:**
> - MDN — "Symbol": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
> - MDN — "Symbol.toPrimitive": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive
> - JavaScript.info — "Symbol type": https://javascript.info/symbol

---

## 7. Exercises

### Exercise Set A: Error Handling

```js
// A1. Create a retry function
// retry(fn, maxAttempts) — calls fn, if it throws, retries up to maxAttempts times
// Returns the result on success, throws the last error on failure

// A2. Create a trySafe(fn) that returns { success, data } or { success, error }
// Then create trySafeAsync(asyncFn) for async functions

// A3. Refactor this deeply nested code using guard clauses:
function processOrder(order) {
  if (order) {
    if (order.items && order.items.length > 0) {
      if (order.customer) {
        if (order.customer.email) {
          return sendConfirmation(order.customer.email, order.items);
        } else {
          throw new Error("No email");
        }
      } else {
        throw new Error("No customer");
      }
    } else {
      throw new Error("No items");
    }
  } else {
    throw new Error("No order");
  }
}
```

<details>
<summary><strong>Answers</strong></summary>

```js
// A1.
function retry(fn, maxAttempts) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
    }
  }
  throw lastError;
}

// A2.
function trySafe(fn) {
  try {
    return { success: true, data: fn() };
  } catch (error) {
    return { success: false, error };
  }
}

async function trySafeAsync(asyncFn) {
  try {
    return { success: true, data: await asyncFn() };
  } catch (error) {
    return { success: false, error };
  }
}

// A3.
function processOrder(order) {
  if (!order) throw new Error("No order");
  if (!order.items?.length) throw new Error("No items");
  if (!order.customer) throw new Error("No customer");
  if (!order.customer.email) throw new Error("No email");

  return sendConfirmation(order.customer.email, order.items);
}
```

</details>

### Exercise Set B: Modules

```js
// B1. Refactor this monolithic code into ES Modules:
// - validators.js (email, password validation)
// - formatter.js (formatDate, formatCurrency)
// - user.js (createUser, validateUser — imports from validators)
// - index.js (imports from all, runs the app)

// B2. Demonstrate that ES Module imports are live bindings
// Create a counter.js with an export let count and increment function
// Show that importing count and calling increment shows the updated value

// B3. Write a module that uses dynamic import() to lazy-load a feature
```

---

## 8. Milestone Project

### Build: A Plugin-Based Logger System

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project uses ES Modules, private class fields, and advanced OOP.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | `class`, `constructor`, `this` | Week 4 ✅ |
> | Private class fields `#field` | Week 4 ✅ |
> | ES Modules (`export` / `import`) | Week 6 (this week) |
> | `for...of` loop | Week 2 ✅ |
> | Template literals | Week 2 ✅ |
> | `JSON.stringify()` | Week 3 ✅ |
> | `new Date().toISOString()` | Week 3 ✅ |
>
> ✅ Complete all of Week 6 before starting this project.

```js
// logger.js — Core module
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

export class Logger {
  #level;
  #transports;
  #formatters;

  constructor({ level = "info", transports = [], formatter = null } = {}) {
    this.#level = LOG_LEVELS[level];
    this.#transports = transports;
    this.#formatters = formatter;
  }

  #shouldLog(level) {
    return LOG_LEVELS[level] >= this.#level;
  }

  #createEntry(level, message, data) {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  #output(entry) {
    const formatted = this.#formatters
      ? this.#formatters.format(entry)
      : `[${entry.level.toUpperCase()}] ${entry.timestamp} — ${entry.message}`;

    for (const transport of this.#transports) {
      transport.write(formatted, entry);
    }
  }

  debug(msg, data) { if (this.#shouldLog("debug")) this.#output(this.#createEntry("debug", msg, data)); }
  info(msg, data)  { if (this.#shouldLog("info"))  this.#output(this.#createEntry("info", msg, data)); }
  warn(msg, data)  { if (this.#shouldLog("warn"))  this.#output(this.#createEntry("warn", msg, data)); }
  error(msg, data) { if (this.#shouldLog("error")) this.#output(this.#createEntry("error", msg, data)); }
}

// console-transport.js
export class ConsoleTransport {
  write(formatted, entry) {
    const method = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log";
    console[method](formatted);
  }
}

// json-formatter.js
export class JsonFormatter {
  format(entry) {
    return JSON.stringify(entry);
  }
}

// Usage:
// import { Logger } from './logger.js';
// import { ConsoleTransport } from './console-transport.js';
// import { JsonFormatter } from './json-formatter.js';
//
// const logger = new Logger({
//   level: "debug",
//   transports: [new ConsoleTransport()],
//   formatter: new JsonFormatter(),
// });
// logger.info("Server started", { port: 3000 });
```

---

## 9. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Error | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error |
| Custom errors | JavaScript.info | https://javascript.info/custom-errors |
| TypeError | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError |
| try...catch | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch |
| Error handling | JavaScript.info | https://javascript.info/try-catch |
| Optional chaining | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining |
| Nullish coalescing | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing |
| JS Modules guide | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules |
| import | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import |
| export | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export |
| Modules intro | JavaScript.info | https://javascript.info/modules-intro |
| Export and Import | JavaScript.info | https://javascript.info/import-export |
| V8 modules | V8 Blog | https://v8.dev/features/modules |
| Symbol | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol |
| Symbol.toPrimitive | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive |
| Symbol type | JavaScript.info | https://javascript.info/symbol |
