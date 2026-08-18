# Week 1 — JS You MUST Know Before React

# The Complete Deep-Dive Lesson

> **By the end of this week you will know every JavaScript feature that React uses
> constantly. You will stop googling "what does `?.` mean" mid-component and instead
> focus on the React logic itself.**

---

## Table of Contents

1. [Why This Week Exists](#1-why-this-week-exists)
2. [Destructuring — Objects & Arrays](#2-destructuring--objects--arrays)
3. [Spread and Rest Operators](#3-spread-and-rest-operators)
4. [Arrow Functions](#4-arrow-functions)
5. [Template Literals](#5-template-literals)
6. [Array Methods: map, filter, find, reduce](#6-array-methods-map-filter-find-reduce)
7. [Short-Circuit Evaluation & Nullish Coalescing](#7-short-circuit-evaluation--nullish-coalescing)
8. [Optional Chaining](#8-optional-chaining)
9. [ES Modules: import / export](#9-es-modules-import--export)
10. [Promises & async/await](#10-promises--asyncawait)
11. [Exercises](#11-exercises)
12. [Milestone Project](#12-milestone-project)
13. [Sources](#13-sources)

---

## 1. Why This Week Exists

React does not hide JavaScript from you — it layers on top of it. Almost every line
of React code uses features introduced in ES6 (2015) and later. If you do not know
these features cold, you will confuse "I don't understand React" with "I don't
understand the JavaScript React is written in".

Here is a typical React component with every feature you will learn this week highlighted:

```jsx
// ES Modules
import { useState } from 'react';

// Arrow function component
const UserCard = ({ name, age, scores = [] }) => {  // Destructuring + default value

  // Array method
  const best = scores.filter(s => s >= 80);

  // Optional chaining + nullish coalescing
  const label = name?.toUpperCase() ?? 'Anonymous';

  return (
    // Template literal
    <div className={`card ${age >= 18 ? 'adult' : 'minor'}`}>
      <h2>{label}</h2>
      {/* Short-circuit rendering */}
      {best.length > 0 && <p>Top scores: {best.join(', ')}</p>}
    </div>
  );
};

export default UserCard;
```

Every single syntax in that file is covered this week.

---

## 2. Destructuring — Objects & Arrays

### Object Destructuring

- **Object destructuring extracts named properties into standalone variables** —
  Instead of writing `user.name`, `user.age`, `user.email` repeatedly, you pull them
  out once at the top. React uses this for props, API responses, and hook return values.

  ```js
  const user = { name: "Chethan", age: 22, city: "Bangalore" };

  // Without destructuring (repetitive):
  const name = user.name;
  const age  = user.age;

  // With destructuring (clean):
  const { name, age } = user;
  console.log(name); // "Chethan"
  console.log(age);  // 22
  ```

  The variable names on the left must match the property names on the right.

- **You can rename a property while destructuring** — Use the `key: newName` syntax
  when the property name conflicts with another variable or you want a clearer name.

  ```js
  const { name: userName, age: userAge } = user;
  console.log(userName); // "Chethan"
  // `name` is NOT declared — only `userName` is
  ```

- **You can set a default value during destructuring** — If the property is `undefined`
  in the object, the default value kicks in. This is how React component props with
  defaults work.

  ```js
  const { name, role = "student" } = { name: "Chethan" };
  console.log(role); // "student" — because role was undefined in the object
  ```

  Note: defaults only apply when the value is `undefined`, not `null`.

- **Nested object destructuring lets you dig deep in one line** — APIs often return
  deeply nested data. You can destructure all the way down.

  ```js
  const response = {
    status: 200,
    data: { user: { id: 42, name: "Chethan" } }
  };

  const { data: { user: { id, name } } } = response;
  console.log(id);   // 42
  console.log(name); // "Chethan"
  ```

### Array Destructuring

- **Array destructuring extracts items by position, not by name** — The variable
  name you choose is completely up to you. React's `useState` returns an array and
  this is exactly how you always use it.

  ```js
  const colors = ["red", "green", "blue"];
  const [first, second] = colors;
  console.log(first);  // "red"
  console.log(second); // "green"

  // This is exactly how useState works:
  const [count, setCount] = useState(0);
  // count = current value, setCount = updater function
  ```

- **You can skip elements using empty commas** — If you only need the third item,
  skip the first two with commas and no variable names.

  ```js
  const [, , third] = ["a", "b", "c"];
  console.log(third); // "c"
  ```

- **Swapping two variables without a temp variable** — Classic trick enabled by
  array destructuring.

  ```js
  let a = 1, b = 2;
  [a, b] = [b, a];
  console.log(a); // 2
  console.log(b); // 1
  ```

### Destructuring in Function Parameters

- **You can destructure directly in the function signature** — React components
  receive a single `props` object. Destructuring in the parameter list is the
  standard way to access individual props cleanly.

  ```jsx
  // Without destructuring (verbose):
  function Button(props) {
    return <button>{props.label}</button>;
  }

  // With destructuring (standard React style):
  function Button({ label, onClick, disabled = false }) {
    return <button onClick={onClick} disabled={disabled}>{label}</button>;
  }
  ```

---

## 3. Spread and Rest Operators

Both use the same `...` syntax but do opposite things depending on context.

### Spread — Expanding

- **The spread operator expands an iterable (array or object) into individual items** —
  Think of it as "unpacking". This is the key to immutable state updates in React:
  you spread the old state and override only the changed fields.

  ```js
  // Merging objects (critical for React state updates):
  const user = { name: "Chethan", age: 22, city: "Bangalore" };
  const updated = { ...user, age: 23 }; // spread all, then override age
  console.log(updated); // { name: "Chethan", age: 23, city: "Bangalore" }
  // `user` is unchanged — this is immutability
  ```

  Order matters: later keys overwrite earlier ones. `{ age: 99, ...user }` would
  leave age as 22 because `user.age` comes after and overrides.

- **Spread works on arrays to create a new array** — In React you never push/pop
  directly into state arrays. You spread them into a new array instead.

  ```js
  const tasks = ["Read", "Code", "Review"];
  const newTasks = [...tasks, "Deploy"]; // new array, original untouched
  console.log(newTasks); // ["Read", "Code", "Review", "Deploy"]

  // Removing an item immutably:
  const withoutFirst = tasks.slice(1); // or filter
  ```

- **Spread passes all props to a child component** — When you have an object of
  props and want to forward them all, spread saves you from writing them one by one.

  ```jsx
  const buttonProps = { label: "Submit", disabled: false, onClick: handleClick };
  return <Button {...buttonProps} />;
  // Equivalent to: <Button label="Submit" disabled={false} onClick={handleClick} />
  ```

### Rest — Collecting

- **The rest operator collects remaining items into an array or object** — It is the
  mirror image of spread. Rest is used in function parameters to collect variable
  numbers of arguments.

  ```js
  function sum(first, ...rest) {  // first = 1, rest = [2, 3, 4, 5]
    return first + rest.reduce((acc, n) => acc + n, 0);
  }
  sum(1, 2, 3, 4, 5); // 15
  ```

- **Object rest collects everything that was NOT destructured** — Useful for
  forwarding "extra" props in React components.

  ```jsx
  function Button({ label, variant, ...rest }) {
    // label and variant are extracted; everything else (onClick, id, etc.) is in rest
    return <button className={`btn-${variant}`} {...rest}>{label}</button>;
  }

  <Button label="Save" variant="primary" onClick={save} id="save-btn" />
  // Inside Button: rest = { onClick: save, id: "save-btn" }
  ```

---

## 4. Arrow Functions

- **Arrow functions are a shorter syntax for writing functions** — They drop the
  `function` keyword and use `=>`. They are the default syntax in all React components,
  event handlers, and array method callbacks.

  ```js
  // Regular function:
  function double(x) { return x * 2; }

  // Arrow function:
  const double = (x) => x * 2; // implicit return — no braces, no return keyword

  // With a block body (explicit return required):
  const double = (x) => {
    const result = x * 2;
    return result;
  };
  ```

- **Arrow functions do NOT have their own `this`** — They inherit `this` from the
  surrounding scope where they were DEFINED. This is why React hooks and event
  handlers use arrow functions — you never have to worry about what `this` points to.

  ```js
  const timer = {
    seconds: 0,
    start: function() {
      // Regular function as callback: `this` is lost
      setInterval(function() {
        this.seconds++; // ❌ `this` is undefined (or window in non-strict)
      }, 1000);

      // Arrow function as callback: `this` is inherited from start()
      setInterval(() => {
        this.seconds++; // ✅ `this` is the timer object
      }, 1000);
    }
  };
  ```

- **Implicit return of objects requires wrapping in parentheses** — If you return
  an object literal with `=>` and no braces, JS mistakes the `{}` for a function
  body. Wrap the object in `()` to fix this.

  ```js
  const users = [1, 2, 3];

  // ❌ Broken — JS thinks {} is a function body, not an object
  const result = users.map(id => { id, active: true });

  // ✅ Correct — wrapping in () signals "this is an object"
  const result = users.map(id => ({ id, active: true }));
  ```

---

## 5. Template Literals

- **Template literals let you embed expressions directly inside strings** — Use
  backticks (`` ` ``) instead of quotes, and `${}` for any JavaScript expression.
  This is used constantly in JSX `className`, API URL construction, and log messages.

  ```js
  const name = "Chethan";
  const score = 95;

  // Old way (error-prone concatenation):
  const msg = "Hello " + name + "! Your score is " + score + ".";

  // Template literal (clean):
  const msg = `Hello ${name}! Your score is ${score}.`;
  // Expressions work too:
  const grade = `Grade: ${score >= 90 ? "A" : "B"}`;
  ```

- **Template literals preserve line breaks** — Multi-line strings no longer need
  `\n`. This is useful for constructing SQL queries, HTML strings, or error messages.

  ```js
  const html = `
    <div class="card">
      <h2>${name}</h2>
      <p>Score: ${score}</p>
    </div>
  `;
  ```

---

## 6. Array Methods: map, filter, find, reduce

These four methods are the backbone of React list rendering and data transformation.
They all:
- Take a **callback function** as their argument
- **Do not mutate the original array** — they return a new one
- Are called on an array instance

### `.map()` — Transform Every Item

- **`.map()` creates a new array by running a function on every item** — It is the
  primary way to render lists in React. Each item becomes a JSX element.

  ```jsx
  const fruits = ["apple", "banana", "cherry"];

  // In React JSX:
  return (
    <ul>
      {fruits.map((fruit, index) => (
        <li key={index}>{fruit}</li>  // key is required — covered in Week 2
      ))}
    </ul>
  );
  ```

  The callback receives `(currentItem, index, originalArray)` — you rarely need
  the last two.

### `.filter()` — Keep Only Matching Items

- **`.filter()` creates a new array containing only items for which the callback
  returns `true`** — Use it to show only completed todos, only high-scoring results,
  or to "delete" an item from state without mutating.

  ```js
  const tasks = [
    { id: 1, text: "Read", done: true },
    { id: 2, text: "Code", done: false },
    { id: 3, text: "Review", done: true },
  ];

  const completed = tasks.filter(task => task.done);
  // [{ id: 1 ... }, { id: 3 ... }]

  // "Deleting" from React state:
  const remove = (id) => setTasks(tasks.filter(t => t.id !== id));
  ```

### `.find()` — Get the First Match

- **`.find()` returns the first item for which the callback returns `true`**, or
  `undefined` if nothing matches. Use it to look up a single item by ID.

  ```js
  const user = users.find(u => u.id === 42);
  // Returns the user object, or undefined if id 42 does not exist
  console.log(user?.name); // safe access with optional chaining
  ```

  Unlike `.filter()`, `.find()` returns the item itself, not an array.

### `.reduce()` — Collapse to a Single Value

- **`.reduce()` processes every item in the array and accumulates them into a
  single output** — That output can be a number, string, object, or even a new array.
  The callback takes `(accumulator, currentItem)`.

  ```js
  const prices = [10, 25, 5, 40];

  // Sum all prices:
  const total = prices.reduce((acc, price) => acc + price, 0);
  // 0 → 10 → 35 → 40 → 80
  console.log(total); // 80

  // Group array into object (common pattern):
  const people = [
    { name: "Alice", dept: "Engineering" },
    { name: "Bob", dept: "Design" },
    { name: "Carol", dept: "Engineering" },
  ];
  const byDept = people.reduce((acc, person) => {
    const dept = person.dept;
    acc[dept] = acc[dept] || [];    // create array if not exists
    acc[dept].push(person.name);
    return acc;
  }, {});
  // { Engineering: ["Alice", "Carol"], Design: ["Bob"] }
  ```

---

## 7. Short-Circuit Evaluation & Nullish Coalescing

### `&&` — Short-Circuit AND

- **`&&` evaluates left-to-right and returns the first falsy value, or the last
  value if all are truthy** — React uses this constantly for conditional rendering:
  "only render this JSX if this condition is true."

  ```jsx
  const isLoggedIn = true;
  const cart = [];

  // Conditional JSX rendering:
  return (
    <div>
      {isLoggedIn && <UserMenu />}           {/* renders UserMenu */}
      {cart.length > 0 && <CartBadge />}     {/* cart is empty, renders nothing */}
    </div>
  );
  ```

  **Gotcha:** `{0 && <Component />}` renders `0` on the page — not nothing! Because
  `0` is falsy but React renders numbers. Use `{count > 0 && <Component />}` to be safe.

### `||` — Short-Circuit OR

- **`||` returns the first truthy value it encounters, or the last value** — Used
  for fallback values: "use X, but if X is falsy, use Y."

  ```js
  const username = "" || "Anonymous"; // "" is falsy, so returns "Anonymous"
  const port = process.env.PORT || 3000; // use env var or default to 3000
  ```

  Pitfall: `||` treats `0`, `""`, and `false` as falsy, which can cause bugs.

### `??` — Nullish Coalescing

- **`??` only falls back when the left side is `null` or `undefined`** — Unlike `||`,
  it treats `0`, `""`, and `false` as valid values and does NOT fall back.

  ```js
  const count = 0;

  count || "default";  // "default" — 0 is falsy, so || falls back ❌
  count ?? "default";  // 0 — 0 is not null/undefined, so ?? keeps it ✅

  // Real-world example: user's custom font size from settings
  const fontSize = userSettings.fontSize ?? 16; // use 16 only if truly absent
  ```

### `?=` — Optional Assignment (Logical Nullish Assignment)

- **`??=` assigns a value only if the current value is null or undefined** — Useful
  for providing defaults to object properties.

  ```js
  const config = { timeout: null };
  config.timeout ??= 5000; // assigns 5000 because timeout is null
  console.log(config.timeout); // 5000
  ```

---

## 8. Optional Chaining

- **`?.` lets you safely access deeply nested properties without crashing if an
  intermediate value is `null` or `undefined`** — Instead of throwing a TypeError,
  it short-circuits and returns `undefined`. Essential when working with API data
  that may be partially missing.

  ```js
  const user = null; // API returned null

  // Without optional chaining:
  console.log(user.address.city); // ❌ TypeError: Cannot read properties of null

  // With optional chaining:
  console.log(user?.address?.city); // undefined — no crash
  ```

- **Optional chaining works on method calls too** — Put `?.` before the `()`.

  ```js
  const text = null;
  console.log(text?.toUpperCase()); // undefined, not a TypeError
  ```

- **Optional chaining works with bracket notation** — For dynamic property access.

  ```js
  const data = null;
  const key = "name";
  console.log(data?.[key]); // undefined
  ```

- **Combine with `??` for clean fallbacks** — This pattern is everywhere when
  rendering data from APIs.

  ```js
  const displayName = user?.profile?.displayName ?? "Anonymous";
  const avatarUrl   = user?.avatar?.url ?? "/default-avatar.png";
  ```

---

## 9. ES Modules: import / export

React projects use ES Modules (ESM) exclusively. Every file you write will
`import` from other files and `export` its own things.

### Named Exports

- **Named exports let a file export multiple things, each with its own name** —
  The consumer must import them using the exact same name (or alias with `as`).

  ```js
  // math.js
  export const add = (a, b) => a + b;
  export const multiply = (a, b) => a * b;
  export const PI = 3.14159;
  ```

  ```js
  // app.js
  import { add, multiply } from './math.js';
  import { add as sum } from './math.js'; // alias
  ```

### Default Export

- **A default export is the "main thing" a file exports** — Each file can have at
  most one default export. The importer can name it anything they want.

  ```js
  // Button.jsx
  function Button({ label }) {
    return <button>{label}</button>;
  }
  export default Button;
  ```

  ```js
  // App.jsx
  import Button from './Button'; // any name works, no curly braces
  import MyBtn from './Button';  // also valid
  ```

- **When to use which** — Use `default` for the main component/function of a file.
  Use `named` for utility functions, constants, types, and hooks that you export
  alongside the main thing.

  ```js
  // hooks/useFetch.js
  export function useFetch(url) { /* ... */ }         // named
  export const CACHE_TIMEOUT = 60000;                 // named
  export default useFetch;                            // default (same function)
  ```

### Import Everything

- **`import * as name` imports all named exports as properties of one object** —
  Useful when you need many things from a utility file.

  ```js
  import * as MathUtils from './math.js';
  MathUtils.add(1, 2); // 3
  MathUtils.PI;        // 3.14159
  ```

---

## 10. Promises & async/await

React fetches data from APIs inside `useEffect`. That data fetching is async. You
must understand Promises and async/await to use `useEffect` correctly.

### What is a Promise?

- **A Promise is an object that represents an operation that has not finished yet** —
  It is in one of three states: `pending` (working), `fulfilled` (success with a
  value), or `rejected` (failed with a reason). You cannot get the value out of a
  Promise synchronously — you must wait.

  ```js
  const promise = fetch('https://api.github.com/users/Chethanbhat04');
  // promise is immediately returned — but the data is NOT here yet
  // It is "pending" until the network request completes
  ```

### async/await

- **`async` marks a function as asynchronous, and `await` pauses execution inside
  it until a Promise resolves** — The function continues from where it left off once
  the value is ready. Everything after `await` runs asynchronously, but reads like
  synchronous code.

  ```js
  async function getUser(username) {
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json(); // json() also returns a Promise
    return data; // the resolved value — not a Promise
  }

  getUser("Chethanbhat04").then(user => console.log(user.name));
  ```

- **Always wrap `await` in try/catch for error handling** — If the Promise rejects
  (network error, 404, etc.), the `catch` block runs. Without it, errors are silent.

  ```js
  async function getUser(username) {
    try {
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("Failed to fetch user:", err.message);
      return null;
    }
  }
  ```

- **`async` functions ALWAYS return a Promise** — Even if you return a plain value
  like `return 42`, the caller gets `Promise<42>`. This is why you need `await` or
  `.then()` when calling an async function.

  ```js
  async function getNumber() { return 42; }
  const result = getNumber(); // result is a Promise, not 42
  const value  = await getNumber(); // value is 42
  ```

- **`Promise.all` runs multiple async operations in parallel** — Instead of
  awaiting them one by one (slow), fire them all at once and wait for all to finish.

  ```js
  // Sequential (slow — 2 seconds total if each takes 1s):
  const user   = await fetchUser(id);
  const orders = await fetchOrders(id);

  // Parallel (fast — 1 second total):
  const [user, orders] = await Promise.all([fetchUser(id), fetchOrders(id)]);
  ```

---

## 11. Exercises

1. **Destructuring drill** — Given this object, destructure `name`, `age`, and the
   `city` from the nested `address`. Provide a default for `role` as `"user"`.
   ```js
   const profile = { name: "Chethan", age: 22, address: { city: "Bangalore" } };
   ```

2. **Spread immutability** — Create a React-style state update: given `state =
   { user: "Chethan", theme: "dark", lang: "en" }`, produce a new object with
   `theme` changed to `"light"` without mutating the original.

3. **Array methods chain** — Given an array of products with `{ name, price, inStock }`,
   write a single chained expression to get the names of in-stock products that cost
   less than 500, sorted alphabetically.

4. **async/await with error handling** — Write an async function `fetchPost(id)` that
   fetches from `https://jsonplaceholder.typicode.com/posts/${id}`. Handle the case
   where the id does not exist (non-ok response) and any network error.

5. **Short-circuit gotcha** — What does `{0 && <span>Hello</span>}` render in React?
   Why? How would you fix it?

---

## 12. Milestone Project

### JS Kata Suite

Build a single HTML file (no React yet) that demonstrates mastery of every concept
from this week:

1. A function that accepts a user object and returns a formatted profile string using
   destructuring, defaults, and template literals.
2. An immutable "add to cart" function using spread.
3. A `filterAndSort(products, maxPrice)` function using `.filter()` and `.sort()`.
4. An `async fetchUser(username)` function that queries the GitHub API and displays
   the user's name, bio, and public repo count, with proper error handling.
5. A `safeGet(obj, path)` function that uses optional chaining to safely access
   `obj.a.b.c` style paths without crashing.

---

## 13. Sources

| Resource | What to Search |
|----------|---------------|
| MDN | `"Destructuring assignment"`, `"Spread syntax"`, `"Arrow functions"`, `"Optional chaining"`, `"Nullish coalescing"`, `"async function"` |
| javascript.info | `"Destructuring assignment"`, `"Array methods"`, `"Promises"`, `"Async/await"` |
| react.dev | `"JavaScript in JSX with Curly Braces"` |
| YouTube | `"Fireship.io — JavaScript in 100 Seconds"`, `"Web Dev Simplified — Async Await"` |