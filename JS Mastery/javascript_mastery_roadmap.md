#  JavaScript Mastery: 12-Week Deep-Dive Roadmap

> **Goal:** Go from zero to an advanced, engine-level understanding of JavaScript — so that when you open React's source code, nothing feels like magic.

> [!TIP]
> **How to use this roadmap:** Dedicate ~2 hours/day on weekdays (drills + reading) and ~4-5 hours on weekends (milestone project). Each week builds on the last. Don't skip the "Under the Hood" sections — that's where senior-level understanding lives.

---

## [list] Roadmap Overview

| Phase | Weeks | Focus |
|-------|-------|-------|
| **Phase 1** | 1–3 | Fundamentals, Logic, and Memory Basics |
| **Phase 2** | 4–6 | Objects, Arrays, and Functional Programming |
| **Phase 3** | 7–9 | The DOM, Web APIs, and Asynchronous JavaScript |
| **Phase 4** | 10–12 | Advanced Patterns, Tooling, and React-Readiness |

---

# Phase 1: Fundamentals, Logic, and Memory Basics

> *"If you don't understand how the engine reads your code, you'll never truly debug it."*

---

## Week 1 — The JavaScript Engine & Execution Model

###  Theme
**How JavaScript Actually Runs Your Code**

Most tutorials teach you *what* to write. This week, you learn *what happens after you press Enter*.

###  Core Concepts

1. **Execution Context** — Global vs. Function execution contexts; what gets created and when.
2. **The Call Stack** — How JS tracks where it is in your code; single-threaded execution.
3. **Hoisting** — Why `var`, `function`, `let`, and `const` behave differently before their declaration line.
4. **The Temporal Dead Zone (TDZ)** — Why `let`/`const` throw `ReferenceError` but `var` gives `undefined`.
5. **Scope & Scope Chain** — Lexical scoping; how the engine resolves variable names by walking up the chain.
6. **`var` vs `let` vs `const`** — Block scope vs function scope; re-declaration and reassignment rules.
7. **Strict Mode** — What `"use strict"` changes and why modern code implicitly uses it (ES Modules).

###  Under the Hood

When V8 encounters your script, it performs two passes:

```
┌─────────────────────────────────────────────────────┐
│              CREATION PHASE                         │
│  1. Create the Global Execution Context (GEC)       │
│  2. Set up the Variable Environment:                │
│     - var declarations → initialized to undefined   │
│     - let/const declarations → <uninitialized> (TDZ)│
│     - function declarations → fully hoisted          │
│  3. Determine the value of `this`                   │
│  4. Create the Scope Chain                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              EXECUTION PHASE                        │
│  1. Execute code line by line                       │
│  2. Assign values to variables                      │
│  3. Push/pop function contexts onto the Call Stack  │
└─────────────────────────────────────────────────────┘
```

**Memory detail:** Each execution context has two components:
- **Variable Environment** — stores variable/function declarations.
- **Lexical Environment** — holds `let`/`const` bindings and a reference to the outer environment (this forms the scope chain).

The TDZ exists because `let`/`const` are allocated in memory during creation but are not initialized. Accessing them before the engine reaches the declaration line is like trying to open a locked door — the key (initialization) hasn't been handed over yet.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Hoisting"`, `"let"`, `"const"`, `"var"`, `"strict mode"` |
| JavaScript.info | `"JavaScript specials"`, `"Variables"`, `"The old var"` |
| YouTube | `"Namaste JavaScript Episode 1-8"` (Akshay Saini), `"JS Execution Context Visualized"` |

###  Daily Practice Drill (Mon–Fri)

**Day 1:** Write 10 code snippets using `var`, `let`, and `const`. Predict the output before running them. Focus on re-declaration and reassignment.

**Day 2:** Create 5 functions nested 3 levels deep. In each, log a variable from an outer scope. Draw the scope chain on paper.

**Day 3:** Write 5 hoisting puzzles — mix `var` declarations, function declarations, and function expressions. Predict the output.

**Day 4:** Write code that triggers TDZ errors with `let` and `const`. Then fix each one. Explain *why* it failed.

**Day 5:** Recreate the call stack on paper for a program with 4 nested function calls. Note the order of push/pop.

### ️ Weekly Milestone Project

**Build: A Code Execution Visualizer (Console-Based)**

Create a program that simulates what the JS engine does:
- Accept a simple code string (hardcoded is fine).
- Parse it to identify `var`, `let`, `const`, and `function` declarations.
- Output a step-by-step log showing: *"Creation Phase: `x` → undefined"*, *"Execution Phase: `x` = 5"*.
- Simulate the call stack by logging `PUSH: functionName` and `POP: functionName`.

This forces you to think *like* the engine.

###  Senior Interview Question

> **Q:** *"Explain why the following code logs `undefined` instead of `10`, and what would change if we replaced `var` with `let`."*
> ```js
> console.log(x);
> var x = 10;
> ```
> **What they're really asking:** Can you articulate the two-phase execution model (creation + execution), explain hoisting at the engine level, and contrast `var`'s initialization behavior with `let`'s TDZ?

---

## Week 2 — Data Types, Type Coercion, and Memory

###  Theme
**JavaScript's Type System Is a Feature, Not a Bug — If You Understand It**

###  Core Concepts

1. **Primitive vs Reference Types** — `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint` vs objects/arrays/functions.
2. **Type Coercion** — Implicit vs explicit; the Abstract Equality Algorithm (`==` vs `===`).
3. **Truthy & Falsy Values** — The exact 8 falsy values and why `[] == false` is `true`.
4. **`typeof` Operator & Its Quirks** — Why `typeof null === "object"` (a 25-year-old bug).
5. **Value vs Reference** — Why mutating an object inside a function changes the original.
6. **Stack vs Heap Memory** — Where primitives and objects actually live in memory.
7. **Garbage Collection** — Mark-and-sweep; how V8 reclaims memory.

###  Under the Hood

```
┌──────────── STACK MEMORY ────────────┐   ┌──────────── HEAP MEMORY ────────────┐
│                                      │   │                                      │
│  let name = "Alice"   → "Alice"      │   │  { name: "Alice", age: 25 }          │
│  let age = 25         → 25           │   │    ↑                                 │
│  let isActive = true  → true         │   │    │                                 │
│                                      │   │    │  (reference/pointer)             │
│  let user = 0x3F2A ──────────────────│───│────┘                                 │
│                                      │   │                                      │
└──────────────────────────────────────┘   └──────────────────────────────────────┘
```

**Primitives** are stored directly on the stack. When you do `let b = a`, you copy the *value*. They're independent.

**Objects** are stored on the heap. Variables hold a *reference* (memory address) to the heap location. When you do `let obj2 = obj1`, you copy the *reference*, not the object. Both variables now point to the same object.

**Garbage Collection (Mark-and-Sweep):**
V8's GC starts from "root" references (global object, current call stack). It traverses all reachable objects and *marks* them. Anything unmarked is *swept* (freed). This is why closures can cause memory leaks — they keep references alive.

