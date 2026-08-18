# Week 1 — The JavaScript Engine & Execution Model

# The Complete Deep-Dive Lesson

> **By the end of this lesson you will understand exactly what the JavaScript
> engine does with your code before, during, and after execution — the same
> understanding a V8 engineer or a senior interviewer expects.**

---

## Table of Contents

1. [How JavaScript Runs: The Big Picture](#1-how-javascript-runs-the-big-picture)
2. [Execution Context — The Engine's Workspace](#2-execution-context--the-engines-workspace)
3. [The Call Stack — JavaScript's One Track Mind](#3-the-call-stack--javascripts-one-track-mind)
4. [Hoisting — The Creation Phase Revealed](#4-hoisting--the-creation-phase-revealed)
5. [The Temporal Dead Zone (TDZ)](#5-the-temporal-dead-zone-tdz)
6. [Scope and the Scope Chain](#6-scope-and-the-scope-chain)
7. [var vs let vs const — The Full Truth](#7-var-vs-let-vs-const--the-full-truth)
8. [Strict Mode](#8-strict-mode)
9. [Exercises](#9-exercises)
10. [Milestone Project](#10-milestone-project)
11. [Sources](#11-sources)

---

## 1. How JavaScript Runs: The Big Picture

When you write JavaScript and run it (in a browser or Node.js), your code goes
through a pipeline inside the engine (V8 in Chrome/Node, SpiderMonkey in
Firefox, JavaScriptCore in Safari).

```
Your Code (.js)
     │
     ▼
┌─────────────┐   Breaks code into tokens: let, x, =, 5, ;
│   PARSER    │   Then builds an Abstract Syntax Tree (AST)
└─────┬───────┘
      │
      ▼
┌─────────────┐   Walks the AST, creates Execution Contexts,
│ INTERPRETER │   generates bytecode, starts executing
│ (Ignition)  │
└─────┬───────┘
      │ If a function is called many times ("hot code")
      ▼
┌─────────────┐   Compiles hot code to optimized machine code
│  COMPILER   │   for maximum speed
│(TurboFan)   │
└─────────────┘
```

You don't need to memorize the compiler pipeline, but you **do** need to
understand what happens in the Interpreter step — that is where Execution
Contexts, hoisting, scope, and the call stack live.

> **Source:**
> - V8 blog on Ignition and TurboFan: https://v8.dev/blog/launching-ignition-and-turbofan
> - "How JavaScript Works" by Alexander Zlatkov: https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf

---

## 2. Execution Context — The Engine's Workspace

### What Is It?

An **Execution Context** (EC) is the environment in which JavaScript code is
evaluated and executed. Think of it as a box that contains:

- All the variables and functions available to the code
- The value of `this`
- A reference to the outer (parent) environment

There are **two** types you will work with:

| Type | Created When | How Many |
|------|-------------|----------|
| **Global Execution Context (GEC)** | Script first loads | Exactly ONE |
| **Function Execution Context (FEC)** | A function is **called** | One per call |

### The Two Phases of an Execution Context

Every EC goes through two phases. This is the **foundation** of understanding
hoisting, TDZ, and scope.

> **Note: Quick Definitions (fully explained later):**
>
> The descriptions and diagram below use three terms you haven't learned
> yet. Here's just enough to follow along — each gets its own deep-dive
> section later:
>
> - **Hoisting** (§4): The engine registers all declarations in memory
>   *before* running any code. It doesn't physically move code — it just
>   means variables and functions are "known" during the Creation Phase.
> - **TDZ — Temporal Dead Zone** (§5): The period between when a
>   `let`/`const` variable is registered in memory and when its declaration
>   line actually runs. During this zone, the variable *exists* but is
>   *not accessible* — trying to use it throws a `ReferenceError`.
> - **Lexical Environment vs Variable Environment**: The engine internally
>   splits an Execution Context into two containers. The **Variable
>   Environment** holds `var` declarations. The **Lexical Environment**
>   holds `let`, `const`, and `function` declarations. They work the same
>   way (storing variables in memory), but are separated because `var`
>   follows different scoping rules than `let`/`const`. For day-to-day
>   coding, you can think of them as one combined "memory space" — the
>   distinction matters when understanding *why* `var` and `let`/`const`
>   behave differently.

#### Phase 1: Creation Phase

The engine scans the code (without executing it) and sets up memory.

What happens during creation:

1. The **Variable Environment** is created:
   - `var` declarations are stored with the value `undefined`.
   - `let` and `const` declarations are stored but marked `<uninitialized>`.
   - `function` declarations are stored with their **entire function body**.

2. The **Scope Chain** is established — a reference to the outer environment.

3. The value of **`this`** is determined.
   - **`this`** is a reference to the "owner" of the currently executing code. It changes depending on how a function is called:
     - **Method Call**: If inside an object (e.g., `user.sayName()`), `this` points to the object (`user`).
     - **Regular Function**: If called standalone (e.g., `greet()`), `this` defaults to the Global Object (`window`), or `undefined` in Strict Mode.
     - **Arrow Functions**: They don't have their own `this`. They inherit it from their surrounding lexical scope.

#### Phase 2: Execution Phase

The engine runs the code line by line, assigning values and calling functions.

### Example: Watching the Two Phases

```js
var name = "Alice";
let age = 25;
const PI = 3.14;

function greet() {
  return "Hello, " + name;
}

var sayBye = function () {
  return "Bye!";
};
```

**What the engine sets up during the CREATION PHASE (before line 1 runs):**

```
┌─────────────── Global Execution Context ───────────────┐
│                                                         │
│  VARIABLE ENVIRONMENT:                                  │
│    name     → undefined           (var: initialized)    │
│    sayBye   → undefined           (var: initialized)    │
│                                                         │
│  LEXICAL ENVIRONMENT:                                   │
│    age      → <uninitialized>     (let: in TDZ)         │
│    PI       → <uninitialized>     (const: in TDZ)       │
│    greet    → function() {...}    (fully hoisted)        │
│                                                         │
│  this       → window (browser) / globalThis (Node)      │
│  outer env  → null (there is nothing above global)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**EXECUTION PHASE — line by line:**

```
Line 1: var name = "Alice"   → name updated: undefined → "Alice"
Line 2: let age = 25         → age initialized: <uninitialized> → 25
Line 3: const PI = 3.14      → PI initialized: <uninitialized> → 3.14
Line 5-7: (function greet)   → already handled in creation, skip
Line 9-11: var sayBye = ...  → sayBye updated: undefined → function(){...}
```

### Function Execution Context

Every time a function is **called**, a brand new execution context is created:

```js
var language = "JavaScript";

function greet(name) {
  var greeting = "Hello";
  return greeting + ", " + name + "! Learning " + language;
}

var message = greet("Alice");
```

When `greet("Alice")` is called:

```
┌───────── Function EC for greet("Alice") ─────────┐
│                                                    │
│  CREATION PHASE:                                   │
│    name     → "Alice"  (parameter, set immediately)│
│    greeting → undefined (var, hoisted)             │
│                                                    │
│  EXECUTION PHASE:                                  │
│    greeting = "Hello"                              │
│    return "Hello, Alice! Learning JavaScript"      │
│                                                    │
│  Scope Chain: greet → Global                       │
│  this: window (non-strict) / undefined (strict)    │
│                                                    │
│  Note: `language` is NOT in this EC.               │
│  The engine follows the scope chain to Global      │
│  and finds language = "JavaScript" there.          │
│                                                    │
└────────────────────────────────────────────────────┘
```

> **Source:**
> - ECMAScript Spec §9.1 "Environment Records": https://tc39.es/ecma262/#sec-environment-records
> - JavaScript.info — "Variable scope, closure": https://javascript.info/closure
> - MDN — "this": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this

---

## 3. The Call Stack — JavaScript's One Track Mind

### What Is It?

The **Call Stack** is a Last-In-First-Out (LIFO) data structure that the engine
uses to track which function is currently executing and what to return to when
it finishes.

JavaScript has **one** call stack. It is **single-threaded** — it can do only
one thing at a time.

### How It Works

- When a function is **called** → its execution context is **pushed** onto the stack.
- When a function **returns** → its execution context is **popped** off the stack.
- The engine always runs whatever is on **top** of the stack.

### Example: Tracing the Call Stack

```js
function multiply(a, b) {
  return a * b;
}

function square(n) {
  return multiply(n, n);
}

function printSquare(n) {
  var result = square(n);
  console.log(result);
}

printSquare(5);
```

**Step-by-step call stack:**

```
Step 1: printSquare(5) called
  Stack: [ Global → printSquare ]

Step 2: square(5) called inside printSquare
  Stack: [ Global → printSquare → square ]

Step 3: multiply(5, 5) called inside square
  Stack: [ Global → printSquare → square → multiply ]
  multiply returns 25

Step 4: multiply finishes, popped
  Stack: [ Global → printSquare → square ]
  square returns 25

Step 5: square finishes, popped
  Stack: [ Global → printSquare ]
  result = 25, console.log(25)

Step 6: printSquare finishes, popped
  Stack: [ Global ]

OUTPUT: 25
```

### Stack Overflow

The call stack has a finite size (usually 10,000–15,000 frames depending on the
environment). If you exceed it, you get a `RangeError`:

```js
function forever() {
  forever(); // no base case → infinite recursion
}
forever();
// [!] RangeError: Maximum call stack size exceeded
```

**Fix: always provide a base case in recursive functions:**

```js
function countdown(n) {
  if (n <= 0) return; // ← BASE CASE: stops the recursion
  console.log(n);
  countdown(n - 1);
}
countdown(5); // 5, 4, 3, 2, 1
```

### Reading Stack Traces — A Critical Debugging Skill

When an error occurs, the browser gives you a **stack trace**. Read it
**bottom to top** — it shows the path of function calls that led to the error.

```js
function fetchUser(id) {
  return getFromDB(id);
}

function getFromDB(id) {
  throw new Error("Connection refused");
}

function main() {
  fetchUser(42);
}

main();
```

```
Error: Connection refused
    at getFromDB (script.js:6)    ← crash site
    at fetchUser (script.js:2)    ← called getFromDB
    at main (script.js:11)        ← called fetchUser
    at script.js:14               ← called main
```

> **Source:**
> - MDN — "Call stack": https://developer.mozilla.org/en-US/docs/Glossary/Call_stack
> - Philip Roberts "What the heck is the event loop anyway?": https://www.youtube.com/watch?v=8aGhZQkoFbQ
> - JavaScript.info — "Recursion and stack": https://javascript.info/recursion

---

## 4. Hoisting — The Creation Phase Revealed

### What Is It?

**Hoisting** is the behavior where variable and function **declarations** are
processed during the Creation Phase — before any code runs. The declarations
are not physically moved; the engine just registers them in memory first.

Different declarations are hoisted **differently**:

| Declaration | Hoisted? | Initial Value | Accessible Before Declaration? |
|------------|----------|---------------|-------------------------------|
| `var x = 5` | Yes | `undefined` | Yes (gives `undefined`) |
| `let x = 5` | Yes | `<uninitialized>` | No (TDZ → `ReferenceError`) |
| `const x = 5` | Yes | `<uninitialized>` | No (TDZ → `ReferenceError`) |
| `function foo() {}` | Yes | Full function body | Yes (fully available) |
| `var foo = function() {}` | Partially | `undefined` (just the `var`) | No (gives `undefined`, calling throws `TypeError`) |
| `class Foo {}` | Yes | `<uninitialized>` | No (TDZ → `ReferenceError`) |

### var Hoisting

When you declare a variable using `var`, JavaScript registers the variable name in memory during the Creation Phase and initializes it with the value `undefined`. 

Because it's already in memory, you can actually try to read the variable *before* the line of code where you assigned a value to it. It won't crash your program; it will just give you `undefined`.

Let's look at how this behaves in practice:

```js
// Step 1: We try to print 'x'.
// JavaScript already knows 'x' exists because it scanned the file during the Creation Phase.
// However, the assignment (x = 10) hasn't run yet.
console.log(x); // undefined

// Step 2: Now the actual assignment runs during the Execution Phase.
var x = 10;

// Step 3: Now 'x' holds the value 10.
console.log(x); // 10
```

The engine conceptually does this:

```js
var x;            // ← Declaration moved to top (Creation Phase)
console.log(x);   // undefined
x = 10;           // ← Assignment stays in place (Execution Phase)
console.log(x);   // 10
```

### Function Declaration Hoisting

Functions declared with the `function` keyword are treated differently than variables. They are **fully** hoisted.

During the Creation Phase, the JavaScript engine doesn't just register the function's name — it stores the **entire function body** in memory. This means the function is completely ready to be used before its line of code is ever reached during execution.

```js
// Step 1: We call the function before it appears in the code.
// Because the engine already stored the entire function in memory during the Creation Phase,
// it knows exactly what 'greet' does.
greet(); // ✅ "Hello!"

// Step 2: This is the actual declaration. 
// The engine essentially skips over this during the Execution Phase because it already handled it.
function greet() {
  console.log("Hello!");
}
```

### Function Expression — Only the Variable is Hoisted

What happens if we assign a function to a variable instead? This is called a Function Expression. 

In this case, it follows the rules of the variable (`var`, `let`, or `const`), not the rules of function hoisting.

```js
// Step 1: We try to call 'greet' as a function.
// Because it was declared with 'var', the variable name 'greet' was hoisted and initialized to 'undefined'.
// We are essentially trying to do: undefined()
greet(); // [!] TypeError: greet is not a function

// Step 2: The variable is assigned the function during the Execution Phase.
// Too late! The code already crashed above.
var greet = function () {
  console.log("Hello!");
};
```

`greet` is hoisted as a `var` → initialized to `undefined`. Trying to call
`undefined()` throws a `TypeError` (not a `ReferenceError` — the variable
*exists*, it's just not a function yet).

### Hoisting Priority: Functions Win Over Variables

When a function declaration and a `var` declaration share the same name, the
function declaration takes priority during the Creation Phase:

```js
console.log(typeof foo); // "function" ← function won

var foo = "hello";
function foo() {
  return "world";
}

console.log(typeof foo); // "string" ← var assignment overwrites during execution
```

**Creation Phase:**
1. `var foo` → registered, set to `undefined`
2. `function foo()` → registered, **overwrites** `undefined` with the function body

**Execution Phase:**
1. `console.log(typeof foo)` → `"function"` (function is already stored)
2. `foo = "hello"` → `foo` is now reassigned to the string `"hello"`
3. `console.log(typeof foo)` → `"string"`

### A Real-World Hoisting Gotcha

```js
function setupUI() {
  showWelcome();

  // 200 lines of code later...

  var showWelcome = function () {
    console.log("Welcome!");
  };
}
setupUI(); // [!] TypeError: showWelcome is not a function
```

This is a common production bug. `showWelcome` is hoisted as `var` →
`undefined`, so calling it on line 2 fails. The fix: use a function
declaration instead, or move the call below the assignment.

> **Source:**
> - MDN — "Hoisting": https://developer.mozilla.org/en-US/docs/Glossary/Hoisting
> - JavaScript.info — "The old var": https://javascript.info/var
> - You Don't Know JS: Scope & Closures, Ch 5: https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch5.md

---

## 5. The Temporal Dead Zone (TDZ)

### What Is It?

The **Temporal Dead Zone** is the region of code between entering a scope and
the point where a `let` or `const` variable is declared. During this zone, the
variable exists in memory (it was registered during the Creation Phase) but is
**not accessible**. Attempting to read or write it throws a `ReferenceError`.

### Visualizing the TDZ

When JavaScript enters a block (like an `if` statement or just curly braces `{}`), it immediately scans for `let` and `const` variables and registers them in memory. However, unlike `var`, it does *not* initialize them with `undefined`. They are put into a special state: the Temporal Dead Zone.

```js
{
  // ──── TDZ for `x` starts here ────
  console.log(x);  // [!] ReferenceError: Cannot access 'x' before initialization
  // ──── TDZ continues ────
  let x = 42;      // ← TDZ ends here. `x` is now initialized.
  console.log(x);  // 42 ✅
}
```

### How the Engine Handles TDZ

When JavaScript enters a block, it scans and registers all `let`/`const` declarations immediately — but unlike `var`, it does NOT initialize them with `undefined`. They are put into the TDZ. Because the engine already knows `let x` belongs to this block, it will never fall back to an outer scope.

The error messages confirm this:

| Scenario | Error |
|----------|-------|
| `let x` exists but accessed in TDZ | `Cannot access 'x' before initialization` |
| No `x` declared anywhere | `x is not defined` |

The first message proves the engine already knows about `let x` — it simply refuses access until the declaration line runs.

### TDZ Is About Time, Not Code Position

The TDZ is defined by **execution order**, not where the code is physically
written:

```js
// This works — the function is CALLED after x is initialized
function readX() {
  console.log(x);
}

let x = 42;
readX(); // 42 ✅ — x was initialized before the call
```

```js
// This fails — the function is CALLED before x is initialized
function readX() {
  console.log(x); // [!] ReferenceError
}

readX();  // called BEFORE x is initialized
let x = 42;
```

### typeof Is NOT Safe in the TDZ

Normally `typeof` is safe to use on undeclared variables (it returns
`"undefined"`). But in the TDZ, it throws:

```js
console.log(typeof undeclaredVar);  // "undefined" — safe, no error
console.log(typeof myLet);         // [!] ReferenceError!
let myLet = 10;
```

### TDZ in Default Parameters

```js
// This works — a is already initialized when b's default is evaluated
function add(a, b = a) {
  return a + b;
}
add(5); // 10 ✅

// This fails — b is in TDZ when a's default tries to use it
function addBroken(a = b, b) {
  return a + b;
}
addBroken(undefined, 5); // [!] ReferenceError: Cannot access 'b' before initialization
```

Parameters are initialized left-to-right. When `a`'s default (`b`) is
evaluated, `b` hasn't been initialized yet.

> **Source:**
> - MDN — "let" (TDZ section): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz
> - ES Spec §14.3.1 "Let and Const Declarations": https://tc39.es/ecma262/#sec-let-and-const-declarations
> - You Don't Know JS: Scope & Closures, Ch 5: https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch5.md

---

## 6. Scope and the Scope Chain

### What Is Scope?

**Scope** is the set of rules that determines where a variable can be accessed. Think of it as a boundary or an access policy for variables. If you declare a variable inside a function, the rules of scope dictate that only code inside that function is allowed to see or change this variable.

JavaScript has three types of scope:

| Scope | Created By | Who Respects It |
|-------|-----------|----------------|
| **Global Scope** | Code outside any function or block | Everything |
| **Function Scope** | `function` keyword | `var`, `let`, `const` |
| **Block Scope** | Any `{ }` (if, for, while, plain block) | `let`, `const` only. `var` **ignores** blocks. |

### Block Scope: The Key Difference

```js
function example() {
  if (true) {
    var a = 1;   // function-scoped → escapes the if-block
    let b = 2;   // block-scoped → trapped inside the if-block
    const c = 3; // block-scoped → trapped inside the if-block
  }

  console.log(a); // 1 ✅ — var escapes the block
  console.log(b); // [!] ReferenceError — let is block-scoped
}
```

### The Scope Chain

When the engine encounters a variable, it searches for it following this chain:

```
Current Scope → Parent Scope → Grandparent Scope → ... → Global Scope → ❌ ReferenceError
```

This chain is determined at **function definition time** (not call time). This
is called **lexical scoping**.

### Example: Lexical Scoping

```js
var x = "global";

function outer() {
  var x = "outer";

  function inner() {
    console.log(x); // ❓
  }

  inner();
}

outer(); // "outer"
```

`inner()` looks for `x`:
1. Check `inner`'s own scope → not there.
2. Check `outer`'s scope (where `inner` was **defined**) → found! `x = "outer"`.

### The Crucial Distinction: Definition Site vs Call Site

```js
var x = 10;

function readX() {
  console.log(x);
}

function wrapper() {
  var x = 99;
  readX(); // ❓ Does it print 10 or 99?
}

wrapper(); // 10
```

**Answer: 10.** `readX` was **defined** in the global scope. Its scope chain
is `readX → Global`. It does NOT look into `wrapper`'s scope, even though
`wrapper` called it.

If JavaScript used dynamic scoping (where the scope chain follows the *call
stack*), the answer would be 99. But JavaScript uses **lexical** (static)
scoping — the scope chain is fixed when the function is written.

### Nested Scope Chain — Multi-Level Lookup

```js
var a = "global-a";

function level1() {
  var b = "level1-b";

  function level2() {
    var c = "level2-c";

    function level3() {
      console.log(a); // Found in global scope
      console.log(b); // Found in level1 scope
      console.log(c); // Found in level2 scope (own parent)
    }

    level3();
  }

  level2();
}

level1();
// "global-a", "level1-b", "level2-c"
```

Scope chain for `level3`: `level3 → level2 → level1 → Global`

### Variable Shadowing

When a variable in an inner scope has the same name as one in an outer scope,
the inner one **shadows** (hides) the outer one:

```js
let x = "outer";

function demo() {
  let x = "inner"; // shadows the outer x
  console.log(x);  // "inner"
}

demo();
console.log(x); // "outer" — the original is untouched
```

> **Source:**
> - MDN — "Scope": https://developer.mozilla.org/en-US/docs/Glossary/Scope
> - JavaScript.info — "Variable scope, closure": https://javascript.info/closure
> - You Don't Know JS: Scope & Closures, Ch 1-3: https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch1.md

---

## 7. var vs let vs const — The Full Truth

### Complete Comparison

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| Scope | Function | Block | Block |
| Hoisted | Yes → `undefined` | Yes → TDZ | Yes → TDZ |
| Re-declaration (same scope) | ✅ Allowed | ❌ SyntaxError | ❌ SyntaxError |
| Re-assignment | ✅ | ✅ | ❌ TypeError |
| Added to `window` (global) | ✅ | ❌ | ❌ |
| Must initialize at declaration | ❌ | ❌ | ✅ Yes |

### Re-declaration

```js
var a = 1;
var a = 2; // ✅ Silently overwritten — dangerous in large codebases

let b = 1;
let b = 2; // [!] SyntaxError: Identifier 'b' has already been declared

const c = 1;
const c = 2; // [!] SyntaxError
```

### const Does NOT Mean Immutable

`const` prevents **reassignment of the variable**. It does NOT prevent
**mutation of the value**. For objects and arrays, you can still change their
contents:

```js
const user = { name: "Alice" };

user.name = "Bob";       // ✅ Mutation is allowed
user.age = 25;           // ✅ Adding properties is allowed
console.log(user);       // { name: "Bob", age: 25 }

user = { name: "Carol" }; // [!] TypeError: Assignment to constant variable
```

**Why?** `const` locks the **reference** (the arrow from the variable to the
object in heap memory), not the **object itself**.

```
STACK:                           HEAP:
┌────────────┐                  ┌─────────────────┐
│ user: 0x3A │─── reference ──▶│ { name: "Bob",  │
│  (const)   │  [locked] CAN'T       │   age: 25 }     │
│            │  change this     │  ✏️ CAN change  │
│            │  pointer         │  these contents  │
└────────────┘                  └─────────────────┘
```

To truly freeze an object, use `Object.freeze()`:

```js
const frozen = Object.freeze({ name: "Alice" });
frozen.name = "Bob"; // silently fails (or throws in strict mode)
console.log(frozen.name); // "Alice"

// ⚠️ Object.freeze is SHALLOW — nested objects are NOT frozen:
const deep = Object.freeze({ inner: { x: 1 } });
deep.inner.x = 99; // ✅ This works — inner object isn't frozen
```

### The Classic var-in-a-Loop Bug

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// OUTPUT: 3, 3, 3  (not 0, 1, 2!)
```

**Why:** `var` is function-scoped, so there is ONE `i` shared by all three
callbacks. By the time the timeouts fire (100ms later), the loop is done and
`i` is 3.

```js
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 100);
}
// OUTPUT: 0, 1, 2  ✅
```

**Why:** `let` is block-scoped. Each iteration of the loop creates a **new
binding** for `j`. Each callback captures its own copy.

### The Global Object Pollution Problem

```js
var globalVar = "I'm on window";
let globalLet = "I'm NOT on window";

// In a browser:
console.log(window.globalVar);  // "I'm on window"
console.log(window.globalLet);  // undefined
```

`var` at the global level adds properties to the `window` object. This means
any library using `var` globally can accidentally overwrite built-in properties
like `window.name`, `window.status`, etc.

### The Professional Rule

```
const  → Default. Use for everything unless you NEED to reassign.
let    → Use when the value will change (loop counters, accumulators, flags).
var    → Never in new code. Know it only to read legacy code.
```

> **Source:**
> - MDN — "let": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let
> - MDN — "const": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
> - MDN — "var": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var
> - JavaScript.info — "Variables": https://javascript.info/variables
> - JavaScript.info — "The old var": https://javascript.info/var

---

## 8. Strict Mode

### What Is It?

Strict mode is a restricted variant of JavaScript that catches common coding
mistakes and prevents unsafe actions. You opt in with `"use strict";` at the
top of a file or function body.

**Key fact for React developers:** ES Modules (`import`/`export`) are **always**
in strict mode automatically. Every modern React file is in strict mode whether
you write `"use strict"` or not.

### What Strict Mode Changes

**1. No accidental global variables:**

```js
"use strict";
x = 10; // [!] ReferenceError: x is not defined
// Without strict mode: silently creates window.x = 10
```

**2. Assignment to non-writable properties throws:**

```js
"use strict";
const obj = {};
Object.defineProperty(obj, "name", { value: "Alice", writable: false });
obj.name = "Bob"; // [!] TypeError
// Without strict mode: silently fails
```

**3. Duplicate parameter names are forbidden:**

```js
"use strict";
function add(a, a) { } // [!] SyntaxError: Duplicate parameter name
// Without strict mode: allowed (second `a` overwrites first)
```

**4. `this` is `undefined` in standalone function calls:**

```js
"use strict";
function showThis() {
  console.log(this);
}
showThis(); // undefined
// Without strict mode: window (browser) / global (Node)
```

This matters hugely for React class components — `this` in event handlers is
`undefined` unless explicitly bound.

**5. Deleting undeletable properties throws:**

```js
"use strict";
delete Object.prototype; // [!] TypeError
// Without strict mode: silently fails
```

**6. Octal literals are forbidden:**

```js
"use strict";
var x = 010; // [!] SyntaxError
// Without strict mode: 010 = 8 (octal notation)
```

### Function-Level Strict Mode

You can enable strict mode for a single function:

```js
function sloppy() {
  x = 100; // ✅ creates global variable (sloppy mode)
}

function strict() {
  "use strict";
  y = 100; // [!] ReferenceError
}
```

> **Source:**
> - MDN — "Strict mode": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
> - JavaScript.info — "The modern mode, 'use strict'": https://javascript.info/strict-mode

---

## 9. Exercises

### Exercise Set A: Predict the Output

For each snippet, predict the output **before** running it. Write your
prediction, then run it to verify.

```js
// A1.
console.log(a);
var a = 1;
console.log(a);
// Prediction: _____, _____

// A2.
console.log(b);
let b = 2;
// Prediction: _____

// A3.
var c = 10;
var c = 20;
console.log(c);
// Prediction: _____

// A4.
let d = 10;
{
  let d = 20;
  console.log(d);
}
console.log(d);
// Prediction: _____, _____

// A5.
const e = { x: 1 };
e.x = 2;
console.log(e.x);
// Prediction: _____

// A6.
var f = 1;
function test() {
  console.log(f);
  var f = 2;
}
test();
// Prediction: _____

// A7.
console.log(typeof foo);
var foo = "hello";
function foo() {}
console.log(typeof foo);
// Prediction: _____, _____

// A8.
for (var i = 0; i < 3; i++) {}
console.log(i);
// Prediction: _____

// A9.
for (let j = 0; j < 3; j++) {}
console.log(j);
// Prediction: _____

// A10.
var x = 1;
function outer() {
  console.log(x);
  function inner() {
    console.log(x);
    var x = 3;
  }
  inner();
}
outer();
// Prediction: _____, _____
```

<details>
<summary><strong>Answers</strong></summary>

```
A1:  undefined, 1                (var hoists with undefined)
A2:  ReferenceError              (let TDZ)
A3:  20                          (var allows re-declaration)
A4:  20, 10                      (inner let shadows outer; outer untouched)
A5:  2                           (const protects reference, not contents)
A6:  undefined                   (local var f shadows global, hoisted as undefined)
A7:  "function", "string"       (function hoisting wins, then var assignment overwrites)
A8:  3                           (var leaks out of for-block)
A9:  ReferenceError              (let is block-scoped to the for-block)
A10: 1, undefined                (outer sees global x=1; inner has its own var x,
                                  hoisted as undefined, shadows global)
```

</details>

### Exercise Set B: Scope Chain Drawing

For each snippet, draw the scope chain on paper, then predict the output.

```js
// B1.
var a = "global";
function outer() {
  var b = "outer";
  function inner() {
    var c = "inner";
    console.log(a, b, c);
  }
  inner();
}
outer();

// B2.
var x = "global-x";
function foo() {
  var x = "foo-x";
  function bar() {
    console.log(x);
  }
  return bar;
}
var fn = foo();
fn();  // ❓ "global-x" or "foo-x"?

// B3.
let val = "global";
function createLogger() {
  let val = "local";
  return function () {
    console.log(val);
  };
}
const logger = createLogger();
logger();

// B4.
function level1() {
  let a = 1;
  function level2() {
    let b = 2;
    function level3() {
      let c = 3;
      console.log(a + b + c);
    }
    level3();
  }
  level2();
}
level1();
```

<details>
<summary><strong>Answers</strong></summary>

```
B1: "global" "outer" "inner"
    Chain: inner → outer → global

B2: "foo-x"
    bar was DEFINED inside foo. Its scope chain: bar → foo → global.
    It sees foo's x, not global x. This is a CLOSURE.

B3: "local"
    Same principle. The returned function was defined inside createLogger.
    Its scope chain: anonymous → createLogger → global.
    It sees createLogger's val = "local".

B4: 6
    level3 chain: level3 → level2 → level1 → global
    c = 3 (own), b = 2 (level2), a = 1 (level1). Sum = 6.
```

</details>

### Exercise Set C: Fix the Bugs

Each snippet has a bug related to this week's concepts. Find and fix it.

```js
// C1. The function should log "Hello, Alice"
sayHi();
var sayHi = function () {
  console.log("Hello, Alice");
};

// C2. This should print 0, 1, 2 (not 3, 3, 3)
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}

// C3. This should NOT pollute the global scope
var helperUtil = "some value";
// (After running, window.helperUtil should be undefined)

// C4. The user object should be truly immutable
const config = { apiUrl: "https://api.example.com", retries: 3 };
config.retries = 10; // This should NOT be allowed

// C5. This should print "admin", not crash
function getRole() {
  if (true) {
    return role;
  }
  let role = "admin";
}
console.log(getRole());
```

<details>
<summary><strong>Answers</strong></summary>

```js
// C1 FIX: Use a function declaration (or move the call below the expression)
function sayHi() {
  console.log("Hello, Alice");
}
sayHi();

// C2 FIX: Use let instead of var
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}

// C3 FIX: Use let or const — they don't attach to window
const helperUtil = "some value";

// C4 FIX: Use Object.freeze
const config = Object.freeze({ apiUrl: "https://api.example.com", retries: 3 });
config.retries = 10; // Silently fails (throws in strict mode)

// C5 FIX: Move the let declaration before the return
function getRole() {
  if (true) {
    let role = "admin";
    return role;
  }
}
console.log(getRole());
```

</details>

### Exercise Set D: Call Stack Tracing

Trace the complete call stack (every PUSH and POP) and predict the final output.

```js
function main() {
  console.log("main:start");
  alpha();
  console.log("main:end");
}

function alpha() {
  console.log("alpha:start");
  beta();
  console.log("alpha:end");
}

function beta() {
  console.log("beta:start");
  gamma();
  console.log("beta:end");
}

function gamma() {
  console.log("gamma");
}

main();
```

<details>
<summary><strong>Answer</strong></summary>

```
PUSH main        →  Stack: [Global, main]
  "main:start"
  PUSH alpha     →  Stack: [Global, main, alpha]
    "alpha:start"
    PUSH beta    →  Stack: [Global, main, alpha, beta]
      "beta:start"
      PUSH gamma →  Stack: [Global, main, alpha, beta, gamma]
        "gamma"
      POP gamma  →  Stack: [Global, main, alpha, beta]
      "beta:end"
    POP beta     →  Stack: [Global, main, alpha]
    "alpha:end"
  POP alpha      →  Stack: [Global, main]
  "main:end"
POP main         →  Stack: [Global]

OUTPUT:
  main:start
  alpha:start
  beta:start
  gamma
  beta:end
  alpha:end
  main:end
```

</details>

---

## 10. Milestone Project

### Build: A Code Execution Visualizer

Build a Node.js program that simulates how the JS engine processes code. It
should visually show the Creation Phase, Execution Phase, and Call Stack
operations.

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project uses concepts not covered in Week 1. Do not attempt it until
> you have finished the following weeks:
>
> | What you need | Where you learn it |
> |---|---|
> | Template literals `` `Hello ${name}` `` | Week 2 |
> | `for...of` loop | Week 2 |
> | `switch / case` | Week 2 |
> | String methods (`.padStart()`, `.repeat()`) | Week 2 |
> | Arrays & methods (`.push()`, `.pop()`, `.join()`) | Week 3 |
> | Objects & `Map` | Week 3 |
> | `JSON.stringify()` | Week 3 |
> | `class`, `constructor`, `this`, private methods (`#`) | Week 4 |
>
> ✅ Come back here after completing **Week 4**.

**Starter code:**

```js
// ============================================================
// execution-visualizer.js
// Run with: node execution-visualizer.js
// ============================================================

class ExecutionVisualizer {
  constructor() {
    this.callStack = [];
    this.memory = new Map();
    this.step = 0;
  }

  #log(message) {
    this.step++;
    const indent = "  ".repeat(this.callStack.length);
    console.log(`  [Step ${String(this.step).padStart(2, "0")}] ${indent}${message}`);
  }

  creationPhase(contextName, declarations) {
    console.log(`\n${"═".repeat(50)}`);
    console.log(`  CREATION PHASE: ${contextName}`);
    console.log(`${"═".repeat(50)}`);

    for (const decl of declarations) {
      switch (decl.kind) {
        case "var":
          this.memory.set(decl.name, { value: "undefined", scope: contextName });
          this.#log(`var ${decl.name} → undefined`);
          break;
        case "let":
        case "const":
          this.memory.set(decl.name, { value: "<uninitialized> (TDZ)", scope: contextName });
          this.#log(`${decl.kind} ${decl.name} → <uninitialized> (TDZ)`);
          break;
        case "function":
          this.memory.set(decl.name, { value: `ƒ ${decl.name}()`, scope: contextName });
          this.#log(`function ${decl.name} → [fully hoisted ✓]`);
          break;
      }
    }
  }

  executionPhase(contextName) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`  EXECUTION PHASE: ${contextName}`);
    console.log(`${"─".repeat(50)}`);
  }

  assign(name, value) {
    const entry = this.memory.get(name);
    const oldVal = entry ? entry.value : "❌ not found";
    if (entry) entry.value = JSON.stringify(value);
    else this.memory.set(name, { value: JSON.stringify(value), scope: "unknown" });
    this.#log(`${name} = ${JSON.stringify(value)}  (was: ${oldVal})`);
  }

  push(name) {
    this.callStack.push(name);
    this.#log(`PUSH → ${name}`);
    this.#log(`Stack: [ ${this.callStack.join(" → ")} ]`);
  }

  pop() {
    const removed = this.callStack.pop();
    this.#log(`POP  ← ${removed}`);
    this.#log(`Stack: [ ${this.callStack.join(" → ") || "(empty)"} ]`);
    return removed;
  }

  showMemory() {
    console.log(`\n  [stats] Memory Snapshot:`);
    console.log(`  ${"─".repeat(40)}`);
    for (const [key, entry] of this.memory) {
      console.log(`    ${key.padEnd(12)} = ${entry.value}  (${entry.scope})`);
    }
    console.log(`  ${"─".repeat(40)}`);
  }
}

// ============================================================
// Simulate this code:
//
//   var x = 10;
//   let y = 20;
//   function add(a, b) { return a + b; }
//   var result = add(x, y);
//   console.log(result);
//
// ============================================================

const viz = new ExecutionVisualizer();

// 1. Global Execution Context — Creation
viz.push("Global");
viz.creationPhase("Global", [
  { kind: "var", name: "x" },
  { kind: "let", name: "y" },
  { kind: "function", name: "add" },
  { kind: "var", name: "result" },
]);
viz.showMemory();

// 2. Global Execution Context — Execution
viz.executionPhase("Global");
viz.assign("x", 10);
viz.assign("y", 20);

// 3. add(10, 20) is called
viz.push("add(10, 20)");
viz.creationPhase("add", [
  { kind: "var", name: "a" },
  { kind: "var", name: "b" },
]);
viz.executionPhase("add");
viz.assign("a", 10);
viz.assign("b", 20);
viz.#log && console.log(`  [Step ${++viz.step}]     return 30`);
viz.pop();

// 4. Back in Global
viz.assign("result", 30);
viz.showMemory();
viz.pop();

console.log("\n✅ Program complete.\n");
```

**Your tasks (extend this):**

1. Add support for **nested function calls** (e.g., `outer()` calls `inner()`).
2. Add **TDZ detection** — if a `let`/`const` variable is read before
   assignment, print a simulated `ReferenceError`.
3. Add **scope chain visualization** — show which scope each lookup goes through.
4. **Challenge:** Accept a simple code string as input and automatically
   detect `var`, `let`, `const`, and `function` declarations using regex.

---

## 11. Sources

### Primary References Used in This Lesson

| Topic | Source | URL |
|-------|--------|-----|
| V8 Ignition + TurboFan | V8 Blog | https://v8.dev/blog/launching-ignition-and-turbofan |
| How JS Actually Works | SessionStack Blog | https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf |
| Environment Records | ECMAScript Specification §9.1 | https://tc39.es/ecma262/#sec-environment-records |
| Variable scope, closure | JavaScript.info | https://javascript.info/closure |
| `this` keyword | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this |
| Call stack | MDN Glossary | https://developer.mozilla.org/en-US/docs/Glossary/Call_stack |
| Event loop talk | Philip Roberts (JSConf) | https://www.youtube.com/watch?v=8aGhZQkoFbQ |
| Recursion and stack | JavaScript.info | https://javascript.info/recursion |
| Hoisting | MDN Glossary | https://developer.mozilla.org/en-US/docs/Glossary/Hoisting |
| The old `var` | JavaScript.info | https://javascript.info/var |
| Scope & Closures book | You Don't Know JS (2nd ed) | https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch5.md |
| `let` (TDZ) | MDN Reference | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let |
| Let/Const in spec | ECMAScript §14.3.1 | https://tc39.es/ecma262/#sec-let-and-const-declarations |
| Scope | MDN Glossary | https://developer.mozilla.org/en-US/docs/Glossary/Scope |
| `let` | MDN Reference | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let |
| `const` | MDN Reference | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const |
| `var` | MDN Reference | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var |
| Variables | JavaScript.info | https://javascript.info/variables |
| Strict mode | MDN Reference | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode |
| Modern mode | JavaScript.info | https://javascript.info/strict-mode |

### Recommended Deep Reading (Optional)

- **You Don't Know JS Yet: Scope & Closures (2nd ed)** — Kyle Simpson
  https://github.com/getify/You-Dont-Know-JS/tree/2nd-ed/scope-closures
- **Namaste JavaScript (video series)** — Akshay Saini
  https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP
- **JavaScript Visualized (blog series)** — Lydia Hallie
  https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif
