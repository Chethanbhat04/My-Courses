# Week 2 — Data Types, Type Coercion, and Memory

# The Complete Deep-Dive Lesson

> **By the end of this lesson you will understand how JavaScript stores values
> in memory, how it converts between types, and why some of JS's most confusing
> behaviors are actually following strict rules.**

---

## Table of Contents

1. [Primitive vs Reference Types](#1-primitive-vs-reference-types)
2. [Stack vs Heap Memory](#2-stack-vs-heap-memory)
3. [Type Coercion — The Complete Rules](#3-type-coercion--the-complete-rules)
4. [Truthy, Falsy, and the Edge Cases](#4-truthy-falsy-and-the-edge-cases)
5. [typeof, instanceof, and Their Quirks](#5-typeof-instanceof-and-their-quirks)
6. [Value vs Reference — Passing Data Around](#6-value-vs-reference--passing-data-around)
7. [Garbage Collection](#7-garbage-collection)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. Primitive vs Reference Types

JavaScript has **two categories** of data types. Understanding this distinction
is fundamental to understanding memory, mutation, and comparison.

### The 7 Primitive Types

Primitives are **immutable** and stored **directly** in the variable.

```js
// All 7 primitive types:
const str = "hello";           // string
const num = 42;                // number
const big = 9007199254740991n; // bigint
const bool = true;             // boolean
const undef = undefined;       // undefined
const nul = null;              // null
const sym = Symbol("id");      // symbol
```

**Immutable means the value itself cannot change:**

```js
let greeting = "hello";
greeting[0] = "H";         // ❌ silently fails — strings are immutable
console.log(greeting);      // "hello" — unchanged

greeting = "Hello";         // ✅ this creates a NEW string and reassigns
console.log(greeting);      // "Hello"
```

The variable can be reassigned to point to a new value, but the original string
`"hello"` in memory is never modified.

### Reference Types

Everything that is not a primitive is an **object** — stored on the heap, and
the variable holds a **reference** (memory address) to it.

```js
const obj = { name: "Alice" };  // Object
const arr = [1, 2, 3];          // Array (special type of object)
const fn = function() {};       // Function (special type of object)
const date = new Date();        // Date object
const regex = /pattern/;        // RegExp object
const map = new Map();          // Map object
const set = new Set();          // Set object
```

> **Source:**
> - MDN — "JavaScript data types and data structures": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures
> - JavaScript.info — "Data types": https://javascript.info/types

---

## 2. Stack vs Heap Memory

### The Two Memory Lockers

When your JavaScript program runs, it needs places to store data. It uses two
different "lockers" with very different rules:

#### The Stack (The Organized Filing Cabinet)
- **What goes here:** Primitives (numbers, strings, booleans, etc.) and references (pointers).
- **How it works:** It's small, fast, and extremely organized. Data must have a fixed, known size. Think of it like a neat filing cabinet where every folder is exactly the same thickness.

#### The Heap (The Messy Warehouse)
- **What goes here:** Objects (including arrays, functions, dates, etc.).
- **How it works:** It's large, dynamic, and unorganized. Data here can grow and shrink. Think of it like a massive warehouse where you throw big boxes of stuff, and you just keep a note of the address where you put them.

### How Primitives Are Stored (The Stack)

Because primitives are simple and have a fixed size, they go directly into the Stack.

When you assign a primitive to a new variable, JavaScript creates a **completely new copy** in the Stack.

```js
let a = 10;
// Step 1: JS puts the number 10 into a slot in the Stack labeled 'a'.

let b = a;
// Step 2: JS looks at 'a', sees 10, creates a BRAND NEW 10,
//         and puts it in a new slot labeled 'b'.

b = 20;
// Step 3: JS changes the value in 'b' to 20.

console.log(a); // 10 — completely untouched!
console.log(b); // 20
```

```
STACK:
┌──────────┐
│ a:  10   │  ← original value
│ b:  20   │  ← independent copy (was 10, changed to 20)
└──────────┘
```

**Key takeaway:** Variables holding primitives are completely independent. Changing one never affects the other.

### How Objects Are Stored (The Heap)

Objects can be massive and change size, so they don't fit in the neat filing cabinet (the Stack). They go in the warehouse (the Heap).

But your variable still lives in the Stack. So how does it find the object? It stores an **address** (a reference pointer) in the Stack that points to the location in the Heap.

When you copy an object variable, you are **only copying the address**, not the object itself!

```js
let user1 = { name: "Alice" };
// Step 1: JS builds the object { name: "Alice" } in the Heap warehouse.
//         It puts the address (e.g., 0x3A2F) in the Stack under 'user1'.

let user2 = user1;
// Step 2: JS copies the ADDRESS from 'user1' to 'user2'.
//         It does NOT copy the object. Both point to the same place!

user2.name = "Bob";
// Step 3: We use 'user2' to go to the address and change the name to "Bob".

console.log(user1.name); // "Bob" — CHANGED! (!)
// Because 'user1' looks at the exact same address we just modified.
console.log(user2.name); // "Bob"
```

```
STACK:                          HEAP:
┌────────────────┐             ┌─────────────────┐
│ user1: 0x3A2F  │─────────┬─▶│ { name: "Bob" } │
│ user2: 0x3A2F  │─────────┘  │                  │
└────────────────┘             └─────────────────┘

Both variables point to the SAME object in heap memory.
Changing the object through one reference affects the other.
```

### Creating Independent Copies

```js
const original = { name: "Alice", scores: [90, 85] };

// Shallow copy — top-level properties are copied, nested objects still shared
const shallow = { ...original };
shallow.name = "Bob";           // ✅ does NOT affect original
shallow.scores.push(100);       // ❌ DOES affect original — scores is shared!
console.log(original.scores);   // [90, 85, 100] — mutated!

// Deep copy — everything is copied recursively
const deep = structuredClone(original);
deep.scores.push(100);          // ✅ does NOT affect original
console.log(original.scores);   // [90, 85] — untouched
```

### Equality with Reference Types

```js
const a = { x: 1 };
const b = { x: 1 };
const c = a;

console.log(a === b);  // false — different objects in memory (different addresses)
console.log(a === c);  // true — same reference (same address)
```

`===` compares **references** for objects, not contents. Two objects with
identical contents are NOT equal unless they are the same object.

> **Source:**
> - MDN — "Memory management": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management
> - JavaScript.info — "Object references and copying": https://javascript.info/object-copy
> - V8 Blog — "Trash talk: the Orinoco garbage collector": https://v8.dev/blog/trash-talk

---

## 3. Type Coercion — The Complete Rules

### What Is Coercion?

**Type coercion** is JavaScript's automatic conversion of values from one type
to another when operators or comparisons expect a different type.

There are two kinds:
- **Explicit coercion** (you do it on purpose): `Number("42")`, `String(42)`
- **Implicit coercion** (the engine does it): `"5" * 2` → `10`

### The Three Abstract Operations

The ECMAScript spec defines three internal operations that coercion uses:

#### 1. ToPrimitive (for objects → primitive)

**Why this exists:** Operators like `+` or `-` only know how to work with primitive values (like numbers or strings). If you try to add an object to a number (`{ x: 1 } + 5`), JavaScript doesn't know what to do. It has to convert the object into a primitive first.

**How it works (The "Hint"):**
When JS needs to convert an object, it first decides what *type* of primitive it prefers based on what you're trying to do. This preference is called a **hint**:
- If you're doing math (`obj - 5`), the hint is `"number"`.
- If you're doing string interpolation (`` `${obj}` ``), the hint is `"string"`.
- If you're using `+` which can do either, the hint is `"default"` (which usually acts like "number").

Once JS knows the hint, it calls specific methods on your object to get a primitive value, in this order:
1. `[Symbol.toPrimitive](hint)` — if you wrote this advanced custom method, JS uses it.
2. `valueOf()` — if the hint is "number", JS tries this first.
3. `toString()` — if the hint is "string", JS tries this first.


```js
const obj = {
  valueOf() { 
    return 42; 
  },
  toString() { 
    return "hello"; 
  },
};

// 1. Math operation → hint is "number" → JS calls valueOf()
console.log(obj - 0);    // 42       (42 - 0 = 42)

// 2. Template literal → hint is "string" → JS calls toString()
console.log(`${obj}`);   // "hello"

// 3. The '+' operator → hint is "default" → JS tries valueOf() first
console.log(obj + "");   // "42"     (42 + "" = "42")
```

#### 2. ToNumber (anything → number)

| Input | Result |
|-------|--------|
| `undefined` | `NaN` |
| `null` | `0` |
| `true` | `1` |
| `false` | `0` |
| `""` (empty string) | `0` |
| `"123"` | `123` |
| `"hello"` | `NaN` |
| `[] ` (empty array) | `0` (→ `""` → `0`) |
| `[5]` | `5` (→ `"5"` → `5`) |
| `{}` | `NaN` |

#### 3. ToString (anything → string)

| Input | Result |
|-------|--------|
| `undefined` | `"undefined"` |
| `null` | `"null"` |
| `true` | `"true"` |
| `false` | `"false"` |
| `42` | `"42"` |
| `[]` | `""` |
| `[1,2]` | `"1,2"` |
| `{}` | `"[object Object]"` |

### The `+` Operator Rules

The `+` operator is special — it can do addition OR string concatenation.

**Rule:** If **either** operand is a string, `+` does string concatenation.
Otherwise, it does numeric addition.

```js
console.log(5 + 3);        // 8          (number + number → addition)
console.log("5" + 3);      // "53"       (string + number → concatenation)
console.log(5 + "3");      // "53"       (number + string → concatenation)
console.log("5" + "3");    // "53"       (string + string → concatenation)
console.log(5 + 3 + "px"); // "8px"      (5+3=8, then 8+"px"="8px" — left to right)
console.log("$" + 5 + 3);  // "$53"      ("$"+5="$5", then "$5"+3="$53")
console.log(5 + null);     // 5          (null → 0)
console.log(5 + undefined);// NaN        (undefined → NaN)
console.log("5" - 3);      // 2          (- always does number math, "5" → 5)
console.log("5" * "3");    // 15         (* always does number math)
console.log(true + true);  // 2          (true → 1, 1 + 1 = 2)
```

### `==` vs `===` — The Abstract Equality Algorithm

`===` (**strict equality**) never converts types. Different types → always `false`.

`==` (**abstract equality**) converts types following specific rules defined in
the ECMAScript spec (§7.2.14):

```
If types are the same    → compare values directly
null == undefined         → true (special case)
null == anything else     → false
undefined == anything else→ false
number == string          → string is converted to number, then compare
boolean == anything       → boolean is converted to number FIRST, then compare
object == primitive       → object is converted to primitive (ToPrimitive)
```

### Tracing `==` Step by Step

```js
// Example 1: [] == false
// Step 1: boolean on one side → convert false to number → 0
// Step 2: [] == 0 → object vs number → convert [] to primitive
// Step 3: [].toString() → "" → ToNumber("") → 0
// Step 4: 0 == 0 → true ✅

console.log([] == false);    // true

// Example 2: [] == ![]
// Step 1: ![] → false ([] is truthy, so ![] is false)
// Step 2: [] == false → same as above → true

console.log([] == ![]);      // true (this looks insane but follows the rules)

// Example 3: "" == 0
// Step 1: string vs number → convert "" to number → 0
// Step 2: 0 == 0 → true

console.log("" == 0);        // true

// Example 4: null == undefined
// Special rule in the spec → true

console.log(null == undefined); // true
console.log(null == 0);         // false (null only == undefined)
console.log(null == "");        // false
```

> **Professional rule:** Always use `===` in production code. Use `==` only
> for the `null`/`undefined` check: `if (x == null)` catches both.

> **Source:**
> - ECMAScript §7.2.14 "Abstract Equality Comparison": https://tc39.es/ecma262/#sec-abstract-equality-comparison
> - MDN — "Equality comparisons and sameness": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
> - JavaScript.info — "Comparisons": https://javascript.info/comparison
> - JavaScript.info — "Type Conversions": https://javascript.info/type-conversions
> - You Don't Know JS: Types & Grammar, Ch 4: https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/types%20%26%20grammar/ch4.md

---

## 4. Truthy, Falsy, and the Edge Cases

### The 8 Falsy Values (memorize these)

```js
Boolean(false)       // false
Boolean(0)           // false
Boolean(-0)          // false
Boolean(0n)          // false (BigInt zero)
Boolean("")          // false (empty string)
Boolean(null)        // false
Boolean(undefined)   // false
Boolean(NaN)         // false
```

**Everything else is truthy**, including many values that surprise people:

```js
Boolean("0")          // true — it's a non-empty string!
Boolean(" ")          // true — space is a character!
Boolean("false")      // true — it's a non-empty string!
Boolean([])           // true — empty array is truthy!
Boolean({})           // true — empty object is truthy!
Boolean(function(){}) // true — functions are truthy!
Boolean(-1)           // true — any non-zero number!
Boolean(Infinity)     // true
```

### Using Truthy/Falsy in Conditionals

```js
const name = "";
if (name) {
  console.log("Has name");
} else {
  console.log("No name"); // ← this runs (empty string is falsy)
}

// Shorthand with ||
const displayName = name || "Anonymous"; // "Anonymous"

// Shorthand with ??  (nullish coalescing — only null/undefined)
const value = 0;
console.log(value || 10);   // 10 (0 is falsy, so || skips it)
console.log(value ?? 10);   // 0  (?? only checks null/undefined, 0 is fine)
```

### The `??` Operator vs `||`

| Expression | `\|\|` Result | `??` Result | Why |
|------------|-------------|-------------|-----|
| `0 \|\| 10` / `0 ?? 10` | `10` | `0` | `\|\|` treats `0` as falsy; `??` only treats `null`/`undefined` as nullish |
| `"" \|\| "default"` / `"" ?? "default"` | `"default"` | `""` | Same logic |
| `null \|\| "default"` / `null ?? "default"` | `"default"` | `"default"` | Both agree on `null` |
| `false \|\| "default"` / `false ?? "default"` | `"default"` | `false` | `??` doesn't treat `false` as nullish |

> **Source:**
> - MDN — "Falsy": https://developer.mozilla.org/en-US/docs/Glossary/Falsy
> - MDN — "Nullish coalescing operator": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
> - JavaScript.info — "Logical operators": https://javascript.info/logical-operators
> - JavaScript.info — "Nullish coalescing operator '??'": https://javascript.info/nullish-coalescing-operator

---

## 5. typeof, instanceof, and Their Quirks

### typeof Results

```js
console.log(typeof "hello");      // "string"
console.log(typeof 42);           // "number"
console.log(typeof 42n);          // "bigint"
console.log(typeof true);         // "boolean"
console.log(typeof undefined);    // "undefined"
console.log(typeof Symbol("x"));  // "symbol"
console.log(typeof function(){}); // "function"

// THE QUIRKS:
console.log(typeof null);         // "object" ← BUG from 1995, never fixed
console.log(typeof []);           // "object" ← arrays are objects
console.log(typeof {});           // "object"
console.log(typeof NaN);          // "number" ← NaN is technically a number type
```

### The typeof null Quirk

In the original engine, every value was stored as a type tag + value. Objects had type tag `0`. `null` was the NULL pointer — all zeros — so its tag was also `0`. The engine read that tag and returned `"object"`. The bug was never fixed because correcting it would break too much existing code.

```js
console.log(typeof null); // "object" — incorrect, but permanent
```

To actually check for `null`, use strict equality:

```js
const val = null;
console.log(val === null); // true ✅
```

### Checking for Arrays and Null

```js
// Check for null:
const val = null;
console.log(val === null); // true ← use strict equality

// Check for arrays:
console.log(Array.isArray([1, 2]));   // true
console.log(Array.isArray("hello"));  // false
console.log(Array.isArray({ 0: "a", length: 1 })); // false
```

### NaN — Not a Number (But Its Type Is Number)

```js
console.log(typeof NaN);         // "number" — yes, really
console.log(NaN === NaN);        // false — NaN is not equal to itself!
console.log(NaN == NaN);         // false — same with ==

// How to check for NaN:
console.log(Number.isNaN(NaN));  // true ✅
console.log(Number.isNaN("hello")); // false ✅ (unlike global isNaN)
console.log(isNaN("hello"));    // true ❌ (converts "hello" to number first → NaN)
```

### `isNaN()` vs `Number.isNaN()` — The Critical Difference

The global `isNaN()` and `Number.isNaN()` both check for NaN, but they behave **very differently**.

**Global `isNaN(value)`** — The Unreliable One:
1. First **coerces** the value to a number using `Number(value)`.
2. Then checks if the result is `NaN`.
3. This causes **false positives** — values that aren't `NaN` get reported as `NaN`.

**`Number.isNaN(value)`** — The Reliable One (ES6+):
1. Does **no type coercion** at all.
2. Returns `true` **only** if the value is already the actual `NaN` value.
3. This is the one you should **always use**.

```js
// ── Global isNaN() — coerces first, then checks ──
isNaN(NaN);          // true  ✅ (NaN is NaN)
isNaN("hello");      // true  ❌ MISLEADING! ("hello" → Number("hello") → NaN → true)
isNaN(undefined);    // true  ❌ MISLEADING! (undefined → Number(undefined) → NaN → true)
isNaN({});           // true  ❌ MISLEADING! ({} → Number({}) → NaN → true)
isNaN("123");        // false (coerces "123" → 123, which is a valid number)
isNaN("");           // false (coerces "" → 0, which is a valid number)
isNaN(true);         // false (coerces true → 1)
isNaN(null);         // false (coerces null → 0)

// ── Number.isNaN() — no coercion, strict check ──
Number.isNaN(NaN);         // true  ✅ (the only value that returns true)
Number.isNaN("hello");     // false ✅ ("hello" is a string, not NaN)
Number.isNaN(undefined);   // false ✅ (undefined is not NaN)
Number.isNaN({});          // false ✅ ({} is not NaN)
Number.isNaN("123");       // false ✅
Number.isNaN("");          // false ✅
Number.isNaN(true);        // false ✅
Number.isNaN(null);        // false ✅
```

**Side-by-side comparison:**

| Input         | `isNaN()`  | `Number.isNaN()` | Why they differ |
|---------------|-----------|-------------------|-----------------|
| `NaN`         | `true` ✅ | `true` ✅         | Both agree — it's actually NaN |
| `"hello"`     | `true` ❌ | `false` ✅        | `isNaN` coerces `"hello"` → `NaN` first |
| `undefined`   | `true` ❌ | `false` ✅        | `isNaN` coerces `undefined` → `NaN` first |
| `{}`          | `true` ❌ | `false` ✅        | `isNaN` coerces `{}` → `NaN` first |
| `"123"`       | `false`   | `false`           | `isNaN` coerces `"123"` → `123` (valid) |
| `null`        | `false`   | `false`           | `isNaN` coerces `null` → `0` (valid) |
| `true`        | `false`   | `false`           | `isNaN` coerces `true` → `1` (valid) |
| `0 / 0`       | `true` ✅ | `true` ✅         | `0/0` evaluates to `NaN` |

> **Note: Mental Model:**
> - `isNaN(x)` asks: *"If I tried to convert x to a number, would I get NaN?"*
> - `Number.isNaN(x)` asks: *"Is x literally the value NaN right now?"*

> ** Rule of Thumb:** Always use `Number.isNaN()`. The global `isNaN()` is a legacy quirk from ES1 that exists only for backward compatibility.

> **Source:**
> - MDN — "typeof": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
> - MDN — "NaN": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN
> - MDN — "isNaN()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
> - MDN — "Number.isNaN()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
> - The typeof null bug explained: https://2ality.com/2013/10/typeof-null.html
> - JavaScript.info — "Data types": https://javascript.info/types

---

## 6. Value vs Reference — Passing Data Around

When you pass data into a function, JavaScript behaves differently depending on whether that data is a **Primitive** or an **Object**. 

### Primitives (Pass by Value)
When you pass a primitive (number, string, boolean), JavaScript creates an **independent copy** of the value.
* **Analogy:** Giving someone a **photocopy** of a document. They can scribble all over their copy, but your original document is untouched.
* **Result:** The function **cannot** change your original data.

### Objects (Pass by Reference)
When you pass an object or array, JavaScript does NOT copy the object. It copies the **memory address** (reference) that points to the object.
* **What this means:** Both the caller's variable and the function's parameter now point to the **exact same object in memory**.
* **Result:** If the function modifies the object's properties, those changes are visible outside the function too — you're both looking at the same data.

### Passing Primitives to Functions

```js
function increment(num) {
  // Step 2: "num" is a COPY of whatever was passed in.
  //         Right now, num = 10 (a copy of x's value).
  num = num + 1;
  // Step 3: We changed the COPY. num is now 11.
  //         But x (outside) is still 10 — we never touched x.
  console.log("inside:", num); // 11
}

let x = 10;
// Step 1: We call increment and pass x.
//         JavaScript COPIES the value 10 and gives the copy to "num".
increment(x);
// Step 4: Back outside. x was never modified — only the copy was.
console.log("outside:", x);   // 10 — unchanged!
```

```text
What happened in memory:

1. BEFORE increment(x):
   ┌──────────┐
   │ x:  10   │
   └──────────┘

2. INSIDE increment(num):
   ┌──────────┐
   │ x:  10   │ (untouched)
   │ num: 11  │ (copy, changed)
   └──────────┘

3. AFTER increment(x):
   ┌──────────┐
   │ x:  10   │ (still 10!)
   │          │ (num is gone)
   └──────────┘
```

**Key takeaway:** `num` received a **copy** of `x`'s value. Changing `num`
is like scribbling on a photocopy — the original (`x`) is completely unaffected.
When the function ends, `num` disappears entirely.

### Passing Objects to Functions

Now let's see the "duplicate key" behavior. This is where it gets important:

```js
function changeName(user) {
  // Step 2: "user" received a copy of person's REFERENCE (address).
  //         Both "person" and "user" now point to the SAME object.
  user.name = "Bob";
  // Step 3: We used the reference to reach INTO the shared object
  //         and changed its "name" property. The object itself is modified.
}

const person = { name: "Alice" };
// Step 1: We call changeName and pass person.
//         JavaScript copies the REFERENCE (address), not the object.
changeName(person);
// Step 4: person.name is now "Bob" because changeName modified the
//         same object that person points to.
console.log(person.name); // "Bob" — changed!
```

```
What happened in memory:

  person and user both point to the SAME object:

  STACK:                          HEAP:
  ┌────────────────┐             ┌──────────────────────┐
  │ person: 0x3A2F │──────┬─────▶│ { name: "Bob" }     │
  │ user:   0x3A2F │──────┘      │ (was "Alice", now    │
  └────────────────┘             │  changed to "Bob")   │
                                 └──────────────────────┘
```

**Key takeaway:** `user` received a copy of the **reference** (address), not a
copy of the object. Both `person` and `user` point to the **same object** in
memory. So when `changeName` modifies `user.name`, it's reaching into the
same object that `person` points to. The change is visible everywhere.

### But Wait — Reassigning the Parameter Does NOT Affect the Original

This is the tricky part that catches people. What if, instead of modifying a
property, we reassign the entire parameter to a new object?

```js
function replaceUser(user) {
  // Step 2: "user" currently points to the same object as "person".
  user = { name: "Carol" };
  // Step 3: We just created a BRAND NEW object and pointed "user" to it.
  //         We did NOT change the original object — we just changed where
  //         the local "user" variable points. "person" still points to
  //         the original object.
  console.log("inside:", user.name); // "Carol"
}

const person = { name: "Alice" };
// Step 1: Pass the reference.
replaceUser(person);
// Step 4: person still points to the ORIGINAL object.
//         The function only changed its own local copy of the reference.
console.log("outside:", person.name); // "Alice" — unchanged!
```

**Why?** Because `user = { name: "Carol" }` doesn't modify the existing
object — it creates a **completely new object** and makes the local `user`
variable point to it instead. The original `person` variable still points
to the old object. It's like someone threw away your duplicate key and bought
a different house — your house and your key are unaffected.

```
Before:
  person → { name: "Alice" }  ← user also points here

After user = { name: "Carol" }:
  person → { name: "Alice" }  ← person still points to the original
  user   → { name: "Carol" }  ← user now points to a NEW object
```

This is why JavaScript is described as **"pass by value of the reference"**
— the reference (address) is copied, but it's still a copy. You can use the
copy to reach into the shared object and modify it (like using a duplicate key),
but reassigning the copy itself (like throwing away the key and getting a new
one) doesn't affect the original.

### Summary: The Rule to Remember

> **Mutating** (changing properties/elements) through a reference → ✅ affects the original
>
> **Reassigning** the reference itself → ❌ does NOT affect the original
>
> **Primitives** → always a copy, ❌ never affects the original

### Pure Functions and Avoiding Mutation

Now that you understand *why* objects can be changed by functions, you can see
why this is sometimes a **problem**. If a function changes your data
unexpectedly, it can cause hard-to-find bugs. The solution is to write
**pure functions** — functions that don't modify their inputs.

```js
// IMPURE — mutates the input (dangerous!)
function addItemBad(arr, item) {
  arr.push(item);  // ❌ mutates the original array
  return arr;
}

// PURE — returns a new array (safe!)
function addItemGood(arr, item) {
  return [...arr, item]; // ✅ creates a new array, original untouched
}

const list = [1, 2, 3];

addItemBad(list, 4);
console.log(list);  // [1, 2, 3, 4] — original was mutated! (!)

const newList = addItemGood(list, 5);
console.log(list);    // [1, 2, 3, 4] — original untouched ✅
console.log(newList); // [1, 2, 3, 4, 5] — new array with the addition
```

**Why `addItemBad` is dangerous:** Because `arr` points to the same array as
`list`, calling `arr.push(item)` modifies the original `list`. Anyone else
using `list` will see the change, which can cause unexpected bugs.

**Why `addItemGood` is safe:** The spread operator `[...arr, item]` creates a
**brand new array** with all the old elements plus the new one. The original
`list` is never touched.

> **Source:**
> - JavaScript.info — "Object references and copying": https://javascript.info/object-copy
> - MDN — "Spread syntax": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
> - MDN — "structuredClone()": https://developer.mozilla.org/en-US/docs/Web/API/structuredClone

---

## 7. Garbage Collection

### What Is It?

JavaScript automatically frees memory that is no longer reachable. You don't
manually allocate or free memory (unlike C/C++). The algorithm is called
**Mark-and-Sweep**.

### Mark-and-Sweep Algorithm

```
Step 1: Start from "roots" (global object, current call stack variables)
Step 2: Traverse all references from roots — MARK everything reachable
Step 3: SWEEP — delete everything NOT marked

┌─ ROOTS ────────────────┐
│ global, call stack     │
│ variables              │
└───────┬────────────────┘
        │ can reach
        ▼
   ┌─ Object A ───┐        ┌─ Object C ─┐
   │ (MARKED ✓)   │──────▶│ (MARKED ✓) │
   └──────────────┘        └────────────┘

                         ┌─ Object B ──────┐
                         │ (not marked)    │ ← no references from roots
                         │ SWEPT [removed]️ │ ← garbage collected
                         └─────────────────┘
```

### Common Memory Leak Patterns

> **The Big Idea:** A memory leak happens when JavaScript keeps data alive
> in memory even though you'll never use it again. The garbage collector can't
> clean it up because something is **still holding a reference** to it.
>
> Think of the GC as a janitor who can only throw away **rooms no one has a
> key to**. A memory leak = **you forgot to hand back the key.**

---

**1. Forgotten timers (`setInterval`):**

`setInterval` runs **forever** until you explicitly stop it. If a closure
inside that interval holds onto data, that data is **stuck in memory forever.**

```js
// ❌ LEAK: interval is never cleared
function startPolling() {
  const data = new Array(1000000).fill("x"); // 1 million items!

  setInterval(() => {
    // This arrow function is a CLOSURE — it holds onto `data` from outer scope.
    // Since the interval never stops → arrow fn never dies → `data` never freed.
    console.log(data.length); // closure keeps `data` alive forever!
  }, 1000);
}

// Why it leaks, step by step:
// 1. setInterval keeps running every second — forever.
// 2. The arrow function inside is alive as long as the interval runs.
// 3. The arrow function is a closure that captured `data`.
// 4. Since the closure is alive, `data` (1 million items!) stays in memory.
// 5. Result: memory grows and never gets freed. [!]
```

```js
// ✅ FIX: Store the interval ID and clear it when done
function startPolling() {
  const data = new Array(1000000).fill("x");
  const id = setInterval(() => {
    console.log(data.length);
  }, 1000);

  // Clear after 5 seconds → interval stops → closure dies → data is freed ✅
  setTimeout(() => clearInterval(id), 5000);
}
```

---

**2. Detached DOM nodes:**

Removing an element from the page does NOT remove it from memory.
If a JavaScript variable still points to it, the GC cannot collect it.

```js
// ❌ LEAK: element is removed from DOM but JS still holds a reference
const element = document.getElementById("myDiv");
document.body.removeChild(element);
// The element is gone from the page visually...
// ...but `element` variable still points to it in memory!
// GC says: "Someone still has the key → I can't throw it away."

// ✅ FIX: Null out the reference after removing
element = null;
// Now nothing points to the element → GC can collect it ✅
```

> **Key insight:** `removeChild()` removes the element from the **DOM tree**
> (the page). It does NOT remove it from **memory**. You must release the
> JS reference yourself by setting it to `null`.

---

**3. Closures holding large data unnecessarily:**

A closure captures variables from its outer scope. If it captures a **huge
object** but only needs a tiny piece of it, the whole object stays alive.

```js
// ❌ LEAK: closure captures entire `hugeData` even though only `length` is needed
function process() {
  const hugeData = new Array(1000000).fill("x"); // 1 million items

  return function() {
    // This closure only uses hugeData.length (just the number 1000000),
    // but it drags the ENTIRE 1-million-item array along with it!
    console.log(hugeData.length);
  };
}

const fn = process();
fn(); // `hugeData` (1 million items) stays alive as long as `fn` exists [!]
```

```js
// ✅ FIX: Extract only the value you need BEFORE the closure captures it
function process() {
  const hugeData = new Array(1000000).fill("x");
  const len = hugeData.length; // ← Save just the number (not the whole array)

  return function() {
    console.log(len); // Closure only captures `len` — a single number ✅
  };
}

// Now `hugeData` (1 million items) is no longer referenced by the closure.
// The GC can collect it as soon as process() finishes. ✅
```

---

**Quick Summary:**

| Leak Type | What holds the reference | The Fix |
|---|---|---|
| **Forgotten timer** | `setInterval` callback (closure) | `clearInterval(id)` when done |
| **Detached DOM node** | JS variable still pointing to the element | Set the variable to `null` |
| **Closure + huge data** | Closure captures entire object unnecessarily | Extract only the value you need |

> **Golden Rule:** A memory leak = something you're done with, but
> JavaScript can't throw away because a reference still exists somewhere.
> Find that reference and remove it.

> **Source:**
> - MDN — "Memory management": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management
> - JavaScript.info — "Garbage collection": https://javascript.info/garbage-collection
> - V8 Blog — "Trash talk: the Orinoco garbage collector": https://v8.dev/blog/trash-talk
> - Chrome DevTools — "Fix memory problems": https://developer.chrome.com/docs/devtools/memory-problems

---

## 8. Exercises

### Exercise Set A: Type Coercion — Predict the Output

```js
// A1.
console.log("5" + 3);
console.log("5" - 3);
console.log("5" * "3");

// A2.
console.log(true + true + true);
console.log(true + "hello");

// A3.
console.log([] + []);
console.log([] + {});
console.log({} + []);

// A4.
console.log(null == undefined);
console.log(null === undefined);
console.log(null == 0);
console.log(null == "");

// A5.
console.log("" == 0);
console.log("" === 0);
console.log(" " == 0);

// A6.
console.log(NaN == NaN);
console.log(NaN === NaN);
console.log(Number.isNaN(NaN));
console.log(Number.isNaN("hello"));

// A7.
console.log(typeof null);
console.log(typeof undefined);
console.log(typeof NaN);
console.log(typeof []);

// A8.
console.log(Boolean("0"));
console.log(Boolean(0));
console.log(Boolean(""));
console.log(Boolean([]));
console.log(Boolean({}));
```

<details>
<summary><strong>Answers</strong></summary>

```
A1: "53", 2, 15
    (+ with string → concatenation; - and * → numeric)

A2: 3, "truehello"
    (true+true = 1+1=2, +true = 3; true+"hello" → "true"+"hello")

A3: "" (two empty arrays → toString → "" + "" = ""),
    "[object Object]" ([] → "", {} → "[object Object]"),
    In Node: "[object Object]", In browser console: might show 0 because
    {} is parsed as an empty block, not an object.

A4: true, false, false, false
    (null == undefined is a special rule; null doesn't == anything else)

A5: true, false, true
    ("" → 0, " " → 0 via ToNumber which trims whitespace)

A6: false, false, true, false
    (NaN is not equal to itself; Number.isNaN doesn't coerce strings)

A7: "object", "undefined", "number", "object"
    (null bug, undefined is its own type, NaN is a number, arrays are objects)

A8: true, false, false, true, true
    ("0" is a non-empty string → truthy; 0 and "" are falsy; [] and {} are truthy)
```

</details>

### Exercise Set B: Value vs Reference

```js
// B1. What is the output?
let a = { x: 10 };
let b = a;
b.x = 20;
console.log(a.x);

// B2. What is the output?
let c = { x: 10 };
let d = c;
d = { x: 20 };
console.log(c.x);

// B3. What is the output?
function modify(obj) {
  obj.value = 100;
}
const myObj = { value: 1 };
modify(myObj);
console.log(myObj.value);

// B4. What is the output?
function replace(obj) {
  obj = { value: 999 };
}
const myObj2 = { value: 1 };
replace(myObj2);
console.log(myObj2.value);

// B5. What is the output?
const arr1 = [1, 2, 3];
const arr2 = arr1;
arr2.push(4);
console.log(arr1);
console.log(arr1 === arr2);
```

<details>
<summary><strong>Answers</strong></summary>

```
B1: 20  (b and a point to the same object; mutating through b affects a)
B2: 10  (d = { x: 20 } creates a NEW object; c still points to the old one)
B3: 100 (obj is a copy of the reference; mutating through obj affects myObj)
B4: 1   (obj = {...} reassigns the LOCAL parameter; myObj is unaffected)
B5: [1, 2, 3, 4], true (same reference; push mutates the shared array)
```

</details>

### Exercise Set C: Build These Functions

```js
// C1. Write a deepEqual(a, b) function that compares two values deeply
//     (handles nested objects and arrays)
deepEqual({ x: 1, y: { z: 2 } }, { x: 1, y: { z: 2 } }); // true
deepEqual([1, [2, 3]], [1, [2, 3]]); // true
deepEqual({ x: 1 }, { x: 2 }); // false

// C2. Write a deepClone(obj) function (without using structuredClone)
const original = { a: 1, b: { c: 2 }, d: [3, 4] };
const clone = deepClone(original);
clone.b.c = 99;
console.log(original.b.c); // should still be 2

// C3. Write a getType(val) function that returns accurate types
getType(null);       // "null" (not "object")
getType([]);         // "array" (not "object")
getType({});         // "object"
getType(42);         // "number"
getType(NaN);        // "NaN"
getType(new Date()); // "date"
getType(/regex/);    // "regexp"
```

<details>
<summary><strong>Example solutions</strong></summary>

```js
// C1. deepEqual
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
}

// C2. deepClone
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));

  const clone = {};
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}

// C3. getType
function getType(val) {
  if (val === null) return "null";
  if (Number.isNaN(val)) return "NaN";
  if (Array.isArray(val)) return "array";
  const type = typeof val;
  if (type !== "object") return type;
  // Use Object.prototype.toString for detailed object types
  const tag = Object.prototype.toString.call(val); // "[object Date]"
  return tag.slice(8, -1).toLowerCase(); // "date"
}
```

</details>

---

## 9. Milestone Project

### Build: A Type Coercion Debugger

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project uses concepts from this week and earlier. Make sure you have
> finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | Template literals `` `${...}` `` | Week 2 (this week) |
> | `typeof` operator | Week 2 (this week) |
> | `Array.isArray()`, `String()`, `Number()` | Week 2 (this week) |
> | Functions with default parameters | Week 2 (this week) |
> | Recursion (function calling itself) | Week 3 |
> | `Array.push()`, `.join()` | Week 3 |
>
> ✅ You can start the basics now, but the full recursive `compare()` function
> requires **Week 3** (recursion + arrays).

Create a program that takes two values and explains exactly how `==` compares
them, step by step.

```js
// type-coercion-debugger.js

function explainCoercion(a, b) {
  const steps = [];
  steps.push(`Comparing: ${format(a)} == ${format(b)}`);
  steps.push(`Types: ${typeof a} vs ${typeof b}`);

  const result = compare(a, b, steps);

  steps.push(`\nResult: ${format(a)} == ${format(b)} → ${result}`);
  steps.push(`Strict: ${format(a)} === ${format(b)} → ${a === b}`);

  if (result !== (a === b)) {
    steps.push(`⚠️  == and === give DIFFERENT results. Prefer ===.`);
  }

  return steps.join("\n");
}

function format(val) {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "string") return `"${val}"`;
  if (Array.isArray(val)) return `[${val}]`;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function compare(a, b, steps, depth = 1) {
  const indent = "  ".repeat(depth);

  // Same type → direct comparison
  if (typeof a === typeof b && !(a === null && b !== null)) {
    steps.push(`${indent}→ Same types, direct comparison: ${a === b}`);
    return a === b;
  }

  // null == undefined → true
  if ((a === null && b === undefined) || (a === undefined && b === null)) {
    steps.push(`${indent}→ Special rule: null == undefined → true`);
    return true;
  }

  // null or undefined vs anything else → false
  if (a === null || a === undefined || b === null || b === undefined) {
    steps.push(`${indent}→ null/undefined vs other type → false`);
    return false;
  }

  // Number vs String → convert string to number
  if (typeof a === "number" && typeof b === "string") {
    const converted = Number(b);
    steps.push(`${indent}→ Number vs String: convert "${b}" → ${converted}`);
    return compare(a, converted, steps, depth + 1);
  }
  if (typeof a === "string" && typeof b === "number") {
    const converted = Number(a);
    steps.push(`${indent}→ String vs Number: convert "${a}" → ${converted}`);
    return compare(converted, b, steps, depth + 1);
  }

  // Boolean vs anything → convert boolean to number first
  if (typeof a === "boolean") {
    const converted = Number(a);
    steps.push(`${indent}→ Boolean: convert ${a} → ${converted}`);
    return compare(converted, b, steps, depth + 1);
  }
  if (typeof b === "boolean") {
    const converted = Number(b);
    steps.push(`${indent}→ Boolean: convert ${b} → ${converted}`);
    return compare(a, converted, steps, depth + 1);
  }

  // Object vs Primitive → ToPrimitive
  if (typeof a === "object" && typeof b !== "object") {
    const primitive = toPrimitive(a);
    steps.push(`${indent}→ Object to Primitive: ${format(a)} → ${format(primitive)}`);
    return compare(primitive, b, steps, depth + 1);
  }
  if (typeof a !== "object" && typeof b === "object") {
    const primitive = toPrimitive(b);
    steps.push(`${indent}→ Object to Primitive: ${format(b)} → ${format(primitive)}`);
    return compare(a, primitive, steps, depth + 1);
  }

  return a === b;
}

function toPrimitive(obj) {
  if (obj.valueOf && obj.valueOf() !== obj) return obj.valueOf();
  if (obj.toString) return obj.toString();
  return obj;
}

// ============================================================
// Test cases
// ============================================================
console.log(explainCoercion("5", 5));
console.log("\n" + "=".repeat(50) + "\n");
console.log(explainCoercion([], false));
console.log("\n" + "=".repeat(50) + "\n");
console.log(explainCoercion(null, undefined));
console.log("\n" + "=".repeat(50) + "\n");
console.log(explainCoercion("", 0));
console.log("\n" + "=".repeat(50) + "\n");
console.log(explainCoercion([1], 1));
```

**Your extensions:**
1. Handle `[] == ![]` (the infamous case).
2. Add color output using ANSI codes in the terminal.
3. Add a mode that explains the `+` operator's coercion too.

---

## 10. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Data structures | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures |
| Data types | JavaScript.info | https://javascript.info/types |
| Memory management | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management |
| Object copy | JavaScript.info | https://javascript.info/object-copy |
| V8 Garbage Collector | V8 Blog | https://v8.dev/blog/trash-talk |
| Abstract Equality | ECMAScript Spec §7.2.14 | https://tc39.es/ecma262/#sec-abstract-equality-comparison |
| Equality comparisons | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness |
| Comparisons | JavaScript.info | https://javascript.info/comparison |
| Type Conversions | JavaScript.info | https://javascript.info/type-conversions |
| Types & Grammar | YDKJS (1st ed) | https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/types%20%26%20grammar/ch4.md |
| Falsy values | MDN | https://developer.mozilla.org/en-US/docs/Glossary/Falsy |
| Nullish coalescing | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing |
| Logical operators | JavaScript.info | https://javascript.info/logical-operators |
| typeof operator | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof |
| NaN | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN |
| typeof null bug | 2ality (Axel Rauschmayer) | https://2ality.com/2013/10/typeof-null.html |
| Spread syntax | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax |
| structuredClone | MDN | https://developer.mozilla.org/en-US/docs/Web/API/structuredClone |
| Garbage collection | JavaScript.info | https://javascript.info/garbage-collection |
| Chrome DevTools memory | Chrome DevDocs | https://developer.chrome.com/docs/devtools/memory-problems |