**Type Coercion internals:** When `==` compares different types, JS follows the *Abstract Equality Comparison Algorithm* (ECMA-262 §7.2.14). For example, `[] == false` triggers:
`[] → "" → 0` and `false → 0`, so `0 == 0` → `true`.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Data structures"`, `"Equality comparisons"`, `"Memory management"` |
| JavaScript.info | `"Data types"`, `"Type conversions"`, `"Comparisons"` |
| YouTube | `"JavaScript type coercion wtf"`, `"stack and heap memory JS"`, `"Garbage collection V8"` |
| Book | *"You Don't Know JS Yet: Get Started"* — Chapter 2 |

###  Daily Practice Drill

**Day 1:** Write 15 expressions using `==` and predict the output. Then verify with `===`. Examples: `"" == 0`, `null == undefined`, `NaN == NaN`.

**Day 2:** Create 5 scenarios demonstrating value vs reference behavior. Include a function that mutates a parameter.

**Day 3:** Write a `deepEqual(a, b)` function that compares two values/objects for deep equality (no libraries).

**Day 4:** List all 8 falsy values. Write a utility function `isFalsy(val)` that checks without using `Boolean()`.

**Day 5:** Write code that intentionally creates a memory leak (e.g., growing array in a closure). Then fix it.

### ️ Weekly Milestone Project

**Build: A Type Coercion Debugger**

Create a CLI tool (runs in Node.js) that:
- Takes two values as input.
- Shows the step-by-step coercion chain: `"5" == 5` → `"5" → ToPrimitive → ToNumber → 5 == 5 → true`.
- Handles edge cases: `null`, `undefined`, `NaN`, `[]`, `{}`.
- Logs whether `==` and `===` would produce the same result.
- Outputs a recommendation: *"Use === here because…"*.

###  Senior Interview Question

> **Q:** *"If I pass an object to a function and reassign the parameter inside, does the original object change? What if I mutate a property instead? Explain the difference in terms of memory."*
>
> **What they're really asking:** Do you understand that JS is "pass by value of the reference"? Reassignment replaces the *local* reference (stack); mutation modifies the *heap* object through the shared reference.

---

## Week 3 — Functions, Closures, and the `this` Keyword

###  Theme
**Functions Are the Heart of JavaScript — Closures Are Its Soul**

###  Core Concepts

1. **Function Declarations vs Expressions vs Arrows** — Hoisting differences, syntax, and when to use each.
2. **First-Class Functions** — Functions as values: passing, returning, storing in variables.
3. **Closures** — A function bundled with its lexical environment; how inner functions "remember" outer variables.
4. **The `this` Keyword** — Four binding rules: default, implicit, explicit (`call`, `apply`, `bind`), and `new`.
5. **Arrow Functions & Lexical `this`** — Why arrows don't have their own `this` and why that matters.
6. **IIFE (Immediately Invoked Function Expressions)** — Module pattern before ES Modules existed.
7. **Higher-Order Functions** — Functions that take or return other functions.

###  Under the Hood

**Closures in memory:**

When a function is created, V8 attaches a hidden `[[Environment]]` property — a reference to the Lexical Environment where the function was defined.

```
function createCounter() {
  let count = 0;              // lives in createCounter's Lexical Environment
  return function increment() {
    count++;                   // increment's [[Environment]] → createCounter's LE
    return count;
  };
}

const counter = createCounter();
// createCounter() has returned, its execution context is POPPED off the stack.
// BUT its Lexical Environment is NOT garbage collected because
// `increment` still holds a reference to it via [[Environment]].
// This IS a closure.
```

```
┌─ Call Stack ────────────────┐
│  (empty after createCounter │     ┌─ Heap ─────────────────────┐
│   returns)                  │     │                             │
│                             │     │  increment function object  │
│                             │     │    [[Environment]] ──────┐  │
│                             │     │                          │  │
│                             │     │  createCounter's LE ◄────┘  │
│                             │     │    count: 0                 │
│                             │     │                             │
└─────────────────────────────┘     └─────────────────────────────┘
```

**`this` binding decision tree:**

```
Was the function called with `new`?
  → YES: `this` = the newly created object
  → NO: Was it called with `call`/`apply`/`bind`?
    → YES: `this` = the explicitly provided object
    → NO: Was it called as a method (obj.method())?
      → YES: `this` = the object before the dot
      → NO: Default binding
        → strict mode: `this` = undefined
        → sloppy mode: `this` = globalThis (window/global)

Arrow functions: SKIP ALL OF THE ABOVE. Use `this` from enclosing scope.
```

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Closures"`, `"this"`, `"Arrow function expressions"`, `"Function.prototype.bind"` |
| JavaScript.info | `"Closure"`, `"The old var"`, `"Function object"`, `"Decorators and forwarding"` |
| YouTube | `"Closures in JS Namaste JavaScript"`, `"this keyword JS Techsith"`, `"Fireship closures 100 seconds"` |
| Book | *"You Don't Know JS Yet: Scope & Closures"* — Chapters 6-7 |

###  Daily Practice Drill

**Day 1:** Write 5 closure examples: counter, private variable, function factory, memoizer, partial application.

**Day 2:** Write the same function as a declaration, expression, and arrow. Test how `this` behaves in each.

**Day 3:** Implement your own `myBind(fn, context, ...args)` that works like `Function.prototype.bind`.

**Day 4:** Solve the classic loop problem: `for (var i = 0; i < 5; i++) { setTimeout(() => console.log(i), 1000); }` — fix it three different ways.

**Day 5:** Write a `once(fn)` higher-order function that ensures `fn` can only be called once.

### ️ Weekly Milestone Project

**Build: A Configurable Rate Limiter**

