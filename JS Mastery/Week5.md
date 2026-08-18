# Week 5 — Arrays, Iterators, and Functional Programming

# The Complete Deep-Dive Lesson

> **Stop writing `for` loops. Think in data transformations. This lesson teaches
> you to process data the way senior engineers and React developers do — with
> `map`, `filter`, `reduce`, destructuring, spread, iterators, and generators.**

---

## Table of Contents

1. [Array Methods — The Complete Toolkit](#1-array-methods--the-complete-toolkit)
2. [Implementing Array Methods From Scratch](#2-implementing-array-methods-from-scratch)
3. [Immutability Patterns](#3-immutability-patterns)
4. [Destructuring — Deep Dive](#4-destructuring--deep-dive)
5. [Spread and Rest Operators](#5-spread-and-rest-operators)
6. [The Iterator Protocol](#6-the-iterator-protocol)
7. [Generators — Lazy Sequences](#7-generators--lazy-sequences)
8. [Exercises](#8-exercises)
9. [Milestone Project](#9-milestone-project)
10. [Sources](#10-sources)

---

## 1. Array Methods — The Complete Toolkit

### Transformation Methods (return a new array)

#### `map` — Transform each element

```js
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

// map with index
const indexed = numbers.map((n, i) => `${i}: ${n}`);
// ["0: 1", "1: 2", "2: 3", "3: 4", "4: 5"]

// Practical: extract a property from objects
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
];
const names = users.map(user => user.name);
// ["Alice", "Bob"]
```

#### `filter` — Keep elements that pass a test

```js
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4, 6, 8, 10]

// Practical: filter objects
const adults = users.filter(user => user.age >= 18);
```

#### `reduce` — Accumulate into a single value

```js
const numbers = [1, 2, 3, 4, 5];

// Sum
const sum = numbers.reduce((accumulator, current) => accumulator + current, 0);
// 15

// Explained step-by-step:
// Step 1: acc=0,   cur=1 → return 0+1 = 1
// Step 2: acc=1,   cur=2 → return 1+2 = 3
// Step 3: acc=3,   cur=3 → return 3+3 = 6
// Step 4: acc=6,   cur=4 → return 6+4 = 10
// Step 5: acc=10,  cur=5 → return 10+5 = 15

// Build an object from an array (very common in real code)
const votes = ["yes", "no", "yes", "yes", "no", "yes"];
const tally = votes.reduce((acc, vote) => {
  acc[vote] = (acc[vote] || 0) + 1;
  return acc;
}, {});
// { yes: 4, no: 2 }

// Group by a property
const people = [
  { name: "Alice", dept: "Engineering" },
  { name: "Bob", dept: "Marketing" },
  { name: "Carol", dept: "Engineering" },
  { name: "Dave", dept: "Marketing" },
];

const byDept = people.reduce((acc, person) => {
  const key = person.dept;
  if (!acc[key]) acc[key] = [];
  acc[key].push(person);
  return acc;
}, {});
// { Engineering: [{Alice}, {Carol}], Marketing: [{Bob}, {Dave}] }
```

#### `flatMap` — Map + flatten one level

```js
const sentences = ["hello world", "foo bar"];
const words = sentences.flatMap(s => s.split(" "));
// ["hello", "world", "foo", "bar"]

// Without flatMap:
const wordsAlt = sentences.map(s => s.split(" ")).flat();
// Same result, but flatMap is more efficient (single pass)
```

### Search Methods (return a value or boolean)

```js
const numbers = [1, 2, 3, 4, 5];

// find — first element matching the condition
numbers.find(n => n > 3);         // 4

// findIndex — index of first match
numbers.findIndex(n => n > 3);    // 3

// includes — check if value exists
numbers.includes(3);              // true

// some — at least one matches?
numbers.some(n => n > 4);         // true

// every — ALL match?
numbers.every(n => n > 0);        // true
numbers.every(n => n > 3);        // false

// indexOf — index of first exact match
numbers.indexOf(3);               // 2
numbers.indexOf(99);              // -1
```

### Chaining Methods Together

```js
const transactions = [
  { type: "credit", amount: 100, date: "2025-01-01" },
  { type: "debit", amount: 50, date: "2025-01-02" },
  { type: "credit", amount: 200, date: "2025-01-03" },
  { type: "debit", amount: 75, date: "2025-01-04" },
  { type: "credit", amount: 150, date: "2025-01-05" },
];

const totalCredits = transactions
  .filter(t => t.type === "credit")           // keep only credits
  .map(t => t.amount)                          // extract amounts
  .reduce((sum, amount) => sum + amount, 0);   // sum them up
// 450
```

> **Source:**
> - MDN — "Array": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
> - MDN — "Array.prototype.reduce()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
> - JavaScript.info — "Array methods": https://javascript.info/array-methods

---

## 2. Implementing Array Methods From Scratch

Understanding these deeply means being able to build them.

### myMap

```js
Array.prototype.myMap = function(callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) { // handles sparse arrays
      result.push(callback(this[i], i, this));
    }
  }
  return result;
};

console.log([1, 2, 3].myMap(n => n * 2)); // [2, 4, 6]
```

### myFilter

```js
Array.prototype.myFilter = function(callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback(this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};

console.log([1, 2, 3, 4, 5].myFilter(n => n % 2 === 0)); // [2, 4]
```

### myReduce

```js
Array.prototype.myReduce = function(callback, initialValue) {
  let accumulator;
  let startIndex;

  if (initialValue !== undefined) {
    accumulator = initialValue;
    startIndex = 0;
  } else {
    if (this.length === 0) throw new TypeError("Reduce of empty array with no initial value");
    accumulator = this[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < this.length; i++) {
    if (i in this) {
      accumulator = callback(accumulator, this[i], i, this);
    }
  }

  return accumulator;
};

console.log([1, 2, 3, 4, 5].myReduce((acc, n) => acc + n, 0)); // 15
```

### myFind

```js
Array.prototype.myFind = function(callback) {
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback(this[i], i, this)) {
      return this[i];
    }
  }
  return undefined;
};
```

> **Source:**
> - ECMAScript Spec §23.1.3 "Array.prototype methods": https://tc39.es/ecma262/#sec-array.prototype.map
> - MDN polyfill examples in each method's page

---

## 3. Immutability Patterns

### Mutable vs Immutable

A **mutable** operation changes the original array or object in place. An **immutable** operation leaves the original untouched and produces a new copy. Frameworks like React use reference equality to detect state changes — if you mutate in place, the reference stays the same, React sees no change, and the UI does not re-render.

```js
// MUTABLE — changes the original (BAD for React state)
const arr = [1, 2, 3];
arr.push(4);  // arr is now [1, 2, 3, 4]

// IMMUTABLE — creates a new copy (GOOD for React state)
const arr2 = [1, 2, 3];
const newArr = [...arr2, 4];  // arr2 is still [1,2,3]; newArr is [1,2,3,4]
```

### Array Immutability Patterns

```js
const items = [1, 2, 3, 4, 5];

// Add to end
const added = [...items, 6];            // [1,2,3,4,5,6]

// Add to beginning
const prepended = [0, ...items];        // [0,1,2,3,4,5]

// Remove by index
const removed = items.filter((_, i) => i !== 2);  // [1,2,4,5] (removed index 2)

// Update at index
const updated = items.map((item, i) => i === 2 ? 99 : item);  // [1,2,99,4,5]

// Insert at index
const inserted = [...items.slice(0, 2), 99, ...items.slice(2)]; // [1,2,99,3,4,5]
```

### Object Immutability Patterns

```js
const user = { name: "Alice", age: 25, role: "admin" };

// Update a property
const updated = { ...user, age: 26 };
// { name: "Alice", age: 26, role: "admin" }

// Add a property
const withEmail = { ...user, email: "alice@example.com" };

// Remove a property
const { role, ...withoutRole } = user;
// withoutRole = { name: "Alice", age: 25 }

// Nested update (common in React)
const state = {
  user: { name: "Alice", address: { city: "NYC", zip: "10001" } },
  settings: { theme: "dark" },
};

const newState = {
  ...state,
  user: {
    ...state.user,
    address: {
      ...state.user.address,
      city: "LA",
    },
  },
};
// Only city changed. Everything else is a reference to the same objects.
```

### structuredClone — Deep Copy

```js
const original = { a: 1, nested: { b: 2 }, arr: [3, 4] };
const deep = structuredClone(original);

deep.nested.b = 99;
console.log(original.nested.b); // 2 — untouched
```

> **Source:**
> - MDN — "structuredClone()": https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
> - MDN — "Spread syntax": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
> - React docs — "Updating Objects in State": https://react.dev/learn/updating-objects-in-state

---

## 4. Destructuring — Deep Dive

**Practical Mental Model (Unpacking a Data Payload):**
Imagine you make a network request to an API and receive a massive, nested JSON object containing hundreds of fields. You only need the user's `id` and `email` to display on the screen. Instead of carrying this giant object around and constantly referencing `response.data.user.id`, you can "unpack" exactly the data you need the moment it arrives.

**Destructuring** is the syntax that lets you pull specific values out of an array, or specific properties out of an object, and assign them to distinct local variables in a single, clean line of code.

### Array Destructuring

For arrays, variables are matched by **position** (index 0, 1, 2...):

```js
const colors = ["red", "green", "blue"];

// Variables are assigned left to right, matched by index position
const [first, second, third] = colors;

console.log(first);  // "red"
console.log(second); // "green"
console.log(third);  // "blue"

// Skip elements
const [, , thirdOnly] = colors;
console.log(thirdOnly); // "blue"

// Default values
const [a, b, c, d = "yellow"] = colors;
console.log(d); // "yellow" — default because colors[3] is undefined

// Rest element
const [head, ...tail] = colors;
console.log(head); // "red"
console.log(tail); // ["green", "blue"]

// Swapping variables
let x = 1, y = 2;
[x, y] = [y, x];
console.log(x, y); // 2, 1
```

### Object Destructuring

```js
const user = { name: "Alice", age: 25, role: "admin" };

// Basic
const { name, age } = user;
console.log(name); // "Alice"

// Rename
const { name: userName, age: userAge } = user;
console.log(userName); // "Alice"

// Default values
const { name: n, country = "US" } = user;
console.log(country); // "US" — default because user.country is undefined

// Rest
const { role, ...rest } = user;
console.log(role); // "admin"
console.log(rest); // { name: "Alice", age: 25 }
```

### Nested Destructuring

```js
const response = {
  data: {
    users: [
      { id: 1, name: "Alice", scores: [90, 85, 92] },
      { id: 2, name: "Bob", scores: [78, 88, 95] },
    ],
    meta: { total: 2, page: 1 },
  },
  status: 200,
};

const {
  data: {
    users: [firstUser, secondUser],
    meta: { total },
  },
  status,
} = response;

console.log(firstUser.name); // "Alice"
console.log(total);          // 2
console.log(status);         // 200

// Destructuring in function parameters
function printUser({ name, age, role = "user" }) {
  console.log(`${name}, ${age}, ${role}`);
}
printUser({ name: "Alice", age: 25 }); // "Alice, 25, user"
```

### Destructuring in Loops

```js
const entries = [["name", "Alice"], ["age", 25], ["role", "admin"]];

for (const [key, value] of entries) {
  console.log(`${key}: ${value}`);
}
// name: Alice
// age: 25
// role: admin

// With Object.entries
const user = { name: "Alice", age: 25 };
for (const [key, value] of Object.entries(user)) {
  console.log(`${key}: ${value}`);
}
```

> **Source:**
> - MDN — "Destructuring assignment": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
> - JavaScript.info — "Destructuring assignment": https://javascript.info/destructuring-assignment

---

## 5. Spread and Rest Operators

The `...` syntax serves two opposite purposes depending on context. It either **expands** a collection into individual items, or it **collects** individual items into a new collection.

### Spread — Expand an iterable into individual elements

**Practical Mental Model (Merging Configurations):**
Imagine you have a default configuration object for a chart, and a user provides their own custom overrides. You want to create a final configuration object that combines both. Using the Spread operator (`...`) is like taking the wrapper off an object or array and letting all its individual key-value pairs or elements spill out into a new container.

`...array` in a call site or array/object literal **expands** the contents into individual elements. It is the equivalent of typing each element out manually, but done automatically.

```js
const a = [1, 2, 3];
const b = [4, 5, 6];
const merged = [...a, ...b]; // same as [1, 2, 3, 4, 5, 6]

// Spread into an object — later keys overwrite earlier ones
const defaults = { theme: "dark", lang: "en", fontSize: 14 };
const userPrefs = { theme: "light", fontSize: 16 };
const config = { ...defaults, ...userPrefs };
// { theme: "light", lang: "en", fontSize: 16 }

// Spread into a function call — passes each element as a separate argument
const numbers = [5, 2, 8, 1, 9];
console.log(Math.max(...numbers)); // 9
```

### Rest — Collect remaining elements into an array/object

**Practical Mental Model (Scooping up the remainder):**
If Spread is unpacking the payload, Rest is the cleanup crew. When defining a function, you might not know how many arguments the caller will pass. The Rest operator lets you scoop up all the "loose" arguments that weren't explicitly named and bundle them neatly into a single array variable.

`...name` in a **function parameter list** or **destructuring pattern** does exactly this: it bundles all remaining elements into a single array (or remaining properties into a new object).

```js
// In a function: collects all arguments after the named ones into an array
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
console.log(sum(1, 2, 3, 4, 5)); // 15

// Rest in destructuring
const [first, ...others] = [1, 2, 3, 4, 5];
console.log(first);  // 1
console.log(others); // [2, 3, 4, 5]

const { id, ...userData } = { id: 1, name: "Alice", age: 25 };
console.log(id);       // 1
console.log(userData); // { name: "Alice", age: 25 }
```

### Spread Creates Shallow Copies

```js
const original = { name: "Alice", address: { city: "NYC" } };
const copy = { ...original };

copy.name = "Bob";           // ✅ Does NOT affect original
copy.address.city = "LA";   // ❌ DOES affect original — nested object is shared!
```

> **Source:**
> - MDN — "Spread syntax": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
> - MDN — "Rest parameters": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters

---

## 6. The Iterator Protocol

### What Is It?

The **Iterator Protocol** is a standard way for objects to produce a sequence
of values. Any object that implements this protocol can be used with:
- `for...of` loops
- Spread operator `[...iterable]`
- Destructuring `const [a, b] = iterable`
- `Array.from(iterable)`
- `Promise.all(iterable)`

### The Protocol

An object is **iterable** if it has a `[Symbol.iterator]()` method that returns
an **iterator** — an object with a `next()` method that returns
`{ value, done }`.

```js
const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;

    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

console.log([...range]); // [1, 2, 3, 4, 5]

const [a, b, c] = range;
console.log(a, b, c); // 1, 2, 3
```

### Built-in Iterables

Arrays, Strings, Maps, Sets, and TypedArrays are all iterable:

```js
// String iteration
for (const char of "Hello") {
  console.log(char); // H, e, l, l, o
}

// Map iteration
const map = new Map([["a", 1], ["b", 2]]);
for (const [key, value] of map) {
  console.log(key, value); // a 1, b 2
}

// Set iteration
const set = new Set([1, 2, 3, 2, 1]);
for (const val of set) {
  console.log(val); // 1, 2, 3
}
```

### Making a Class Iterable

```js
class NumberRange {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const { end, step } = this;

    return {
      next() {
        if (current <= end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { done: true };
      }
    };
  }
}

const range = new NumberRange(0, 10, 2);
console.log([...range]); // [0, 2, 4, 6, 8, 10]
```

> **Source:**
> - MDN — "Iteration protocols": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
> - JavaScript.info — "Iterables": https://javascript.info/iterable

---

## 7. Generators — Lazy Sequences

### What Is a Generator?

A **generator** is a special function that can **pause** execution at `yield`
and **resume** later. It returns an iterator.

```js
function* countUp() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = countUp();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }

// Generators are iterable
for (const n of countUp()) {
  console.log(n); // 1, 2, 3
}
console.log([...countUp()]); // [1, 2, 3]
```

### Infinite Sequences (Lazy Evaluation)

Generators produce values **on demand**. They don't compute everything upfront.

```js
function* fibonacci() {
  let a = 0, b = 1;
  while (true) { // infinite loop — but it's fine because it yields
    yield a;
    [a, b] = [b, a + b];
  }
}

// Take the first 10 Fibonacci numbers
function take(iterable, n) {
  const result = [];
  for (const value of iterable) {
    result.push(value);
    if (result.length === n) break;
  }
  return result;
}

console.log(take(fibonacci(), 10));
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### Passing Values INTO Generators

`yield` can receive values when you call `gen.next(value)`:

```js
function* conversation() {
  const name = yield "What is your name?";
  const age = yield `Hello, ${name}! How old are you?`;
  return `${name} is ${age} years old.`;
}

const chat = conversation();
console.log(chat.next());          // { value: "What is your name?", done: false }
console.log(chat.next("Alice"));   // { value: "Hello, Alice! How old are you?", done: false }
console.log(chat.next(25));        // { value: "Alice is 25 years old.", done: true }
```

### Generator-Based Utility Functions

```js
// Range generator
function* range(start, end, step = 1) {
  for (let i = start; i <= end; i += step) {
    yield i;
  }
}
console.log([...range(1, 10, 2)]); // [1, 3, 5, 7, 9]

// Infinite ID generator
function* idGenerator(prefix = "id") {
  let id = 1;
  while (true) {
    yield `${prefix}_${id++}`;
  }
}

const nextId = idGenerator("user");
console.log(nextId.next().value); // "user_1"
console.log(nextId.next().value); // "user_2"
console.log(nextId.next().value); // "user_3"

// yield* — delegate to another generator
function* inner() {
  yield "a";
  yield "b";
}

function* outer() {
  yield 1;
  yield* inner(); // delegates to inner
  yield 2;
}

console.log([...outer()]); // [1, "a", "b", 2]
```

> **Source:**
> - MDN — "function*": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
> - MDN — "yield": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield
> - JavaScript.info — "Generators": https://javascript.info/generators

---

## 8. Exercises

### Exercise Set A: Array Methods

```js
// A1. Given this data, use ONLY map/filter/reduce (no for loops) to:
const students = [
  { name: "Alice", grade: 92, major: "CS" },
  { name: "Bob", grade: 78, major: "Math" },
  { name: "Carol", grade: 88, major: "CS" },
  { name: "Dave", grade: 95, major: "CS" },
  { name: "Eve", grade: 65, major: "Math" },
];

// a) Get names of CS students with grades above 85
// b) Calculate the average grade of all students
// c) Group students by major: { CS: [...], Math: [...] }
// d) Find the student with the highest grade

// A2. Implement flatten(arr, depth) — flattens nested arrays to given depth
// flatten([1, [2, [3, [4]]]], 2) → [1, 2, 3, [4]]

// A3. Implement unique(arr) — removes duplicates
// unique([1, 2, 2, 3, 3, 3]) → [1, 2, 3]

// A4. Implement zip(arr1, arr2) — pairs elements
// zip([1, 2, 3], ["a", "b", "c"]) → [[1,"a"], [2,"b"], [3,"c"]]
```

<details>
<summary><strong>Answers</strong></summary>

```js
// A1a
students.filter(s => s.major === "CS" && s.grade > 85).map(s => s.name);
// ["Alice", "Carol", "Dave"]

// A1b
students.reduce((sum, s) => sum + s.grade, 0) / students.length;
// 83.6

// A1c
students.reduce((groups, s) => {
  (groups[s.major] = groups[s.major] || []).push(s);
  return groups;
}, {});

// A1d
students.reduce((best, s) => s.grade > best.grade ? s : best);
// { name: "Dave", grade: 95, major: "CS" }

// A2
function flatten(arr, depth = 1) {
  if (depth <= 0) return [...arr];
  return arr.reduce((acc, val) =>
    Array.isArray(val) ? [...acc, ...flatten(val, depth - 1)] : [...acc, val],
  []);
}

// A3
const unique = (arr) => [...new Set(arr)];

// A4
function zip(a, b) {
  return a.map((val, i) => [val, b[i]]);
}
```

</details>

### Exercise Set B: Destructuring & Spread

```js
// B1. Extract the described values using destructuring
const data = {
  results: [
    { id: 1, title: "Post 1", author: { name: "Alice", email: "a@x.com" } },
    { id: 2, title: "Post 2", author: { name: "Bob", email: "b@x.com" } },
  ],
  pagination: { page: 1, total: 10 },
};

// Extract: first post's author name, second post's title, total pages
// In ONE destructuring statement

// B2. Write a function merge(...objects) that deep-merges multiple objects
// merge({a: 1, b: {c: 2}}, {b: {d: 3}}) → {a: 1, b: {c: 2, d: 3}}

// B3. Write an immutable state updater:
// Given state = { user: { name: "Alice", prefs: { theme: "dark" } } }
// Update theme to "light" without mutating anything
```

<details>
<summary><strong>Answers</strong></summary>

```js
// B1
const {
  results: [
    { author: { name: authorName } },
    { title: secondTitle }
  ],
  pagination: { total }
} = data;
console.log(authorName, secondTitle, total); // "Alice", "Post 2", 10

// B2
function merge(...objects) {
  return objects.reduce((acc, obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)
          && typeof acc[key] === "object" && acc[key] !== null) {
        acc[key] = merge(acc[key], value);
      } else {
        acc[key] = value;
      }
    }
    return acc;
  }, {});
}

// B3
const state = { user: { name: "Alice", prefs: { theme: "dark" } } };
const newState = {
  ...state,
  user: {
    ...state.user,
    prefs: {
      ...state.user.prefs,
      theme: "light"
    }
  }
};
```

</details>

### Exercise Set C: Iterators & Generators

```js
// C1. Create an iterable object LinkedList that can be used with for...of
class LinkedList {
  // YOUR CODE: add(), [Symbol.iterator]()
}
const list = new LinkedList();
list.add(1).add(2).add(3);
for (const val of list) console.log(val); // 1, 2, 3

// C2. Write a generator function* chunk(arr, size) that yields chunks
// [...chunk([1,2,3,4,5,6,7], 3)] → [[1,2,3], [4,5,6], [7]]

// C3. Write a generator that yields all permutations of an array
// [...permutations([1,2,3])] → [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

<details>
<summary><strong>Answers</strong></summary>

```js
// C1
class LinkedList {
  #head = null;
  #tail = null;

  add(value) {
    const node = { value, next: null };
    if (!this.#head) { this.#head = node; this.#tail = node; }
    else { this.#tail.next = node; this.#tail = node; }
    return this; // chainable
  }

  [Symbol.iterator]() {
    let current = this.#head;
    return {
      next() {
        if (current) {
          const value = current.value;
          current = current.next;
          return { value, done: false };
        }
        return { done: true };
      }
    };
  }
}

// C2
function* chunk(arr, size) {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

// C3
function* permutations(arr) {
  if (arr.length <= 1) { yield [...arr]; return; }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i], ...perm];
    }
  }
}
```

</details>

---

## 9. Milestone Project

### Build: A Data Transformation Pipeline

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project heavily uses array methods, classes, and object manipulation.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | `class`, `constructor`, `this` | Week 4 ✅ |
> | Static methods (`static from()`) | Week 4 ✅ |
> | `.filter()`, `.map()`, `.reduce()` | Week 5 (this week) |
> | `Object.entries()`, `Object.fromEntries()` | Week 5 (this week) |
> | Spread operator `[...arr]` | Week 5 (this week) |
> | `Set` data structure | Week 5 (this week) |
> | `for...of` loop | Week 2 ✅ |
>
> ✅ Complete all of Week 5 before starting this project.

```js
// pipeline.js

class Pipeline {
  constructor(data) {
    this._data = [...data]; // copy to avoid mutation
  }

  static from(data) {
    return new Pipeline(data);
  }

  filter(predicate) {
    return new Pipeline(this._data.filter(predicate));
  }

  map(transform) {
    return new Pipeline(this._data.map(transform));
  }

  groupBy(key) {
    const groups = {};
    for (const item of this._data) {
      const k = typeof key === "function" ? key(item) : item[key];
      if (!groups[k]) groups[k] = [];
      groups[k].push(item);
    }
    this._data = groups;
    return this;
  }

  mapValues(transform) {
    // Works when _data is a grouped object
    const result = {};
    for (const [key, value] of Object.entries(this._data)) {
      result[key] = transform(value, key);
    }
    this._data = result;
    return this;
  }

  sortBy(key, direction = "asc") {
    const sorted = Object.entries(this._data).sort(([, a], [, b]) => {
      const valA = typeof a === "object" ? a[key] : a;
      const valB = typeof b === "object" ? b[key] : b;
      return direction === "asc" ? valA - valB : valB - valA;
    });
    this._data = Object.fromEntries(sorted);
    return this;
  }

  take(n) {
    if (Array.isArray(this._data)) {
      return new Pipeline(this._data.slice(0, n));
    }
    const entries = Object.entries(this._data).slice(0, n);
    this._data = Object.fromEntries(entries);
    return this;
  }

  unique(keyOrFn) {
    const seen = new Set();
    return new Pipeline(this._data.filter(item => {
      const key = keyOrFn ? (typeof keyOrFn === "function" ? keyOrFn(item) : item[keyOrFn]) : item;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }));
  }

  reduce(callback, initial) {
    return this._data.reduce(callback, initial);
  }

  toArray() {
    return Array.isArray(this._data) ? [...this._data] : Object.entries(this._data);
  }

  toObject() {
    return { ...this._data };
  }
}

// ============================================================
// Test it with sales data
// ============================================================

const salesData = [
  { id: 1, region: "North", product: "Widget", amount: 250, status: "completed" },
  { id: 2, region: "South", product: "Gadget", amount: 150, status: "completed" },
  { id: 3, region: "North", product: "Widget", amount: 300, status: "pending" },
  { id: 4, region: "East", product: "Gadget", amount: 450, status: "completed" },
  { id: 5, region: "South", product: "Widget", amount: 200, status: "completed" },
  { id: 6, region: "North", product: "Gadget", amount: 175, status: "completed" },
  { id: 7, region: "East", product: "Widget", amount: 500, status: "completed" },
  { id: 8, region: "South", product: "Gadget", amount: 100, status: "refunded" },
];

const report = Pipeline.from(salesData)
  .filter(sale => sale.status === "completed")
  .groupBy("region")
  .mapValues(sales => ({
    totalRevenue: sales.reduce((sum, s) => sum + s.amount, 0),
    count: sales.length,
    avgSale: Math.round(sales.reduce((sum, s) => sum + s.amount, 0) / sales.length),
  }))
  .toObject();

console.log(report);
// {
//   North: { totalRevenue: 425, count: 2, avgSale: 213 },
//   South: { totalRevenue: 350, count: 2, avgSale: 175 },
//   East:  { totalRevenue: 950, count: 2, avgSale: 475 }
// }
```

**Your extensions:**
1. Make it **lazy** using generators — don't process until `.toArray()`.
2. Add `.flatMap()`, `.compact()` (removes falsy), `.partition(predicate)`.
3. Add `.tap(fn)` for debugging — calls fn with current data but doesn't change it.

---

## 10. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Array | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array |
| Array.prototype.reduce | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce |
| Array methods | JavaScript.info | https://javascript.info/array-methods |
| Array.prototype.map (spec) | ECMAScript Spec §23.1.3 | https://tc39.es/ecma262/#sec-array.prototype.map |
| structuredClone | MDN | https://developer.mozilla.org/en-US/docs/Web/API/structuredClone |
| Spread syntax | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax |
| Rest parameters | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters |
| Updating state (React) | React docs | https://react.dev/learn/updating-objects-in-state |
| Destructuring | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment |
| Destructuring | JavaScript.info | https://javascript.info/destructuring-assignment |
| Iteration protocols | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols |
| Iterables | JavaScript.info | https://javascript.info/iterable |
| function* | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function* |
| yield | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield |
| Generators | JavaScript.info | https://javascript.info/generators |
