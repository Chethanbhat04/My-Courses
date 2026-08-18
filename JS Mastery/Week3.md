# Week 3 — Functions, Closures, and the `this` Keyword

# The Complete Deep-Dive Lesson

---

## Table of Contents

1. [Function Declarations vs Expressions vs Arrows](#1-function-declarations-vs-expressions-vs-arrows)
2. [First-Class Functions](#2-first-class-functions)
3. [Closures — The Deep Dive](#3-closures--the-deep-dive)
4. [The `this` Keyword — All Four Rules](#4-the-this-keyword--all-four-rules)
5. [Arrow Functions and Lexical `this`](#5-arrow-functions-and-lexical-this)
6. [IIFE — Immediately Invoked Function Expressions](#6-iife--immediately-invoked-function-expressions)
7. [Higher-Order Functions](#7-higher-order-functions)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. Function Declarations vs Expressions vs Arrows

JavaScript has three main ways to create a function. They look similar but
behave differently.

### Function Declaration

```js
function greet(name) {
  return `Hello, ${name}!`;
}
```

- **Hoisted fully** — JavaScript scans the entire file before running any code. It
  moves all `function` declarations to the top in memory. This means you can *call*
  the function even before the line where it is written.

  ```js
  greet(); // ✅ Works! — even though greet() is defined below

  function greet() {
    console.log("Hello!");
  }
  ```

  Arrow functions and function expressions would throw a ReferenceError here because
  they are NOT hoisted the same way.

- **Has its own `this`** — Every regular function creates a new `this` value when
  it is called. The value of `this` depends on *how* you call the function, not
  where you define it.

  ```js
  const user = {
    name: "Chethan",
    greet: function () {
      console.log(this.name); // "Chethan" — this refers to user
    }
  };
  user.greet();
  ```

  Arrow functions do NOT get their own `this`. That is the key difference, covered
  in depth in Section 5.

- **Has the `arguments` object** — Inside any regular function, JavaScript silently
  provides a built-in variable called `arguments`. It is an array-like object
  containing every value passed into the function — even if you did not define
  parameter names for them.

  ```js
  function sum() {
    console.log(arguments); // { 0: 1, 1: 2, 2: 3 }
    let total = 0;
    for (let n of arguments) total += n;
    return total;
  }
  sum(1, 2, 3); // 6
  ```

  Arrow functions do NOT have `arguments`. If you try to use `arguments` inside an
  arrow function, you get a ReferenceError.

- **Can be used as a constructor with `new`** — You can use a regular function as a
  blueprint to create multiple objects. When you call a function with `new`, JavaScript
  creates a brand-new empty object, assigns it to `this` inside the function, and
  returns it automatically.

  ```js
  function Person(name, age) {
    this.name = name; // sets name on the new object
    this.age = age;
  }

  const user1 = new Person("Chethan", 21);
  const user2 = new Person("Alice", 25);

  console.log(user1.name); // "Chethan"
  console.log(user2.name); // "Alice"
  ```

  Arrow functions cannot be used with `new` — calling `new` on an arrow function
  throws a TypeError.

### Function Expression

```js
const greet = function(name) {
  return `Hello, ${name}!`;
};
```

- **Not hoisted as a function** — The variable `greet` is hoisted (because of
  `const`), but its value (the function) is NOT available until that line runs.
  Calling it before the declaration throws a ReferenceError due to the Temporal
  Dead Zone (TDZ).

  ```js
  greet(); // ❌ ReferenceError: Cannot access 'greet' before initialization

  const greet = function(name) {
    return `Hello, ${name}!`;
  };
  ```

- **Has its own `this`** — Same behaviour as a function declaration. The value of
  `this` is determined by how the function is called at runtime.

- **Has the `arguments` object** — Same as a function declaration. All passed
  values are accessible through the built-in `arguments` variable.

- **Can be used as a constructor with `new`** — Same as a function declaration.
  You can create object instances with `new`.

### Arrow Function (ES6)

```js
const greet = (name) => `Hello, ${name}!`;
```

- **Not hoisted** — Same as a function expression. Calling an arrow function before
  its declaration line throws a ReferenceError.

- **Does NOT have its own `this`** — This is the most important difference. An arrow
  function does not create its own `this`. Instead, it *captures* `this` from the
  surrounding scope at the time it is defined. This is called **lexical `this`**.

  ```js
  const timer = {
    count: 0,
    start: function () {
      // Regular function — this = timer object ✅
      setInterval(() => {
        // Arrow function — inherits this from start() → still timer ✅
        this.count++;
        console.log(this.count);
      }, 1000);
    }
  };
  timer.start(); // 1, 2, 3 ...
  ```

  If `setInterval` used a regular function instead of an arrow, `this` would be
  the global `window` object and `this.count` would be `undefined`.

- **Does NOT have `arguments`** — Accessing `arguments` inside an arrow function
  gives a ReferenceError. Use rest parameters (`...args`) instead.

  ```js
  const sum = (...args) => args.reduce((a, b) => a + b, 0);
  sum(1, 2, 3); // 6
  ```

- **Cannot be used as a constructor with `new`** — Arrow functions were never
  designed to create objects. Calling `new` on one throws a TypeError immediately.

  ```js
  const Person = (name) => { this.name = name; };
  const p = new Person("Chethan"); // ❌ TypeError: Person is not a constructor
  ```

### Comparison Table

| Feature | Declaration | Expression | Arrow |
|---------|-----------|------------|-------|
| Hoisted | ✅ Fully | ❌ | ❌ |
| Own `this` | ✅ | ✅ | ❌ Lexical |
| `arguments` | ✅ | ✅ | ❌ |
| Can use `new` | ✅ | ✅ | ❌ |
| Syntax | `function name(){}` | `const name = function(){}` | `const name = () => {}` |

### When to Use Each

```
Arrow functions  → Default for almost everything. Short, clean, no this issues.
Function declarations → When you need hoisting (defining utilities at bottom of file).
Function expressions → When you need arguments object or this binding, or named recursion.
```

### Arrow Function Syntax Shortcuts

```js
// Full syntax
const add = (a, b) => {
  return a + b;
};

// Implicit return (single expression, no curly braces needed)
const add = (a, b) => a + b;

// Single parameter (parentheses optional)
const double = n => n * 2;

// No parameters (parentheses required)
const greet = () => "Hello!";

// Returning an object literal (wrap in parentheses to avoid confusion with block)
const makeUser = (name) => ({ name: name, role: "user" });
```

> **Source:**
> - MDN — "Functions": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions
> - MDN — "Arrow function expressions": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
> - JavaScript.info — "Functions": https://javascript.info/function-basics
> - JavaScript.info — "Arrow functions, the basics": https://javascript.info/arrow-functions-basics

---

## 2. First-Class Functions

In JavaScript, functions are **first-class citizens**. This means they are
values — just like numbers and strings. You can:

### Store them in variables

```js
const sayHi = function() { return "Hi!"; };
```

### Store them in object properties (methods)

```js
const user = {
  name: "Alice",
  greet() { return `Hi, I'm ${this.name}`; }
};
```

### Pass them as arguments to other functions

```js
function runTwice(fn) {
  fn();
  fn();
}
runTwice(() => console.log("Hello!"));
// "Hello!"
// "Hello!"
```

### Return them from other functions

```js
function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

### Store them in arrays

```js
const operations = [
  (a, b) => a + b,
  (a, b) => a - b,
  (a, b) => a * b,
];

console.log(operations[0](10, 5)); // 15
console.log(operations[1](10, 5)); // 5
console.log(operations[2](10, 5)); // 50
```

This capability is what makes **closures** and **higher-order functions**
possible — the two most powerful patterns in JavaScript.

> **Source:**
> - MDN — "First-class Function": https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function
> - JavaScript.info — "Function expressions": https://javascript.info/function-expressions

---

## 3. Closures — The Deep Dive

### What Is a Closure?

Normally, when a function finishes running, all its local variables are destroyed and cleared from memory. 

A **closure** is a special feature in JavaScript where a function "remembers" the variables from its surrounding scope even **after** that outer function has finished executing.

**Practical Mental Model (Private State Environment):**
Imagine a function as a self-contained module that gets shipped out to be used elsewhere in your application. Normally, a function only has access to the data passed into it at the moment it runs. But with a closure, the function "packs up" a persistent reference to the exact environment where it was born. It carries this private state environment with it wherever it goes. This is incredibly powerful because it allows a function to have private memory that no other part of the application can accidentally overwrite.

More precisely: a closure is a function combined with a reference to its **Lexical Environment** (the scope in which it was created). When a function is created in JavaScript, the engine attaches a hidden property called `[[Environment]]` to the function object. This property holds the reference that keeps the outer scope's variables alive in memory, even after the outer function has returned and is no longer on the call stack.

### The Simplest Closure

```js
function createGreeter(greeting) {
  // `greeting` is a local variable of createGreeter.
  // It would normally be destroyed when createGreeter finishes.

  return function(name) {
    // This inner function's [[Environment]] points to createGreeter's scope.
    // `greeting` stays alive because this function still references it.
    return `${greeting}, ${name}!`;
  };
}

const sayHello = createGreeter("Hello");
const sayHi = createGreeter("Hi");

// createGreeter has finished, but each returned function still holds
// its own reference to the `greeting` variable from its own call.
console.log(sayHello("Alice")); // "Hello, Alice!"
console.log(sayHi("Bob"));     // "Hi, Bob!"
```

### The Engine Internals

When `createGreeter("Hello")` runs:

1. A new execution context is created with `greeting = "Hello"`.
2. The inner function is created. V8 attaches a hidden property called
   `[[Environment]]` — a reference to `createGreeter`'s Lexical Environment (the private state).
3. `createGreeter` returns and its execution context is popped off the call
   stack.
4. **BUT** — the Lexical Environment is NOT garbage collected because the
   inner function (now stored in `sayHello`) still holds a reference to it
   through `[[Environment]]`.

```
CALL STACK:              HEAP:
(empty - createGreeter   ┌──────────────────────────────┐
 has returned)           │ Inner function object         │
                         │   [[Environment]] ──────┐    │
                         │                         │    │
                         │ createGreeter's LE ◄────┘    │
                         │   greeting: "Hello"          │
                         │                              │
                         └──────────────────────────────┘
```

### Closures Are Not Snapshots — They Are Live References

```js
function createCounter() {
  let count = 0;

  return {
    increment() { count++; },
    decrement() { count--; },
    getCount()  { return count; },
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
counter.increment();
counter.decrement();
console.log(counter.getCount()); // 2

// `count` is not a snapshot of 0 — it's a LIVE reference.
// Each method reads and writes the SAME `count` variable.
```

All three methods (`increment`, `decrement`, `getCount`) close over the
**same** `count` variable. They share the same Lexical Environment.

### Private Variables with Closures

Closures enable **data privacy** — there is no other way (before `#` private
fields) to make a truly private variable in JavaScript:

```js
function createBankAccount(initialBalance) {
  let balance = initialBalance; // PRIVATE — no way to access from outside

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Amount must be positive");
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    }
  };
}

const account = createBankAccount(100);
account.deposit(50);       // 150
account.withdraw(30);      // 120
console.log(account.getBalance()); // 120

// There is NO way to access `balance` directly:
console.log(account.balance); // undefined — it's not a property
```

### The Classic Closure Bug — Loops with `var`

```js
for (var i = 0; i < 5; i++) {
  setTimeout(function() {
    console.log(i);
  }, 100 * i);
}
// OUTPUT: 5, 5, 5, 5, 5  (not 0, 1, 2, 3, 4)
```

**Why?** All 5 functions close over the **same** `i` variable (because `var`
is function-scoped). By the time the timeouts fire, the loop is done and `i = 5`.

**Fix 1: Use `let`**

```js
for (let i = 0; i < 5; i++) {
  setTimeout(function() {
    console.log(i);
  }, 100 * i);
}
// OUTPUT: 0, 1, 2, 3, 4
// let creates a new binding for each iteration
```

**Fix 2: Create a closure with an IIFE**

```js
for (var i = 0; i < 5; i++) {
  (function(captured) {
    setTimeout(function() {
      console.log(captured);
    }, 100 * captured);
  })(i); // pass current i value into the IIFE
}
// OUTPUT: 0, 1, 2, 3, 4
```

**Fix 3: Use a separate function**

```js
function scheduleLog(value) {
  setTimeout(function() {
    console.log(value);
  }, 100 * value);
}

for (var i = 0; i < 5; i++) {
  scheduleLog(i); // each call gets its own `value` parameter
}
// OUTPUT: 0, 1, 2, 3, 4
```

### Function Factories — Closures in Practice

```js
function createValidator(minLength, maxLength) {
  return function(value) {
    if (typeof value !== "string") return { valid: false, error: "Must be a string" };
    if (value.length < minLength) return { valid: false, error: `Min ${minLength} chars` };
    if (value.length > maxLength) return { valid: false, error: `Max ${maxLength} chars` };
    return { valid: true };
  };
}

const validateUsername = createValidator(3, 20);
const validatePassword = createValidator(8, 128);

console.log(validateUsername("Al"));      // { valid: false, error: "Min 3 chars" }
console.log(validateUsername("Alice"));   // { valid: true }
console.log(validatePassword("short"));  // { valid: false, error: "Min 8 chars" }
```

### Memoization with Closures

```js
function memoize(fn) {
  const cache = new Map(); // closed over — persists across calls

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log("Cache hit!");
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const expensiveAdd = memoize((a, b) => {
  console.log("Computing...");
  return a + b;
});

expensiveAdd(1, 2); // "Computing..." → 3
expensiveAdd(1, 2); // "Cache hit!" → 3 (no recomputation)
expensiveAdd(3, 4); // "Computing..." → 7
```

> **Source:**
> - MDN — "Closures": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
> - JavaScript.info — "Variable scope, closure": https://javascript.info/closure
> - You Don't Know JS: Scope & Closures, Ch 7: https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch7.md
> - Namaste JavaScript (Ep 10-12): https://www.youtube.com/watch?v=qikxEIxsXco

---

## 4. The `this` Keyword — All Four Rules

`this` is the most confusing keyword in JavaScript. But it follows **four
clear rules**. If you memorize these rules, you will never be confused again.

**The Golden Rule of `this`:**
Stop looking at where the function was *written*. `this` is completely determined by **how the function is called**. 

Think of `this` as the answer to the question: **"Who called me?"**

Let's look at the four ways a function can be called, which determines who `this` is.

### Rule 1: Default Binding (The Standalone Call)

If a function is just called on its own, without any dot in front of it and without the `new` keyword, who called it? 

By default, the global environment (the window in a browser) called it. So `this` points to the global object. 

*Note: If you are using Strict Mode, JavaScript decides that NO ONE called it, so `this` is `undefined` to prevent you from accidentally modifying the global window.*

```js
function showThis() {
  console.log(this);
}

// Step 1: We call the function standalone. 
// There is no object to the left of a dot.
showThis();

// Result:
// Non-strict mode: `this` = window (browser) / global (Node)
// Strict mode:     `this` = undefined
```

### Rule 2: Implicit Binding (The Method Call)

What if the function is called as a property of an object? 

Ask the question: **"Who called me?"** Look to the left of the dot at the moment the function is called. That object is the one who called the function, so `this` points to that object.

```js
const user = {
  name: "Alice",
  greet() {
    console.log(this.name);
  }
};

// Step 1: We call the greet function.
// Look to the left of the dot: `user.` is calling it.
// Therefore, inside greet(), `this` === `user`.
user.greet(); // "Alice"
```

**The gotcha — losing implicit binding:**

Remember the Golden Rule: it's about **how it's called**, not where it's written. What happens if we take the function *out* of the object and call it standalone?

```js
const user = {
  name: "Alice",
  greet() {
    console.log(this.name);
  }
};

// Step 1: We extract the method and store it in a variable.
// We are NOT calling it yet.
const greetFn = user.greet; 

// Step 2: Now we call it. 
// Ask the question: "Who called me?" 
// There is no dot. It's a standalone call. Rule 1 applies!
greetFn(); // undefined (strict) or "" (non-strict)
```

This is extremely common in React when passing methods as callbacks:

```js
// In React class components:
<button onClick={this.handleClick}>  // ❌ handleClick loses `this`
<button onClick={() => this.handleClick()}>  // ✅ arrow function preserves `this`
```

### Rule 3: Explicit Binding — call, apply, bind

You can **manually** set `this` using `call`, `apply`, or `bind`:

#### `call` — calls the function with a specified `this` and individual arguments

```js
function greet(greeting, punctuation) {
  console.log(`${greeting}, ${this.name}${punctuation}`);
}

const user = { name: "Alice" };
greet.call(user, "Hello", "!"); // "Hello, Alice!"
```

#### `apply` — same as call, but arguments are passed as an array

```js
greet.apply(user, ["Hello", "!"]); // "Hello, Alice!"
```

#### `bind` — returns a NEW function with `this` permanently set

```js
const boundGreet = greet.bind(user, "Hey");
boundGreet("?");   // "Hey, Alice?"
boundGreet("!!!");  // "Hey, Alice!!!"

// bind is permanent — you can't override it:
const rebound = boundGreet.bind({ name: "Bob" });
rebound("!"); // "Hey, Alice!" — still Alice! First bind wins.
```

### Implementing Your Own bind

Understanding `bind` deeply means being able to build it:

```js
Function.prototype.myBind = function(context, ...boundArgs) {
  const originalFn = this; // the function being bound

  return function(...callArgs) {
    return originalFn.apply(context, [...boundArgs, ...callArgs]);
  };
};

function greet(greeting) {
  return `${greeting}, ${this.name}`;
}

const boundGreet = greet.myBind({ name: "Alice" }, "Hello");
console.log(boundGreet()); // "Hello, Alice"
```

### Rule 4: `new` Binding

When a function is called with `new`, `this` is the newly created object:

```js
function Person(name) {
  // `this` = {} (a brand new empty object)
  this.name = name;
  // return this; (implicit)
}

const alice = new Person("Alice");
console.log(alice.name); // "Alice"
```

**What `new` does (4 steps):**

1. Creates a new empty object: `{}`
2. Sets the object's `[[Prototype]]` to `Person.prototype`
3. Calls `Person()` with `this` bound to the new object
4. Returns the new object (unless `Person` explicitly returns a different object)

### The Priority Order (When Rules Conflict)

```
new binding         →  HIGHEST priority
explicit binding    →  (call, apply, bind)
implicit binding    →  (obj.method())
default binding     →  LOWEST priority (standalone call)

Arrow functions     →  SKIP ALL RULES. Use `this` from enclosing scope.
```

### The Complete Decision Tree

```
Was the function called with `new`?
  → YES: this = newly created object
  → NO:
    Was it called with call/apply/bind?
      → YES: this = the specified object
      → NO:
        Was it called as a method (obj.fn())?
          → YES: this = the object before the dot
          → NO:
            Strict mode?
              → YES: this = undefined
              → NO:  this = window / globalThis
```

> **Source:**
> - MDN — "this": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
> - MDN — "Function.prototype.bind": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
> - MDN — "Function.prototype.call": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
> - JavaScript.info — "Object methods, 'this'": https://javascript.info/object-methods
> - You Don't Know JS: this & Object Prototypes, Ch 1-2: https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/this%20%26%20object%20prototypes/ch2.md

---

## 5. Arrow Functions and Lexical `this`

Arrow functions are **different from regular functions** in several important
ways.

### Arrow Functions Don't Have Their Own `this`

Instead, they **inherit** `this` from the enclosing scope where they were
**defined**. This is called **lexical `this`**.

```js
const user = {
  name: "Alice",
  regularMethod() {
    console.log("regular:", this.name); // "Alice" — Rule 2 (implicit)
  },
  arrowMethod: () => {
    console.log("arrow:", this.name); // undefined — arrow inherits from ENCLOSING scope
    // The enclosing scope is the GLOBAL scope (where `user` was defined)
    // NOT the `user` object
  }
};

user.regularMethod(); // "regular: Alice"
user.arrowMethod();   // "arrow: undefined"
```

### When Arrow Functions Are Perfect — Callbacks

```js
const user = {
  name: "Alice",
  friends: ["Bob", "Carol"],

  showFriends() {
    // `this` inside showFriends = user (Rule 2)

    // Regular function callback — `this` is LOST
    this.friends.forEach(function(friend) {
      console.log(`${this.name} knows ${friend}`);
      // `this` is undefined (strict) or window — NOT user!
    });

    // Arrow function callback — `this` is INHERITED from showFriends
    this.friends.forEach((friend) => {
      console.log(`${this.name} knows ${friend}`);
      // `this` is user — because arrows use enclosing scope's `this`
    });
  }
};

user.showFriends();
// With arrow: "Alice knows Bob", "Alice knows Carol"
```

### Arrow Functions Cannot Be Constructors

```js
const Person = (name) => {
  this.name = name;
};

new Person("Alice"); // [!] TypeError: Person is not a constructor
```

Arrow functions have no `[[Construct]]` internal method and no `prototype`
property. They simply cannot be used with `new`.

### Arrow Functions Don't Have `arguments`

```js
function regular() {
  console.log(arguments); // [1, 2, 3]
}

const arrow = () => {
  console.log(arguments); // [!] ReferenceError (or inherits from outer function)
};

regular(1, 2, 3);

// Use rest parameters instead:
const arrowWithRest = (...args) => {
  console.log(args); // [1, 2, 3]
};
arrowWithRest(1, 2, 3);
```

> **Source:**
> - MDN — "Arrow function expressions": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
> - JavaScript.info — "Arrow functions revisited": https://javascript.info/arrow-functions
> - You Don't Know JS: this & Object Prototypes, Ch 2: https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/this%20%26%20object%20prototypes/ch2.md

---

## 6. IIFE (Immediately Invoked Function Expression)

- **Definition: A function that is defined and immediately called in the same expression** — it runs
  the moment the JavaScript engine sees it, without being stored in a variable or called separately.

  ```js
  (function () {
    console.log("I run immediately!");
  })();
  // Output: "I run immediately!"
  ```

  The outer `( )` wrap the function to make it an **expression** (not a declaration). The trailing
  `()` at the end is what actually calls it. Without the wrapping parentheses, JavaScript sees a
  function **declaration** and throws a `SyntaxError` because declarations can't be immediately
  invoked.

  ```js
  function() { }()   // ❌ SyntaxError — JS sees a declaration, not an expression
  (function() { })() // ✅ Works — wrapped in ( ) so it's now an expression
  ```

- **Arrow function IIFE (modern style)** — You can use an arrow function instead of a regular
  `function` keyword. Functionally the same, just shorter syntax.

  ```js
  (() => {
    console.log("Arrow IIFE!");
  })();
  ```

  Arrow function IIFEs do **not** get their own `this` — they inherit `this` from the surrounding
  scope. Regular function IIFEs get their own `this` (usually `undefined` in strict mode or the
  global object in sloppy mode).

- **Passing arguments into an IIFE** — You can pass values directly into the invocation `()` and
  receive them as parameters inside the function.

  ```js
  ((name) => {
    console.log(`Hello, ${name}!`); // "Hello, Alice!"
  })("Alice");
  ```

  This is useful when you want to capture an outer variable's current value at the time of
  invocation, preventing issues with closures inside loops.

### Why Use an IIFE?

- **Scope isolation (pre-ES6 module pattern)** — Variables declared inside an IIFE are invisible
  to the outside world. Before `let`, `const`, and ES Modules existed, this was the standard way
  to create private state.

  ```js
  const counter = (function () {
    let count = 0; // PRIVATE — not accessible from outside

    return {
      increment() { return ++count; },
      getCount()  { return count; },
    };
  })();

  counter.increment();
  counter.increment();
  console.log(counter.getCount()); // 2
  console.log(counter.count);      // undefined — private, can't be read directly
  ```

  Today, ES Modules (`import`/`export`) handle this naturally, so IIFEs are less common — but you
  will still see them in older codebases and bundler output.

- **Avoiding global scope pollution** — Everything declared inside an IIFE stays local. Nothing
  leaks into `window` or the global object.

  ```js
  (function () {
    const helperVar = "I don't pollute global scope";
    function helperFn() {}
  })();

  console.log(typeof helperVar); // "undefined" — doesn't exist outside
  ```

  Without the IIFE, `helperVar` and `helperFn` would be globals (if declared with `var` or
  `function` at the top level), which can cause name clashes in large scripts.

- **One-time initialization** — Run setup code exactly once and freeze the result so it can never
  be accidentally mutated later.

  ```js
  const config = (() => {
    const env = process.env.NODE_ENV || "development";
    const apiUrl = env === "production"
      ? "https://api.example.com"
      : "http://localhost:3000";

    return Object.freeze({ env, apiUrl }); // frozen — can't be changed
  })();

  console.log(config.apiUrl); // "http://localhost:3000"
  config.apiUrl = "hacked";   // silently ignored — object is frozen
  ```

- **Fixing the classic `var` + loop closure bug** — Before `let`, `var` in a loop doesn't create a
  new binding per iteration. Wrapping the loop body in an IIFE captures the current value of `i`
  immediately.

  ```js
  // ❌ Bug: all timeouts log "3" because var i is shared
  for (var i = 0; i < 3; i++) {
    setTimeout(function () { console.log(i); }, 1000);
  }

  // ✅ Fix with IIFE: each iteration captures its own copy of i
  for (var i = 0; i < 3; i++) {
    (function (j) {
      setTimeout(function () { console.log(j); }, 1000); // 0, 1, 2
    })(i); // pass current i as j
  }

  // ✅ Modern fix: just use let — block-scoped, new binding every iteration
  for (let i = 0; i < 3; i++) {
    setTimeout(function () { console.log(i); }, 1000); // 0, 1, 2
  }
  ```

> **Source:**
> - MDN — "IIFE": https://developer.mozilla.org/en-US/docs/Glossary/IIFE
> - JavaScript.info — "The old var" (IIFE section): https://javascript.info/var#iife

---

## 7. Higher-Order Functions

A **higher-order function** is a function that either:

- **Takes one or more functions as arguments** — Instead of passing only data (numbers,
  strings), you pass a *function* as an argument. The receiving function then calls
  it internally. This is how `map`, `filter`, `reduce`, `setTimeout`, and event
  listeners all work. You tell the higher-order function *what to do*, not *how to do it*.

  ```js
  // setTimeout is a higher-order function — it takes a function as an argument
  setTimeout(function() {
    console.log("I was passed in as an argument!");
  }, 1000);
  ```

- **Returns a function** — Instead of returning a number or string, the function
  returns another *function*. This is the foundation of closures, factories, and
  utilities like `debounce`, `throttle`, and `memoize`.

  ```js
  // multiplyBy returns a function — not a number
  function multiplyBy(factor) {
    return function(number) {
      return number * factor;
    };
  }

  const double = multiplyBy(2); // double is now a function
  const triple = multiplyBy(3);

  console.log(double(5)); // 10
  console.log(triple(5)); // 15
  ```

### Functions That Take Functions

```js
// forEach, map, filter, reduce — all higher-order functions
const numbers = [1, 2, 3, 4, 5];

// map takes a function and applies it to each element
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// filter takes a function and keeps elements where it returns true
const evens = numbers.filter(n => n % 2 === 0);
console.log(evens); // [2, 4]

// reduce takes a function that accumulates a single result
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log(sum); // 15
```

### Functions That Return Functions

```js
function createLogger(prefix) {
  return function(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${prefix}] ${timestamp}: ${message}`);
  };
}

const infoLog = createLogger("INFO");
const errorLog = createLogger("ERROR");

infoLog("Server started");    // [INFO] 2025-01-01T...: Server started
errorLog("Connection failed"); // [ERROR] 2025-01-01T...: Connection failed
```

### Building Practical Higher-Order Functions

#### `once` — Execute a function only once

```js
function once(fn) {
  let called = false;
  let result;

  return function(...args) {
    if (called) return result;
    called = true;
    result = fn.apply(this, args);
    return result;
  };
}

const initialize = once(() => {
  console.log("Initialized!");
  return { ready: true };
});

initialize(); // "Initialized!" → { ready: true }
initialize(); // (nothing logged) → { ready: true } — returns cached result
initialize(); // (nothing logged) → { ready: true }
```

#### `pipe` — Compose functions left to right

```js
function pipe(...fns) {
  return function(value) {
    return fns.reduce((acc, fn) => fn(acc), value);
  };
}

const processUser = pipe(
  (name) => name.trim(),
  (name) => name.toLowerCase(),
  (name) => `@${name}`,
);

console.log(processUser("  Alice  ")); // "@alice"
```

#### `curry` — Transform a multi-argument function into a chain of single-argument functions

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

const add = curry((a, b, c) => a + b + c);

console.log(add(1, 2, 3));    // 6
console.log(add(1)(2)(3));    // 6
console.log(add(1, 2)(3));    // 6
console.log(add(1)(2, 3));    // 6
```

#### `debounce` — Delay execution until pausing

```js
function debounce(fn, delay) {
  let timeoutId;

  return function(...args) {
    clearTimeout(timeoutId); // Cancel any previous timer

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Usage: only fires after user stops typing for 300ms
const search = debounce((query) => {
  console.log("Searching for:", query);
}, 300);

search("h");       // canceled
search("he");      // canceled
search("hel");     // canceled
search("hello");   // → fires after 300ms: "Searching for: hello"
```

#### `throttle` — Execute at most once per interval

```js
function throttle(fn, interval) {
  let lastCall = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// Usage: fires at most once per second
const handleScroll = throttle(() => {
  console.log("Scroll position:", window.scrollY);
}, 1000);

window.addEventListener("scroll", handleScroll);
```

> **Source:**
> - MDN — "Functions": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions
> - JavaScript.info — "Decorators and forwarding, call/apply": https://javascript.info/call-apply-decorators
> - JavaScript.info — "Scheduling: setTimeout and setInterval": https://javascript.info/settimeout-setinterval

---

## 8. Exercises

### Exercise Set A: Closure Challenges

```js
// A1. What will this print?
function createFunctions() {
  const result = [];
  for (var i = 0; i < 3; i++) {
    result.push(function() { return i; });
  }
  return result;
}
const fns = createFunctions();
console.log(fns[0]()); // ❓
console.log(fns[1]()); // ❓
console.log(fns[2]()); // ❓

// A2. What will this print?
function outer() {
  let x = 10;
  function inner() {
    console.log(x);
  }
  x = 20;
  return inner;
}
outer()(); // ❓

// A3. What will this print?
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}
const add5 = makeAdder(5);
const add10 = makeAdder(10);
console.log(add5(3));  // ❓
console.log(add10(3)); // ❓
console.log(add5(add10(3))); // ❓

// A4. Build a function that counts how many times it has been called
function createCallCounter(fn) {
  // YOUR CODE HERE
  // Returns a wrapped function that tracks calls
  // The wrapped function should also have a .count property
}
```

<details>
<summary><strong>Answers</strong></summary>

```
A1: 3, 3, 3 — All three functions close over the SAME `i` (var).
              By the time they're called, the loop is done and i = 3.

A2: 20 — Closures capture the VARIABLE, not the VALUE.
         When inner() is called, x has been changed to 20.

A3: 8, 13, 18 — add5 closes over x=5; add10 closes over x=10.
                 add5(3) = 8, add10(3) = 13, add5(13) = 18.

A4:
function createCallCounter(fn) {
  function wrapped(...args) {
    wrapped.count++;
    return fn(...args);
  }
  wrapped.count = 0;
  return wrapped;
}

const countedLog = createCallCounter(console.log);
countedLog("a");     // "a"
countedLog("b");     // "b"
console.log(countedLog.count); // 2
```

</details>

### Exercise Set B: `this` Binding

```js
// B1. What does each log?
const obj = {
  name: "Alice",
  regularMethod: function() {
    console.log(this.name);
  },
  arrowMethod: () => {
    console.log(this.name);
  },
};
obj.regularMethod();
obj.arrowMethod();

// B2. What does this log?
const user = {
  name: "Alice",
  greet() {
    console.log(this.name);
  }
};
const greet = user.greet;
greet();

// B3. What does this log?
function Dog(name) {
  this.name = name;
  this.bark = function() {
    setTimeout(function() {
      console.log(this.name + " says woof!");
    }, 100);
  };
  this.barkArrow = function() {
    setTimeout(() => {
      console.log(this.name + " says woof!");
    }, 100);
  };
}
const rex = new Dog("Rex");
rex.bark();      // ❓
rex.barkArrow(); // ❓

// B4. What does this log?
const a = { name: "A" };
const b = { name: "B" };

function showName() {
  console.log(this.name);
}

const boundToA = showName.bind(a);
boundToA();         // ❓
boundToA.call(b);   // ❓ — Can call override bind?
```

<details>
<summary><strong>Answers</strong></summary>

```
B1: "Alice", undefined (or "" in browser)
    regularMethod: Rule 2 (implicit) → this = obj
    arrowMethod: lexical this → this = enclosing scope (global)

B2: undefined (strict mode) or "" (non-strict browser)
    Extracting a method loses implicit binding → Rule 1 (default)

B3: After 100ms:
    bark: "undefined says woof!" (or throws) — regular callback loses `this`
    barkArrow: "Rex says woof!" — arrow inherits `this` from barkArrow method

B4: "A", "A"
    bind cannot be overridden by call/apply. First bind wins.
```

</details>

### Exercise Set C: Build These Functions

```js
// C1. Implement your own myBind
Function.prototype.myBind = function(context, ...boundArgs) {
  // YOUR CODE
};

// C2. Implement once(fn) — fn can only execute once
function once(fn) {
  // YOUR CODE
}

// C3. Implement pipe(...fns)
function pipe(...fns) {
  // YOUR CODE
}

// C4. Implement memoize(fn)
function memoize(fn) {
  // YOUR CODE
}
```

<details>
<summary><strong>Solutions</strong></summary>

```js
// C1.
Function.prototype.myBind = function(context, ...boundArgs) {
  const fn = this;
  return function(...callArgs) {
    return fn.apply(context, [...boundArgs, ...callArgs]);
  };
};

// C2.
function once(fn) {
  let called = false;
  let result;
  return function(...args) {
    if (called) return result;
    called = true;
    result = fn.apply(this, args);
    return result;
  };
}

// C3.
function pipe(...fns) {
  return function(value) {
    return fns.reduce((acc, fn) => fn(acc), value);
  };
}

// C4.
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

</details>

---

## 9. Milestone Project

### Build: A Configurable Rate Limiter

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project uses closures, higher-order functions, and `this` binding.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | Closures & scope chain | Week 1 ✅ |
> | Higher-order functions | Week 3 (this week) |
> | `Date.now()`, `setTimeout` | Week 3 (this week) |
> | Rest parameters `...args` | Week 3 (this week) |
> | `Function.prototype.apply()` | Week 3 (this week) |
> | `this` binding | Week 3 (this week) |
> | Adding methods to functions as properties | Week 3 (this week) |
>
> ✅ Complete all of Week 3 before starting this project.

Create a `createRateLimiter` factory that uses closures, higher-order functions,
and `this` binding. This is a real-world utility used in production APIs.

```js
// rate-limiter.js

function createRateLimiter(fn, maxCalls, windowMs) {
  let callCount = 0;
  let windowStart = Date.now();
  const queue = [];

  function resetWindowIfNeeded() {
    const now = Date.now();
    if (now - windowStart >= windowMs) {
      callCount = 0;
      windowStart = now;
    }
  }

  function limited(...args) {
    resetWindowIfNeeded();

    if (callCount < maxCalls) {
      callCount++;
      return fn.apply(this, args);
    } else {
      const waitTime = windowMs - (Date.now() - windowStart);
      console.log(`Rate limited. Try again in ${waitTime}ms.`);
      return null;
    }
  }

  limited.getRemainingCalls = function() {
    resetWindowIfNeeded();
    return maxCalls - callCount;
  };

  limited.reset = function() {
    callCount = 0;
    windowStart = Date.now();
  };

  return limited;
}

// ============================================================
// Test it
// ============================================================

const limitedLog = createRateLimiter(console.log, 3, 5000);

limitedLog("Call 1"); // ✅ "Call 1"
limitedLog("Call 2"); // ✅ "Call 2"
limitedLog("Call 3"); // ✅ "Call 3"
limitedLog("Call 4"); // ❌ "Rate limited. Try again in XXXms."
limitedLog("Call 5"); // ❌ "Rate limited."

console.log("Remaining:", limitedLog.getRemainingCalls()); // 0

// After 5 seconds, the window resets and calls work again
setTimeout(() => {
  limitedLog("Call 6"); // ✅ "Call 6"
  console.log("Remaining:", limitedLog.getRemainingCalls()); // 2
}, 5100);
```

**Your extensions:**
1. Add `debounce(fn, delay)` and `throttle(fn, interval)` factory functions.
2. Add a queue mode: instead of rejecting, hold the call and execute when the
   window resets.
3. Add `onRateLimited(callback)` — a hook that fires when a call is rejected.
4. Track and report stats: `getStats()` returns total calls, rejected calls,
   average calls per window.

---

## 10. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Functions guide | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions |
| Arrow functions | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions |
| Functions basics | JavaScript.info | https://javascript.info/function-basics |
| Arrow functions basics | JavaScript.info | https://javascript.info/arrow-functions-basics |
| First-class Function | MDN | https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function |
| Function expressions | JavaScript.info | https://javascript.info/function-expressions |
| Closures | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures |
| Closure (scope) | JavaScript.info | https://javascript.info/closure |
| Scope & Closures book | YDKJS (2nd ed), Ch 7 | https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch7.md |
| Closures video | Namaste JS (Akshay Saini) | https://www.youtube.com/watch?v=qikxEIxsXco |
| `this` keyword | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this |
| Function.prototype.bind | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind |
| Function.prototype.call | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call |
| Object methods, this | JavaScript.info | https://javascript.info/object-methods |
| this & Prototypes book | YDKJS (1st ed), Ch 1-2 | https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/this%20%26%20object%20prototypes/ch2.md |
| Arrow functions revisited | JavaScript.info | https://javascript.info/arrow-functions |
| IIFE | MDN | https://developer.mozilla.org/en-US/docs/Glossary/IIFE |
| The old var (IIFE) | JavaScript.info | https://javascript.info/var#iife |
| Decorators/forwarding | JavaScript.info | https://javascript.info/call-apply-decorators |
| Scheduling | JavaScript.info | https://javascript.info/settimeout-setinterval |