Create a `createRateLimiter(fn, limit, windowMs)` function:
- Uses closures to track call count within a time window.
- Returns a wrapped function that executes `fn` only if the rate limit hasn't been exceeded.
- After the window expires, the counter resets.
- Add a `getRemainingCalls()` method to inspect the state (tests closure's "memory").
- Extend it: add a `throttle` mode and a `debounce` mode as separate factory functions.

```js
const limitedLog = createRateLimiter(console.log, 3, 10000);
limitedLog("1st call"); // ✅ Executes
limitedLog("2nd call"); // ✅ Executes
limitedLog("3rd call"); // ✅ Executes
limitedLog("4th call"); // ❌ Rate limited
```

###  Senior Interview Question

> **Q:** *"Explain why an arrow function cannot be used as a constructor with `new`, and describe a real-world scenario where using an arrow function for `this` binding is critical."*
>
> **What they're really asking:** Arrow functions have no `[[Construct]]` internal method and no `prototype` property. They inherit `this` lexically. This is critical in class methods passed as callbacks (e.g., React event handlers, `setTimeout` in methods).

---

# Phase 2: Objects, Arrays, and Functional Programming

> *"JavaScript is an object-oriented language with functional programming capabilities. Master both."*

---

## Week 4 — Objects, Prototypes, and the Prototype Chain

###  Theme
**Every Object Has a Secret Link — The Prototype Chain Is JavaScript's Inheritance Model**

###  Core Concepts

1. **Object Creation Patterns** — Literals, `Object.create()`, constructor functions, `class` syntax.
2. **Prototypal Inheritance** — `__proto__` vs `.prototype`; how property lookup walks the chain.
3. **The Prototype Chain** — Object → Object.prototype → null; how methods are shared.
4. **Property Descriptors** — `writable`, `enumerable`, `configurable`; `Object.defineProperty()`.
5. **`Object.keys()` vs `for...in`** — Enumerable own vs inherited properties.
6. **ES6 Classes** — Syntactic sugar over prototypes; `constructor`, `extends`, `super`.
7. **`instanceof` and `Symbol.hasInstance`** — How JS determines type relationships.

###  Under the Hood

```
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() { return `${this.name} makes a sound`; };

const dog = new Animal("Rex");
```

**What `new` does (4 steps):**
1. Creates a brand-new empty object: `{}`
2. Sets the new object's `[[Prototype]]` (i.e., `__proto__`) to `Animal.prototype`
3. Executes `Animal()` with `this` bound to the new object
4. Returns the new object (unless the constructor explicitly returns a different object)

```
dog                        Animal.prototype           Object.prototype
┌──────────────┐          ┌──────────────────┐       ┌────────────────────┐
│ name: "Rex"  │          │ speak: function  │       │ toString: function │
│ __proto__ ───┼────────▶ │ __proto__ ───────┼─────▶ │ hasOwnProperty: fn │
└──────────────┘          └──────────────────┘       │ __proto__: null    │
                                                     └────────────────────┘
```

When you call `dog.speak()`, V8's **property lookup**:
1. Check `dog` own properties → no `speak`
2. Follow `__proto__` to `Animal.prototype` → found! Use it.

When you call `dog.toString()`:
1. Check `dog` → no `toString`
2. Check `Animal.prototype` → no `toString`
3. Check `Object.prototype` → found!

**Hidden Classes (V8 optimization):** V8 creates internal "shapes" (hidden classes) for objects. Objects with the same property order share a hidden class, allowing V8 to optimize property access like a compiled language. Adding properties dynamically or in different orders creates new hidden classes and *de-optimizes* your code.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Inheritance and the prototype chain"`, `"Object.create"`, `"Object.defineProperty"` |
| JavaScript.info | `"Prototypal inheritance"`, `"F.prototype"`, `"Native prototypes"`, `"Class basic syntax"` |
| YouTube | `"JS prototype chain visualized"`, `"Fun Fun Function prototype"`, `"V8 hidden classes"` |
| Book | *"You Don't Know JS Yet: Objects & Classes"* — Chapters 3-5 |

###  Daily Practice Drill

**Day 1:** Create an object with `Object.create()`. Add methods to its prototype. Walk the prototype chain using `Object.getPrototypeOf()`.

**Day 2:** Rewrite a `class`-based inheritance example using constructor functions and `.prototype`. Verify both work identically.

**Day 3:** Use `Object.defineProperty()` to create a property that is non-enumerable, non-writable, and non-configurable. Try to break it.

**Day 4:** Write a `myInstanceOf(obj, Constructor)` function that manually walks the prototype chain.

**Day 5:** Create two objects with properties added in different orders. Discuss why V8's hidden classes would differ.

### ️ Weekly Milestone Project

**Build: A Schema Validator Library**

Create a mini-library that validates objects against a schema:

```js
const userSchema = Schema.create({
  name: Schema.string().required(),
  age: Schema.number().min(18).max(120),
  email: Schema.string().pattern(/^.+@.+\..+$/),
  role: Schema.enum(["admin", "user", "guest"]).default("user"),
});

const result = userSchema.validate({ name: "Alice", age: 25 });
// { valid: true, data: { name: "Alice", age: 25, role: "user" } }
```

- Use prototypal inheritance: `StringValidator` extends `BaseValidator`.
- Each validator type has chainable methods (returns `this`).
- Practice `Object.defineProperty` for immutable schema definitions.
- Add `.toJSON()` for serializing the schema.

###  Senior Interview Question

> **Q:** *"When I write `class Dog extends Animal {}`, what is actually happening in terms of prototypes? If I add a method to `Animal.prototype` after creating an instance of `Dog`, will the instance see it? Why?"*
>
> **What they're really asking:** Classes are sugar. `Dog.prototype.__proto__ === Animal.prototype`. And yes, the instance will see the new method because prototype lookup is *live* — it walks the chain at call time, not at creation time.

---

## Week 5 — Arrays, Iterators, and Functional Programming

###  Theme
**Stop Writing `for` Loops — Think in Transformations**

###  Core Concepts

1. **Array Methods Deep Dive** — `map`, `filter`, `reduce`, `find`, `some`, `every`, `flat`, `flatMap`.
2. **Immutability Patterns** — Why not to mutate; spread operator, `structuredClone()`, `Object.freeze()`.
3. **Method Chaining** — Composing transformations fluently.
4. **The Iterator Protocol** — `Symbol.iterator`, `next()`, `{ value, done }`.
5. **Generators** — `function*`, `yield`; lazy evaluation and infinite sequences.
6. **Destructuring** — Arrays, objects, nested, defaults, renaming, rest.
7. **Spread & Rest Operators** — `...` in arrays, objects, function parameters.

###  Under the Hood

**How `reduce` works internally (simplified):**

```js
// Your call:
[1, 2, 3].reduce((acc, cur) => acc + cur, 0);

// What the engine does (conceptually):
function reduce(array, callback, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;

  if (accumulator === undefined) {
    accumulator = array[0]; // first element becomes initial value
    startIndex = 1;
  }

  for (let i = startIndex; i < array.length; i++) {
    accumulator = callback(accumulator, array[i], i, array);
  }

  return accumulator;
}
```

**The Iterator Protocol:**

Any object is iterable if it has a `[Symbol.iterator]()` method that returns an object with a `next()` method. `for...of`, spread, and destructuring all use this protocol.

```
const iterable = {
  [Symbol.iterator]() {           // Called once to get the iterator
    let i = 0;
    return {
      next() {                    // Called repeatedly
        return i < 3
          ? { value: i++, done: false }
          : { value: undefined, done: true };
      }
    };
  }
};

for (const val of iterable) { }  // Uses Symbol.iterator under the hood
[...iterable]                    // Also uses Symbol.iterator
const [a, b] = iterable;        // Also uses Symbol.iterator
```

**Generators & Lazy Evaluation:**

Generators pause execution at each `yield`. V8 saves the function's *entire execution context* (like a snapshot) and resumes it on the next `next()` call. This enables memory-efficient processing of infinite or very large data sets.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Array.prototype.reduce"`, `"Iteration protocols"`, `"Destructuring assignment"`, `"Generator"` |
| JavaScript.info | `"Array methods"`, `"Iterables"`, `"Generators"`, `"Destructuring assignment"` |
| YouTube | `"JavaScript reduce mastery"`, `"Generators and Iterators"`, `"Functional JS programming"` |

###  Daily Practice Drill

**Day 1:** Rewrite 5 `for` loops as `map`/`filter`/`reduce` chains. No mutations allowed.

**Day 2:** Implement your own `myMap`, `myFilter`, and `myReduce` on `Array.prototype`.

**Day 3:** Write a custom iterable object (e.g., a `Range(start, end, step)`). Use it with `for...of` and spread.

**Day 4:** Write a generator `function* fibonacci()` that yields the infinite Fibonacci sequence. Use it to get the first 50 numbers.

**Day 5:** Practice complex destructuring: nested objects, renaming, defaults, combining rest with destructuring.

### ️ Weekly Milestone Project

**Build: A Data Transformation Pipeline Library**

Create a `Pipeline` class that processes data functionally:

```js
const result = Pipeline.from(salesData)
  .filter(sale => sale.status === "completed")
  .groupBy("region")
  .mapValues(sales => ({
    totalRevenue: sales.reduce((sum, s) => sum + s.amount, 0),
    count: sales.length,
    avgSale: sales.reduce((sum, s) => sum + s.amount, 0) / sales.length,
  }))
  .sortBy("totalRevenue", "desc")
  .take(5)
  .toArray();
```

- All operations must be immutable (no mutation of original data).
- Implement `groupBy`, `sortBy`, `mapValues`, `take`, `unique` as chainable methods.
- **Bonus:** Make it lazy using generators — transformations execute only when `.toArray()` is called.

###  Senior Interview Question

> **Q:** *"What is the difference between `[...obj]` and `Object.keys(obj).map(...)`? Can you make a plain object spreadable into an array? How?"*
>
> **What they're really asking:** Spread into an array uses `Symbol.iterator`. Plain objects are not iterable by default (they don't have `Symbol.iterator`). You can add one. `Object.keys()` just reads enumerable own property names — it's a different mechanism entirely.

---

## Week 6 — Error Handling, Modules, and Code Organization

###  Theme
**Write Code That Fails Gracefully and Scales Cleanly**

###  Core Concepts

1. **Error Types** — `Error`, `TypeError`, `ReferenceError`, `RangeError`, `SyntaxError`; custom errors with `extends`.
2. **`try...catch...finally`** — Control flow, error propagation, and the cost of try-catch.
3. **Defensive Programming** — Guard clauses, input validation, fail-fast philosophy.
4. **ES Modules** — `import`/`export`, named vs default, dynamic `import()`, circular dependencies.
5. **Module Patterns** — Revealing module pattern, namespace pattern, barrel files.
6. **Code Organization** — Feature-based vs layer-based folder structures.
7. **`Symbol`** — Creating unique identifiers; well-known symbols (`Symbol.iterator`, `Symbol.toPrimitive`).

###  Under the Hood

**ES Module loading (3 phases):**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. CONSTRUCTION │────▶│  2. INSTANTIATION│────▶│  3. EVALUATION   │
│                  │     │                  │     │                  │
│ - Parse the code │     │ - Create module  │     │ - Execute the    │
│ - Resolve imports│     │   scope/bindings │     │   module code    │
│ - Fetch modules  │     │ - Link imports   │     │ - Fill in values │
│ - Build module   │     │   to exports     │     │                  │
│   graph          │     │   (live bindings)│     │                  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key insight — Live Bindings:** ES Module imports are *not copies*. They are *live read-only references* to the exported variable. If the exporting module changes the value, the importing module sees the change.

```js
// counter.js
export let count = 0;
export function increment() { count++; }

// main.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1 ← Live binding! Not a copy.
```

**Error objects and stack traces:**

When you `throw new Error("msg")`, V8 captures the call stack at the point of creation (not throw). The `.stack` property is a non-standard but universally supported string showing the chain of function calls.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Modules"`, `"import"`, `"Error"`, `"Symbol"` |
| JavaScript.info | `"Modules introduction"`, `"Export and Import"`, `"Error handling"`, `"Custom errors"` |
| YouTube | `"ES Modules explained"`, `"JavaScript error handling best practices"`, `"JS Symbols explained"` |

###  Daily Practice Drill

**Day 1:** Create a custom `ValidationError` class with a `field` and `constraint` property. Use it in a validation function.

**Day 2:** Refactor a monolithic 200-line file into ES Modules with clear imports/exports. Practice named and default exports.

**Day 3:** Write a `trySafe(fn)` wrapper that returns `{ success: true, data }` or `{ success: false, error }` (like Rust's `Result` type).

**Day 4:** Create an object that uses `Symbol.toPrimitive` to control how it converts to string, number, and default.

**Day 5:** Implement dynamic `import()` — lazy-load a module only when a condition is met. Handle the Promise.

### ️ Weekly Milestone Project

**Build: A Plugin-Based Logger System**

Create a logging library with a modular architecture:

```js
import { Logger } from './logger/index.js';
import { ConsoleTransport } from './logger/transports/console.js';
import { FileTransport } from './logger/transports/file.js';
import { JsonFormatter } from './logger/formatters/json.js';

const logger = new Logger({
  level: "debug",
  transports: [
    new ConsoleTransport({ formatter: new JsonFormatter() }),
    new FileTransport({ path: "./app.log", maxSize: "10MB" }),
  ],
});

logger.info("Server started", { port: 3000 });
logger.error("DB connection failed", { error: new DatabaseError("timeout") });
```

- Organize as ES Modules: `/logger/core.js`, `/logger/transports/`, `/logger/formatters/`.
- Custom error classes: `LoggerConfigError`, `TransportError`.
- Log levels with numeric priority: `debug(0) < info(1) < warn(2) < error(3)`.
- Use `Symbol` for private internal properties.

###  Senior Interview Question

> **Q:** *"Explain the difference between CommonJS `require()` and ES Module `import`. What are 'live bindings', and why does this distinction matter when you have circular dependencies?"*
>
> **What they're really asking:** CJS copies values at require-time (snapshot). ESM creates live references. In circular deps, CJS might see `undefined` for not-yet-executed exports, while ESM's live bindings will eventually resolve correctly once both modules finish executing.

---

# Phase 3: The DOM, Web APIs, and Asynchronous JavaScript

> *"React abstracts the DOM. But to truly understand React, you must first understand what it's abstracting."*

---

## Week 7 — The DOM, Events, and Browser Rendering

###  Theme
**The DOM Is Not HTML — It's a Living Tree of Objects**

###  Core Concepts

1. **The DOM Tree** — How HTML becomes a tree of `Node` objects; `document`, `Element`, `Text` nodes.
2. **DOM Traversal & Manipulation** — `querySelector`, `createElement`, `append`, `remove`, `cloneNode`.
3. **Event Handling** — `addEventListener`, event object, `preventDefault`, `stopPropagation`.
4. **Event Bubbling & Capturing** — The three phases; how to leverage them.
5. **Event Delegation** — Attaching one listener to a parent instead of N listeners to children.
6. **The Critical Rendering Path** — HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite.
7. **Reflow vs Repaint** — What triggers each; how to batch DOM reads/writes for performance.

###  Under the Hood

**The Critical Rendering Path:**

```
HTML bytes → Characters → Tokens → Nodes → DOM Tree
                                                  ↘
                                               Render Tree → Layout → Paint → Composite → Pixels
                                                  ↗
CSS bytes  → Characters → Tokens → Nodes → CSSOM Tree
```

**Why DOM manipulation is "slow":**

The DOM itself is fast. What's slow is that DOM changes trigger the rendering pipeline:
- **Reflow (Layout):** Recalculates geometry of elements. Triggered by: changing `width`, `height`, `margin`, `padding`, `display`, reading `offsetHeight`.
- **Repaint:** Redraws pixels. Triggered by: changing `color`, `background`, `visibility`.
- **Composite:** Moves already-painted layers. Cheap. Triggered by: `transform`, `opacity`.

**Layout Thrashing (the silent performance killer):**

```js
// ❌ BAD — Forces reflow on every iteration
for (let i = 0; i < 1000; i++) {
  element.style.width = element.offsetWidth + 1 + "px"; // READ then WRITE
}

// ✅ GOOD — Batch reads, then batch writes
const width = element.offsetWidth; // READ once
for (let i = 0; i < 1000; i++) {
  element.style.width = width + i + "px"; // WRITE only
}
```

**Event Propagation:**

```
                    ┌─ CAPTURING PHASE ─┐
                    │     (top-down)     │
                    ▼                    │
┌─ window ──────────────────────────────┐
│  ┌─ document ──────────────────────┐  │
│  │  ┌─ <html> ──────────────────┐  │  │
│  │  │  ┌─ <body> ────────────┐  │  │  │
│  │  │  │  ┌─ <div> ───────┐  │  │  │  │
│  │  │  │  │  ┌─ <button> ┐│  │  │  │  │
│  │  │  │  │  │  (TARGET)  ││  │  │  │  │
│  │  │  │  │  └────────────┘│  │  │  │  │
│  │  │  │  └────────────────┘  │  │  │  │
│  │  │  └──────────────────────┘  │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
                    │                    ▲
                    │  BUBBLING PHASE    │
                    └─── (bottom-up) ────┘
```

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Introduction to the DOM"`, `"Event bubbling"`, `"Critical rendering path"` |
| JavaScript.info | `"Browser environment"`, `"DOM tree"`, `"Event delegation"`, `"Browser rendering"` |
| YouTube | `"Browser rendering pipeline"`, `"Event delegation JS"`, `"Layout thrashing"` |

###  Daily Practice Drill

**Day 1:** Build a dynamic list — add, remove, and reorder `<li>` elements using only JS DOM APIs. No `innerHTML`.

**Day 2:** Implement event delegation: one listener on a `<ul>` that handles clicks on any `<li>`, including dynamically added ones.

**Day 3:** Build a form with real-time validation using `input`, `focus`, and `blur` events. Show errors without page reload.

**Day 4:** Create a function that measures reflows. Use `performance.now()` to compare 100 individual style changes vs one batched change.

**Day 5:** Implement keyboard navigation (arrow keys, Enter, Escape) for a custom dropdown using `keydown` events.

### ️ Weekly Milestone Project

**Build: A Virtual Scrolling List (renders 10,000 items smoothly)**

Create a list that renders 10,000 items but only keeps ~30 DOM nodes alive at any time:

- Calculate which items are visible based on scroll position.
- Recycle DOM nodes: instead of creating/destroying, reposition and update content.
- Use event delegation for click handling on items.
- Add smooth scrolling and a scrollbar indicator.
- Measure performance: log render time, DOM node count, and memory usage.

This is exactly what React's virtualization libraries (`react-window`) do under the hood.

###  Senior Interview Question

> **Q:** *"You have a list of 10,000 items, each with a delete button. How would you handle the click events, and why? What happens to event listeners when you remove a DOM node?"*
>
> **What they're really asking:** Event delegation — one listener on the parent. When a DOM node is removed, its listeners are eligible for GC *if* no other references exist. If you stored a reference to the node (e.g., in an array), the listener persists in memory — a common source of memory leaks.

---

## Week 8 — Promises, Async/Await, and the Event Loop

###  Theme
**JavaScript Doesn't Wait — It Schedules**

###  Core Concepts

1. **The Event Loop** — Call stack, Web APIs, Callback Queue, Microtask Queue.
2. **Microtasks vs Macrotasks** — Promise callbacks vs `setTimeout`; execution order.
3. **Promises** — States (pending/fulfilled/rejected), chaining, `Promise.all`, `Promise.race`, `Promise.allSettled`, `Promise.any`.
4. **Async/Await** — Syntactic sugar over Promises; error handling with try/catch.
5. **Callback Hell & Inversion of Control** — Why Promises were invented.
6. **`setTimeout` / `setInterval` / `requestAnimationFrame`** — Timer APIs and their precision.
7. **Error Handling in Async Code** — Unhandled rejections, `.catch()` placement, global handlers.

###  Under the Hood

**The Event Loop — Step by Step:**

```
┌──────────────────────────────────────────────────────┐
│                    CALL STACK                         │
│  (executes synchronous code, one frame at a time)    │
└───────────────────────┬──────────────────────────────┘
                        │ When stack is empty,
                        │ check queues:
                        ▼
         ┌──────────────────────────────┐
         │  1. MICROTASK QUEUE (first!) │ ← Promise.then, queueMicrotask,
         │     Drain ALL microtasks     │   MutationObserver
         └──────────────┬───────────────┘
                        │ Only when microtask
                        │ queue is empty:
                        ▼
         ┌──────────────────────────────┐
         │  2. MACROTASK QUEUE (one!)   │ ← setTimeout, setInterval,
         │     Execute ONE macrotask    │   I/O callbacks, UI rendering
         └──────────────┬───────────────┘
                        │
                        │ After one macrotask,
                        │ go back to microtasks
                        ▼
                   (repeat forever)
```

**Critical rule:** Microtasks are *drained completely* before the next macrotask or render. This is why a `Promise.resolve().then(...)` inside a `setTimeout` runs *before* the next `setTimeout`:

```js
setTimeout(() => console.log("1: macrotask"), 0);
Promise.resolve().then(() => console.log("2: microtask"));
console.log("3: synchronous");

// Output: 3 → 2 → 1
```

**`async/await` desugaring:**

```js
async function fetchUser() {
  const response = await fetch("/api/user");  // PAUSE here
  const user = await response.json();          // PAUSE here
  return user;
}

// The engine transforms this roughly into:
function fetchUser() {
  return fetch("/api/user")
    .then(response => response.json())
    .then(user => user);
}
```

When `await` is hit, the function's execution context is *suspended* (not popped). The remaining code becomes a microtask scheduled for when the awaited Promise resolves.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Event loop"`, `"Using Promises"`, `"async function"`, `"Microtask guide"` |
| JavaScript.info | `"Event loop microtasks macrotasks"`, `"Promise chaining"`, `"Async/await"` |
| YouTube | `"What the heck is the event loop Philip Roberts"`, `"Jake Archibald event loop"`, `"JavaScript Visualized Promises"` |
| Tool | [JS Visualizer 9000](https://www.jsv9000.app/) — interactive event loop visualization |

###  Daily Practice Drill

**Day 1:** Write 10 event loop puzzles mixing `setTimeout`, `Promise.then`, `queueMicrotask`, and synchronous code. Predict the output order.

**Day 2:** Implement `myPromise` — a Promise class from scratch with `then`, `catch`, `finally`. Handle chaining.

**Day 3:** Write `promiseAll(promises)` that mirrors `Promise.all`. Then write `promiseAllSettled`.

**Day 4:** Convert a callback-based API (like `fs.readFile`) into a Promise-based one. Then use async/await.

**Day 5:** Write code that demonstrates a microtask loop (infinite microtasks blocking the macrotask queue). Then fix it.

### ️ Weekly Milestone Project

**Build: An Async Task Queue with Concurrency Control**

```js
const queue = new AsyncQueue({ concurrency: 3 });

queue.add(async () => { /* task 1 */ });
queue.add(async () => { /* task 2 */ });
// ...add 50 tasks

queue.onProgress(({ completed, total, percent }) => {
  console.log(`${percent}% complete`);
});

await queue.run();
// At most 3 tasks run concurrently. As one finishes, the next starts.
```

Features:
- Configurable concurrency limit.
- `pause()`, `resume()`, `clear()` controls.
- Retry logic: failed tasks retry up to N times with exponential backoff.
- `onProgress` callback for tracking.
- Error handling: don't let one failed task kill the entire queue.

###  Senior Interview Question

> **Q:** *"If I put a `Promise.resolve().then(...)` inside a `setTimeout` callback, and another `setTimeout` was already queued, which runs first? Draw the event loop execution."*
>
> **What they're really asking:** The microtask (`.then`) runs immediately after the current macrotask (`setTimeout` callback) finishes, *before* the next macrotask. So: `setTimeout1 starts → .then runs (microtask) → setTimeout1 done → setTimeout2 runs`.

---

## Week 9 — Fetch, Web APIs, and Real-World Async Patterns

###  Theme
**Connecting Your App to the Outside World**

###  Core Concepts

1. **`fetch` API** — GET, POST, headers, JSON, error handling (fetch doesn't reject on 404!).
2. **`AbortController`** — Canceling requests; timeouts; cleaning up on unmount (React prep).
3. **`localStorage` / `sessionStorage` / `IndexedDB`** — Client-side persistence and their limits.
4. **`Web Workers`** — Running JS off the main thread; `postMessage` communication.
5. **`IntersectionObserver`** — Lazy loading images, infinite scroll, scroll-triggered animations.
6. **`MutationObserver`** — Watching for DOM changes (used internally by many frameworks).
7. **Debounce & Throttle** — Controlling high-frequency events (scroll, resize, keypress).

###  Under the Hood

**Why `fetch` doesn't reject on HTTP errors:**

`fetch` only rejects on *network failures* (DNS error, offline, CORS block). A 404 or 500 response is a *successful HTTP response* — the server responded! You must check `response.ok` or `response.status` manually.

```js
// ❌ Common mistake — this won't catch 404
try {
  const res = await fetch("/api/user/999");
  const data = await res.json(); // Might fail if response isn't JSON
} catch (e) { /* Only catches network errors */ }

// ✅ Correct pattern
const res = await fetch("/api/user/999");
if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
const data = await res.json();
```

**Web Workers & the Thread Model:**

```
┌─── MAIN THREAD ──────────────┐     ┌─── WORKER THREAD ────────────┐
│                               │     │                               │
│  - DOM access ✅              │     │  - DOM access ❌              │
│  - UI rendering ✅            │     │  - Heavy computation ✅       │
│  - Event handling ✅          │     │  - Own event loop ✅          │
│                               │     │                               │
│  worker.postMessage(data) ───┼────▶│  self.onmessage = (e) => {}  │
│  worker.onmessage = (e) => {}│◀────┼── self.postMessage(result)   │
│                               │     │                               │
└───────────────────────────────┘     └───────────────────────────────┘
          ↕ Messages are COPIED (structured clone), not shared
```

**`AbortController` — How cancellation works:**

`AbortController` creates an `AbortSignal`. When you call `controller.abort()`, the signal fires an `abort` event. `fetch` listens for this event and rejects with an `AbortError`. This is the same pattern React uses for cleanup in `useEffect`.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Fetch API"`, `"AbortController"`, `"Web Workers API"`, `"IntersectionObserver"` |
| JavaScript.info | `"Fetch"`, `"Fetch: Abort"`, `"Debounce and Throttle"` |
| YouTube | `"Fetch API JavaScript"`, `"Web Workers crash course"`, `"Intersection Observer lazy load"` |

###  Daily Practice Drill

**Day 1:** Build a `fetchWithTimeout(url, options, timeoutMs)` function using `AbortController`. Handle all error cases.

**Day 2:** Implement `debounce(fn, delay)` and `throttle(fn, interval)` from scratch. Test with a search input.

**Day 3:** Use `IntersectionObserver` to lazy-load 50 images — only load `src` when the image enters the viewport.

**Day 4:** Create a Web Worker that sorts a massive array (1M numbers). Compare UI responsiveness vs doing it on the main thread.

**Day 5:** Build a `localStorage` wrapper with expiry: `store.set("key", value, ttlMs)`, `store.get("key")` returns `null` if expired.

### ️ Weekly Milestone Project

**Build: A GitHub Repository Explorer**

A single-page app (no frameworks) that:

- Has a search input with **debounced** API calls to GitHub's public API (`api.github.com`).
- Shows results in a **virtualized list** (reuse Week 7's technique).
- Each result card shows: repo name, stars, description, language.
- Clicking a card expands it (fetches additional data: contributors, recent commits).
- **Infinite scroll** using `IntersectionObserver` for pagination.
- **AbortController** cancels in-flight requests when the user types a new query.
- Loading states, error states, and empty states — all handled gracefully.
- Store recent searches in `localStorage`.

###  Senior Interview Question

> **Q:** *"In a React `useEffect`, why do we return a cleanup function that calls `controller.abort()`? What would happen if we didn't?"*
>
> **What they're really asking:** Without cleanup, navigating away would leave the `fetch` in-flight. When it resolves, it would try to update state on an unmounted component — causing a memory leak and the classic "Can't perform a React state update on an unmounted component" warning. `AbortController` cancels the request, preventing this.

---

# Phase 4: Advanced Patterns, Tooling, and React-Readiness

> *"You're not learning React. You're learning the JavaScript that powers React."*

---

## Week 10 — Design Patterns and Architecture

###  Theme
**Write Code That Other Developers Thank You For**

###  Core Concepts

1. **The Module Pattern** — Encapsulation via closures and ES Modules.
2. **Observer Pattern (Pub/Sub)** — Decoupled communication (this is how React state updates work).
3. **Factory Pattern** — Creating objects without `new`; dynamic object creation.
4. **Strategy Pattern** — Swapping algorithms at runtime; replace if/else chains.
5. **Proxy & Reflect** — Intercepting object operations; reactive data (Vue.js uses this!).
6. **Composition over Inheritance** — Mixins, `Object.assign()`, compose functions.
7. **State Machines** — Managing complex UI state transitions predictably.

###  Under the Hood

**Proxy — How reactivity works:**

```js
const handler = {
  get(target, property, receiver) {
    console.log(`Reading "${property}"`);
    track(target, property);  // ← This is how Vue tracks dependencies
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    console.log(`Setting "${property}" to ${value}`);
    const result = Reflect.set(target, property, value, receiver);
    trigger(target, property); // ← This is how Vue triggers re-renders
    return result;
  }
};

const state = new Proxy({ count: 0 }, handler);
state.count; // Logs: Reading "count"
state.count = 1; // Logs: Setting "count" to 1
```

**Observer Pattern — The foundation of React's setState:**

```
┌───── Subject (Store) ─────┐
│                            │
│  state: { count: 0 }      │
│  listeners: [fn1, fn2]    │
│                            │
│  subscribe(fn) → adds fn  │
│  notify() → calls all fns │
│  setState(newState) {     │
│    this.state = newState; │
│    this.notify();         │ ──── ▶  fn1(state) → re-render component A
│  }                         │ ──── ▶  fn2(state) → re-render component B
└────────────────────────────┘
```

This is essentially what `useState` and `useReducer` do internally. When you call `setState`, React's reconciler is *notified*, and it schedules a re-render.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Proxy"`, `"Reflect"` |
| JavaScript.info | `"Proxy and Reflect"`, `"Patterns"` |
| YouTube | `"JavaScript design patterns"`, `"Proxy reactive JS"`, `"Observer pattern JavaScript"` |
| Book | *"Learning JavaScript Design Patterns"* by Addy Osmani (free online) |

###  Daily Practice Drill

**Day 1:** Implement a `createStore(reducer, initialState)` — a mini Redux with `dispatch`, `getState`, and `subscribe`.

**Day 2:** Build an `EventEmitter` class with `on`, `off`, `emit`, and `once` methods.

**Day 3:** Use `Proxy` to create a "reactive" object that auto-logs every property access and mutation.

**Day 4:** Refactor a function with 10+ `if/else` branches using the Strategy pattern.

**Day 5:** Build a simple state machine for a traffic light: `green → yellow → red → green`.

### ️ Weekly Milestone Project

**Build: A Reactive State Management Library (mini MobX/Redux)**

```js
const store = createReactiveStore({
  state: { todos: [], filter: "all" },
  actions: {
    addTodo(state, text) { state.todos.push({ id: Date.now(), text, done: false }); },
    toggleTodo(state, id) { /* ... */ },
    setFilter(state, filter) { state.filter = filter; },
  },
  getters: {
    filteredTodos(state) { /* computed based on filter */ },
    completedCount(state) { return state.todos.filter(t => t.done).length; },
  },
});

// Auto-reacts to changes:
store.subscribe(["todos"], (newTodos) => renderTodoList(newTodos));
store.dispatch("addTodo", "Learn Proxy");
```

Features:
- `Proxy`-based reactivity: automatically detect mutations.
- Selective subscriptions: only notify listeners interested in changed properties.
- Computed getters that cache and invalidate automatically.
- Action middleware support (e.g., logging, async action handling).
- Time-travel debugging: store snapshots of state after each action.

###  Senior Interview Question

> **Q:** *"Explain how you would implement a reactive system where changing a property on an object automatically updates all parts of the UI that depend on it — without manually calling 'update'. How do frameworks like Vue and MobX do this?"*
>
> **What they're really asking:** Dependency tracking via `Proxy` `get` traps (track which components read which properties) and `set` traps (notify only those components when properties change). This is fine-grained reactivity, as opposed to React's coarse-grained "re-render everything and diff" approach.

---

## Week 11 — Performance, Testing, and Tooling

###  Theme
**Production-Grade JavaScript: It's Not Done Until It's Fast, Tested, and Debuggable**

###  Core Concepts

1. **Performance Profiling** — Chrome DevTools Performance tab, `performance.now()`, `performance.mark/measure`.
2. **Memory Leaks** — Identifying with Heap Snapshots; common causes (closures, detached DOM, timers).
3. **`WeakMap` & `WeakSet`** — Weak references that don't prevent garbage collection.
4. **Unit Testing Fundamentals** — Writing tests without a framework; assertion patterns; test structure.
5. **Bundling & Tree Shaking** — How bundlers (Vite/esbuild) analyze `import`/`export` to eliminate dead code.
6. **Source Maps** — Mapping minified code back to source; `//# sourceMappingURL`.
7. **`requestIdleCallback` & Scheduling** — Running non-critical work during idle periods (React's Scheduler uses this concept).

###  Under the Hood

**WeakMap — Why React uses it internally:**

```
Map:                                    WeakMap:
┌─────────────┐                        ┌─────────────┐
│ key ──▶ obj │  Strong reference.     │ key ~~▶ obj │  Weak reference.
│             │  obj can't be GC'd     │             │  obj CAN be GC'd
│             │  even if nothing else  │             │  if no other refs
│             │  references it.        │             │  exist.
└─────────────┘                        └─────────────┘
```

Use cases:
- Caching computed data for DOM elements without preventing their GC.
- Private data associated with class instances.
- React uses `WeakMap`-like structures to associate Fiber nodes with DOM elements.

**Tree Shaking — How ES Modules enable dead code elimination:**

```js
// math.js
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }  // Not imported anywhere

// app.js
import { add } from './math.js';  // Only imports `add`
```

Because ES Modules have *static* structure (imports/exports are determined at parse time, not runtime), bundlers can analyze the dependency graph and *eliminate* `multiply` from the final bundle. This is impossible with CommonJS `require()` because it's dynamic.

**`requestIdleCallback` — The inspiration for React's Concurrent Mode:**

```js
// Run non-critical work when the browser is idle
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    performTask(tasks.shift());
  }
  if (tasks.length > 0) {
    requestIdleCallback(performNextBatch); // Schedule more
  }
});
```

React's Fiber architecture breaks rendering into small chunks and yields back to the browser between chunks — allowing user interactions to interrupt long renders.

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"WeakMap"`, `"Performance API"`, `"requestIdleCallback"` |
| JavaScript.info | `"WeakMap and WeakSet"`, `"Garbage collection"` |
| YouTube | `"Chrome DevTools memory leak"`, `"Tree shaking explained"`, `"requestIdleCallback"` |
| Tool | Chrome DevTools → Performance tab, Memory tab |

###  Daily Practice Drill

**Day 1:** Use Chrome DevTools to profile a page load. Identify the longest task. Optimize it.

**Day 2:** Create a memory leak on purpose (event listener on removed DOM node). Find it with Heap Snapshots. Fix it.

**Day 3:** Write a `WeakMap`-based cache: `memoizeWeak(fn)` that caches results keyed by object arguments.

**Day 4:** Write a mini test runner: `describe`, `it`, `expect(value).toBe(expected)`, `expect(value).toThrow()`.

**Day 5:** Take a project from a previous week and use `requestIdleCallback` to defer non-critical initialization.

### ️ Weekly Milestone Project

**Build: A Performance Monitoring Dashboard**

Create a tool that monitors and visualizes your app's performance:

```js
const monitor = new PerfMonitor({
  metrics: ["fps", "memory", "longTasks", "domNodes"],
  sampleRate: 1000, // ms
});

monitor.start();
monitor.onReport((data) => renderDashboard(data));
```

Features:
- **FPS Counter:** Use `requestAnimationFrame` to measure actual frame rate.
- **Memory Usage:** Use `performance.memory` (Chrome) to track heap size over time.
- **Long Task Detection:** Use `PerformanceObserver` with `"longtask"` type.
- **DOM Node Counter:** Periodically count `document.querySelectorAll("*").length`.
- **Visualization:** Render a live-updating chart (use `<canvas>`) showing metrics over time.
- **Alerts:** Warn when FPS drops below 30 or memory grows consistently.

###  Senior Interview Question

> **Q:** *"You've deployed an app and users report it gets slower over time. Walk me through your debugging process, from opening DevTools to identifying the root cause."*
>
> **What they're really asking:** Performance tab → record session → look for long tasks. Memory tab → take heap snapshots at T=0 and T=60s → compare → look for growing retained size. Check for: detached DOM trees, growing arrays/maps, uncleared `setInterval`, event listeners on removed elements. Use `WeakMap`/`WeakRef` for caches.

---

## Week 12 — React-Readiness: The JavaScript Behind React

###  Theme
**Everything React Does Is Vanilla JavaScript — Now Prove It**

###  Core Concepts

1. **JSX Is Just Function Calls** — `<Comp />` → `React.createElement(Comp, props, children)`.
2. **Virtual DOM Concept** — Representing UI as plain JS objects; diffing two trees.
3. **Reconciliation (Diffing Algorithm)** — How React decides what to update.
4. **Hooks as Closures** — `useState` is a closure over a state array with an index cursor.
5. **Immutable State Updates** — Why `setState({...state, key: value})` instead of `state.key = value`.
6. **Component as a Function** — A function that takes `props` and returns a description of UI.
7. **Declarative vs Imperative** — Describing *what* the UI should look like, not *how* to update it.

###  Under the Hood

**JSX → JavaScript:**

```jsx
// What you write:
<div className="card">
  <h1>{title}</h1>
  <Button onClick={handleClick}>Submit</Button>
</div>

// What the compiler produces:
createElement("div", { className: "card" },
  createElement("h1", null, title),
  createElement(Button, { onClick: handleClick }, "Submit")
);

// What createElement returns (Virtual DOM node):
{
  type: "div",
  props: {
    className: "card",
    children: [
      { type: "h1", props: { children: title } },
      { type: Button, props: { onClick: handleClick, children: "Submit" } }
    ]
  }
}
```

**Simplified `useState` implementation:**

```js
// React stores hooks in an array, using an index cursor
let hooks = [];
let currentHook = 0;

function useState(initialValue) {
  const hookIndex = currentHook; // Closure captures the current index

  if (hooks[hookIndex] === undefined) {
    hooks[hookIndex] = initialValue; // First render: initialize
  }

  const setState = (newValue) => {
    hooks[hookIndex] = newValue; // Update the value at this index
    render(); // Trigger re-render
  };

  currentHook++; // Move cursor to next hook
  return [hooks[hookIndex], setState];
}

function render() {
  currentHook = 0; // Reset cursor before each render
  App(); // Re-execute the component function
}
```

This is why **hooks must be called in the same order every render** — they rely on array indices. Calling hooks conditionally would shift the indices and break the mapping.

**Virtual DOM diffing (simplified):**

```
OLD VDOM:                          NEW VDOM:
{ type: "div",                     { type: "div",
  children: [                        children: [
    { type: "h1", text: "Hello" }    { type: "h1", text: "Hello" }  ← Same, skip
    { type: "p", text: "World" }     { type: "p", text: "React" }  ← Changed! Update DOM
    { type: "span", text: "!" }    ]                                ← Removed! Delete from DOM
  ]
}

Patches to apply:
  1. Update <p> textContent from "World" to "React"
  2. Remove <span> from DOM
```

###  Learning Resources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Document.createDocumentFragment"`, `"TreeWalker"` |
| JavaScript.info | Review all previous topics — they all converge here |
| YouTube | `"Build your own React"`, `"useState under the hood"`, `"Virtual DOM from scratch"` |
| Article | `"Build your own React"` by Rodrigo Pombo (pomb.us) — incredible step-by-step guide |

###  Daily Practice Drill

**Day 1:** Write a `createElement(type, props, ...children)` function that returns a Virtual DOM object.

**Day 2:** Write a `render(vdom, container)` function that takes a VDOM tree and creates real DOM nodes.

**Day 3:** Write a `diff(oldTree, newTree)` function that returns an array of patches (add, remove, update).

**Day 4:** Implement a simple `useState` using closures and an array. Build a counter component with it.

**Day 5:** Combine days 1-4: build a mini rendering engine that re-renders only what changed.

### ️ Weekly Milestone Project

**Build: A Mini React Clone (the capstone)**

Build a simplified version of React's core:

```js
/** @jsx createElement */

function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  return createElement("div", { className: "app" },
    createElement("h1", null, `Count: ${count}`),
    createElement("button", { onClick: () => setCount(count + 1) }, "Increment"),
    createElement("input", {
      value: text,
      onInput: (e) => setText(e.target.value)
    }),
    createElement("p", null, `You typed: ${text}`)
  );
}

MiniReact.render(createElement(App), document.getElementById("root"));
```

Implement:
1. **`createElement()`** — Returns VDOM objects.
2. **`render(vdom, container)`** — Mounts VDOM to real DOM.
3. **`diff(oldVdom, newVdom)`** — Computes minimal changes.
4. **`patch(dom, patches)`** — Applies changes to real DOM.
5. **`useState(initial)`** — Hooks with closure-based state management.
6. **`useEffect(fn, deps)`** — Side effect handling with dependency comparison.
7. **Event delegation** — One listener on the root, dispatching to VDOM handlers.

This project proves you understand every concept from the entire 12 weeks. When you open React's source code after this, you'll recognize the patterns.

###  Senior Interview Question

> **Q:** *"React says 'don't mutate state.' But JavaScript objects ARE mutable. What problem does immutability solve in React's rendering model, and how would you explain the connection between immutability and React's performance optimization (React.memo / shouldComponentUpdate)?"*
>
> **What they're really asking:** React uses reference equality (`===`) to determine if state changed. `oldState === newState` → skip re-render. If you mutate, the reference doesn't change, so React *misses the update*. Immutable updates create new references, making change detection O(1) instead of deep comparison O(n). This is why `useState` requires a new object/array.

---

# [stats] Weekly Tracking Template

Copy this template each week to track your progress:

```markdown
## Week [N] - [Theme]

### Concepts Studied
- [ ] Concept 1
- [ ] Concept 2
- [ ] ...

### Daily Drills Completed
- [ ] Monday
- [ ] Tuesday
- [ ] Wednesday
- [ ] Thursday
- [ ] Friday

### Under the Hood
- [ ] Read the engine/memory explanation
- [ ] Can explain it in my own words

### Milestone Project
- [ ] Core functionality
- [ ] Edge cases handled
- [ ] Code is clean and well-organized

### Interview Question
- [ ] Can answer confidently
- [ ] Can draw a diagram to explain

### Confidence Level: ___/10
### Notes: ___
```

---

#  After Week 12: Your React Transition

By now, you should be able to:

| Skill | How You Know It |
|-------|-----------------|
| Read any JS code | You can trace execution context, scope chain, and `this` binding mentally |
| Debug memory issues | You can find leaks with DevTools and explain GC |
| Write functional code | You default to `map`/`filter`/`reduce`, immutability, and pure functions |
| Understand React's "magic" | You know JSX is `createElement`, hooks are closures, VDOM is plain objects |
| Ace interviews | You can explain the *why*, not just the *what* |

> [!IMPORTANT]
> **Your next step:** Start React with the official docs (react.dev). You'll be shocked at how much makes sense now. Every concept — components, hooks, state, effects, refs — maps directly to what you've built in vanilla JS.

---

*"The best React developer is not the one who knows React's API. It's the one who understands the JavaScript underneath it."*
