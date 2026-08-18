# Week 12 — React-Readiness: The JavaScript Behind React

# The Complete Deep-Dive Lesson

> **This is the capstone week. Everything you've learned in 11 weeks converges
> here. You will build a mini React clone from scratch — proving that JSX is
> just function calls, the Virtual DOM is just objects, hooks are just closures,
> and there is no magic.**

---

## Table of Contents

1. [JSX Is Just Function Calls](#1-jsx-is-just-function-calls)
2. [The Virtual DOM — UI as Plain Objects](#2-the-virtual-dom--ui-as-plain-objects)
3. [Rendering the Virtual DOM to Real DOM](#3-rendering-the-virtual-dom-to-real-dom)
4. [Reconciliation — The Diffing Algorithm](#4-reconciliation--the-diffing-algorithm)
5. [useState — Hooks Are Closures](#5-usestate--hooks-are-closures)
6. [useEffect — Side Effects with Dependency Tracking](#6-useeffect--side-effects-with-dependency-tracking)
7. [Immutable State — Why React Requires It](#7-immutable-state--why-react-requires-it)
8. [The Complete Mini React](#8-the-complete-mini-react)
9. [Exercises](#9-exercises)
10. [Sources](#10-sources)

---

## 1. JSX Is Just Function Calls

### What JSX Looks Like

```jsx
const element = <h1 className="title">Hello, World!</h1>;

const app = (
  <div className="app">
    <h1>Counter</h1>
    <p>Count: {count}</p>
    <button onClick={handleClick}>Increment</button>
  </div>
);
```

### What the Compiler Transforms It To

JSX is NOT HTML. A compiler (Babel/SWC) transforms it into JavaScript function
calls:

```js
const element = createElement("h1", { className: "title" }, "Hello, World!");

const app = createElement("div", { className: "app" },
  createElement("h1", null, "Counter"),
  createElement("p", null, "Count: ", count),
  createElement("button", { onClick: handleClick }, "Increment")
);
```

### Building createElement

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat()
        .map(child =>
          typeof child === "object" ? child : createTextElement(child)
        ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: String(text),
      children: [],
    },
  };
}
```

### What createElement Returns — A Virtual DOM Node

```js
createElement("div", { className: "app" },
  createElement("h1", null, "Hello"),
  createElement("p", null, "World")
);

// Returns this plain JavaScript object:
{
  type: "div",
  props: {
    className: "app",
    children: [
      {
        type: "h1",
        props: {
          children: [
            { type: "TEXT_ELEMENT", props: { nodeValue: "Hello", children: [] } }
          ]
        }
      },
      {
        type: "p",
        props: {
          children: [
            { type: "TEXT_ELEMENT", props: { nodeValue: "World", children: [] } }
          ]
        }
      }
    ]
  }
}
```

**That's it. The "Virtual DOM" is just nested JavaScript objects.** No magic.
Every concept from Weeks 1-11 is used here: objects, recursion, closures,
iteration, scope.

> **Source:**
> - React Docs — "Writing Markup with JSX": https://react.dev/learn/writing-markup-with-jsx
> - React Docs — "JavaScript in JSX with Curly Braces": https://react.dev/learn/javascript-in-jsx-with-curly-braces
> - Rodrigo Pombo — "Build your own React" (the inspiration): https://pomb.us/build-your-own-react/

---

## 2. The Virtual DOM — UI as Plain Objects

### Declarative vs Imperative

**Practical Mental Model (Describing State vs Manual Mutations):**
Imagine you want to change the UI from a "Logged Out" view to a "Logged In" view.

**Imperative** programming is like writing a manual, step-by-step instruction list for the browser: "Find the login button. Remove it from the DOM. Find the header text. Change it to say 'Welcome'. Find the profile picture container. Create a new `img` element. Set its `src` attribute. Append it." You are manually mutating the DOM node by node.

**Declarative** programming (which React uses) is like writing a description of the final state you want: "If the user is logged in, show a Welcome header and a Profile Picture. If not, show a Login button." You hand this description (the Virtual DOM) to the framework. The framework is responsible for looking at what the actual DOM currently looks like, figuring out the differences, and automatically writing the imperative steps to mutate the DOM for you.

```js
// IMPERATIVE — you manually issue each DOM command
const h1 = document.createElement("h1");
h1.textContent = "Hello";
h1.className = "title";
document.body.appendChild(h1);

// Later, to update — you must track the element and update it manually:
h1.textContent = "Goodbye";
h1.className = "title updated";
```

```js
// DECLARATIVE (React / Virtual DOM) — describe the desired output
// The framework computes what changed and updates the DOM for you
function App(name) {
  return createElement("h1", { className: "title" }, `Hello, ${name}`);
}
```

### Components Are Just Functions

In React, a component is a function that takes `props` and returns Virtual DOM:

```js
function Welcome(props) {
  return createElement("h1", null, `Hello, ${props.name}!`);
}

// Usage:
const vdom = createElement(Welcome, { name: "Alice" });
// type is a FUNCTION, not a string. The renderer will CALL it.
```

When the renderer encounters `type === function`, it calls the function with
its props to get the VDOM tree:

```js
function renderComponent(vnode) {
  if (typeof vnode.type === "function") {
    // It's a component — call it to get the VDOM
    const result = vnode.type(vnode.props);
    return result; // returns another VDOM tree
  }
  // It's a native element ("div", "p", etc.)
  return vnode;
}
```

> **Source:**
> - React Docs — "Your First Component": https://react.dev/learn/your-first-component
> - React Docs — "Describing the UI": https://react.dev/learn/describing-the-ui

---

## 3. Rendering the Virtual DOM to Real DOM

### The render() Function

This function takes a Virtual DOM tree and creates real DOM nodes:

```js
function render(vdom, container) {
  // Clear the container
  container.innerHTML = "";

  // Create the real DOM
  const dom = createDOM(vdom);
  container.appendChild(dom);
}

function createDOM(vnode) {
  // Handle text nodes
  if (vnode.type === "TEXT_ELEMENT") {
    return document.createTextNode(vnode.props.nodeValue);
  }

  // Handle component functions
  if (typeof vnode.type === "function") {
    // Call the component function to get its VDOM
    const componentVDOM = vnode.type(vnode.props);
    return createDOM(componentVDOM);
  }

  // Handle regular HTML elements
  const dom = document.createElement(vnode.type);

  // Set properties
  for (const [key, value] of Object.entries(vnode.props)) {
    if (key === "children") continue;

    if (key.startsWith("on")) {
      // Event listener: onClick → click
      const eventName = key.slice(2).toLowerCase();
      dom.addEventListener(eventName, value);
    } else if (key === "className") {
      dom.setAttribute("class", value);
    } else if (key === "style" && typeof value === "object") {
      Object.assign(dom.style, value);
    } else {
      dom.setAttribute(key, value);
    }
  }

  // Render children recursively
  for (const child of vnode.props.children) {
    dom.appendChild(createDOM(child));
  }

  return dom;
}
```

### Test It

```js
const vdom = createElement("div", { className: "app" },
  createElement("h1", { style: { color: "blue" } }, "My App"),
  createElement("p", null, "This was rendered from a Virtual DOM!"),
  createElement("button", {
    onClick: () => alert("Clicked!"),
  }, "Click Me")
);

render(vdom, document.getElementById("root"));
```

This renders real HTML to the page — just like React does, but we built it from
scratch.

> **Source:**
> - Rodrigo Pombo — "Build your own React": https://pomb.us/build-your-own-react/
> - React source code (ReactDOM): https://github.com/facebook/react/tree/main/packages/react-dom

---

## 4. Reconciliation — The Diffing Algorithm

### What Is Reconciliation?

When state changes, React doesn't destroy and recreate the entire DOM. It
**compares** the old Virtual DOM with the new one and applies only the minimal
changes needed. This comparison is called **reconciliation** or **diffing**.

### A Simplified Diff Algorithm

```js
function diff(oldVNode, newVNode) {
  const patches = [];

  diffNodes(oldVNode, newVNode, patches, []);
  return patches;
}

function diffNodes(oldNode, newNode, patches, path) {
  // Node was removed
  if (!newNode) {
    patches.push({ type: "REMOVE", path: [...path] });
    return;
  }

  // Node was added
  if (!oldNode) {
    patches.push({ type: "ADD", path: [...path], node: newNode });
    return;
  }

  // Node type changed (e.g., <div> → <span>)
  if (oldNode.type !== newNode.type) {
    patches.push({ type: "REPLACE", path: [...path], node: newNode });
    return;
  }

  // Text node content changed
  if (oldNode.type === "TEXT_ELEMENT") {
    if (oldNode.props.nodeValue !== newNode.props.nodeValue) {
      patches.push({
        type: "TEXT",
        path: [...path],
        value: newNode.props.nodeValue,
      });
    }
    return;
  }

  // Same element type — check for changed props
  const propPatches = diffProps(oldNode.props, newNode.props);
  if (propPatches.length > 0) {
    patches.push({ type: "PROPS", path: [...path], changes: propPatches });
  }

  // Diff children recursively
  const maxChildren = Math.max(
    oldNode.props.children.length,
    newNode.props.children.length
  );

  for (let i = 0; i < maxChildren; i++) {
    diffNodes(
      oldNode.props.children[i],
      newNode.props.children[i],
      patches,
      [...path, i]
    );
  }
}

function diffProps(oldProps, newProps) {
  const changes = [];

  // Check for changed/new props
  for (const [key, value] of Object.entries(newProps)) {
    if (key === "children") continue;
    if (oldProps[key] !== value) {
      changes.push({ key, value, oldValue: oldProps[key] });
    }
  }

  // Check for removed props
  for (const key of Object.keys(oldProps)) {
    if (key === "children") continue;
    if (!(key in newProps)) {
      changes.push({ key, value: undefined, removed: true });
    }
  }

  return changes;
}
```

### Example: Diffing Two Trees

```js
const oldTree = createElement("div", null,
  createElement("h1", null, "Hello"),
  createElement("p", { className: "text" }, "World"),
  createElement("span", null, "!")
);

const newTree = createElement("div", null,
  createElement("h1", null, "Hello"),
  createElement("p", { className: "text updated" }, "React"),
  // span was removed
);

const patches = diff(oldTree, newTree);
console.log(patches);
// [
//   { type: "PROPS", path: [1], changes: [{ key: "className", value: "text updated" }] },
//   { type: "TEXT", path: [1, 0], value: "React" },
//   { type: "REMOVE", path: [2] }
// ]

// Only 3 surgical changes instead of recreating the entire DOM!
```

### The Importance of Keys

Without keys, React compares children by **index**. Inserting an item at the
beginning shifts every index, causing unnecessary re-renders:

```
Old: [A, B, C]    → indices 0, 1, 2
New: [X, A, B, C] → indices 0, 1, 2, 3

Without keys: React thinks index 0 changed from A→X, index 1 from B→A, etc.
              It updates ALL 4 elements. Expensive!

With keys:    React sees A, B, C didn't change (same keys).
              It only INSERTS X. Cheap!
```

> **Source:**
> - React Docs — "Preserving and Resetting State": https://react.dev/learn/preserving-and-resetting-state
> - React Docs — "Rendering Lists" (keys): https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key
> - React source code — "Reconciliation": https://legacy.reactjs.org/docs/reconciliation.html

---

## 5. useState — Hooks Are Closures

### How useState Works Internally

React stores hook state in an **array**, using an **index cursor** that resets
to 0 on each render. This is why hooks must be called in the same order every
render.

```js
// ── MiniReact's hook system ──
let hooks = [];        // Array of hook values
let hookIndex = 0;     // Current position in the array
let currentComponent = null;
let currentContainer = null;

function useState(initialValue) {
  const idx = hookIndex; // Capture current index (closure!)

  // First render: initialize. Re-render: use existing value.
  if (hooks[idx] === undefined) {
    hooks[idx] = initialValue;
  }

  const setState = (newValue) => {
    // Support both direct values and updater functions
    const value = typeof newValue === "function"
      ? newValue(hooks[idx])
      : newValue;

    if (hooks[idx] === value) return; // Skip if same value

    hooks[idx] = value;
    rerender(); // Trigger a re-render
  };

  hookIndex++;
  return [hooks[idx], setState];
}

function rerender() {
  hookIndex = 0; // Reset cursor before re-render
  render(createElement(currentComponent), currentContainer);
}
```

### The Rule of Hooks Order

React tracks hooks internally using a plain array, indexed by call order. Every render, hook call #1 maps to `hooks[0]`, call #2 to `hooks[1]`, and so on. If you put a hook inside a conditional, the call count changes between renders, and every subsequent hook reads from the wrong slot.

```js
function App() {
  const [name, setName] = useState("Alice");  // hooks[0]
  const [age, setAge] = useState(25);          // hooks[1]

  // ❌ NEVER do this — breaks the index mapping
  if (name === "Alice") {
    const [special, setSpecial] = useState(true); // hooks[2]... or hooks[1]?
  }
  // On re-render, if name changes, the if-block might be skipped,
  // and hooks[2] would map to `age` instead of `special`. Chaos!
}
```

```
Render 1:                    Render 2 (if name changed):
  hooks[0] = name            hooks[0] = name ✅
  hooks[1] = age             hooks[1] = ??? ← age or special?
  hooks[2] = special         hooks[2] = ??? ← shifted!
```

React enforces the "Rules of Hooks" to prevent this. Hooks must always be:
- Called at the **top level** of the component
- Called in the **same order** every render
- Never inside conditionals, loops, or nested functions

### A Working Counter with useState

```js
function Counter() {
  const [count, setCount] = useState(0);

  return createElement("div", null,
    createElement("h2", null, `Count: ${count}`),
    createElement("button", {
      onClick: () => setCount(count + 1),
    }, "+"),
    createElement("button", {
      onClick: () => setCount(count - 1),
    }, "-"),
    createElement("button", {
      onClick: () => setCount(0),
    }, "Reset"),
  );
}
```

> **Source:**
> - React Docs — "State: A Component's Memory": https://react.dev/learn/state-a-components-memory
> - React Docs — "Rules of Hooks": https://react.dev/reference/rules/rules-of-hooks
> - "Getting Closure on React Hooks" — Shawn Wang (JSConf 2019): https://www.youtube.com/watch?v=KJP1E-Y-xyo
> - "Under the hood of React's hooks system": https://medium.com/the-guild/under-the-hood-of-reacts-hooks-system-eb59638c9dba

---

## 6. useEffect — Side Effects with Dependency Tracking

### How useEffect Works

`useEffect` runs a function **after** the component renders. It compares the
current dependencies with the previous ones to decide whether to re-run:

```js
function useEffect(callback, deps) {
  const idx = hookIndex;
  const prevDeps = hooks[idx];

  // Check if dependencies changed
  const hasChanged = !prevDeps || // first render — always run
    deps === undefined ||          // no deps array — run every render
    deps.some((dep, i) => dep !== prevDeps[i]); // compare each dep

  if (hasChanged) {
    // Run cleanup from previous effect
    if (hooks[idx + 1]) {
      hooks[idx + 1](); // call the cleanup function
    }

    // Schedule the effect to run AFTER rendering
    queueMicrotask(() => {
      const cleanup = callback();
      hooks[idx + 1] = cleanup; // store cleanup for next time
    });

    hooks[idx] = deps;
  }

  hookIndex += 2; // effect uses 2 slots: deps + cleanup
}
```

### Dependency Comparison

```js
// Runs on EVERY render (no dependency array)
useEffect(() => {
  console.log("Runs every time");
});

// Runs ONCE on mount (empty dependency array)
useEffect(() => {
  console.log("Runs once");
  return () => console.log("Cleanup on unmount");
}, []);

// Runs when `count` changes
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);
// React compares: oldDeps[0] === newDeps[0]?
// If count changed: 5 !== 6 → re-run the effect
// If count same: 5 === 5 → skip
```

### Strict Equality in Dependency Arrays

useEffect uses `===` (strict equality) to compare deps. This is why
**immutability** is critical for objects:

```js
// ❌ This ALWAYS re-runs — {} !== {} (different references every time)
useEffect(() => {
  fetchData(filters);
}, [{ status: "active" }]); // new object every render!

// ✅ This only re-runs when status changes
const [status, setStatus] = useState("active");
useEffect(() => {
  fetchData({ status });
}, [status]); // primitive comparison: "active" === "active"
```

> **Source:**
> - React Docs — "Synchronizing with Effects": https://react.dev/learn/synchronizing-with-effects
> - React Docs — "You Might Not Need an Effect": https://react.dev/learn/you-might-not-need-an-effect
> - React Docs — "Lifecycle of Reactive Effects": https://react.dev/learn/lifecycle-of-reactive-effects

---

## 7. Immutable State — How React Detects Changes

### The Core Reason

React uses **reference equality** (`===`) to detect state changes. If you
mutate an object, its reference doesn't change, so React thinks nothing changed
and **skips the re-render**:

```js
// ❌ Mutation — React misses the update
const [user, setUser] = useState({ name: "Alice", age: 25 });

function birthday() {
  user.age += 1;     // mutating the existing object
  setUser(user);     // same reference → React skips re-render!
}

// ✅ Immutable update — React sees the change
function birthday() {
  setUser({ ...user, age: user.age + 1 }); // new object → different reference
  // oldRef !== newRef → React re-renders
}
```

### How React.memo and shouldComponentUpdate Use This

```js
// React.memo does a shallow comparison of props:
function arePropsEqual(oldProps, newProps) {
  const keys = Object.keys(newProps);
  for (const key of keys) {
    if (oldProps[key] !== newProps[key]) {
      return false; // props changed → re-render
    }
  }
  return true; // all same references → skip re-render
}
```

If you mutate a prop's contents without changing the reference, `React.memo`
thinks nothing changed and **skips the re-render**.

### Common Immutable Patterns (from Week 5)

```js
// Arrays:
const added = [...items, newItem];
const removed = items.filter((_, i) => i !== indexToRemove);
const updated = items.map(item => item.id === id ? { ...item, done: true } : item);

// Objects:
const updated = { ...user, name: "Bob" };
const nested = { ...state, user: { ...state.user, age: 26 } };
const { removedKey, ...rest } = obj; // remove a property
```

> **Source:**
> - React Docs — "Updating Objects in State": https://react.dev/learn/updating-objects-in-state
> - React Docs — "Updating Arrays in State": https://react.dev/learn/updating-arrays-in-state
> - React Docs — "React.memo": https://react.dev/reference/react/memo

---

## 8. The Complete Mini React

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This is the final capstone project of the course. It synthesizes concepts from all 12 weeks.
> Make sure you have fully completed Weeks 1 through 11 before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | Closures & Hook indices mapping | Week 1 & Week 3 ✅ |
> | Rest & Spread parameters (`...children`, `{...props}`) | Week 2 & Week 5 ✅ |
> | Object methods (`Object.is`, `Object.entries`) | Week 5 ✅ |
> | DOM creation & event registration | Week 7 ✅ |
> | Scheduling updates with microtasks (`queueMicrotask`) | Week 8 & Week 11 ✅ |
>
> ✅ Make sure you understand the theoretical walkthrough of JSX, Virtual DOM, and diffing in the first 7 sections of this week before looking at this codebase.

Here is a working mini React that combines everything from this lesson:

```js
// ============================================================
// mini-react.js — A complete (simplified) React clone
// ============================================================

// ── Hook System ──
let hooks = [];
let hookIndex = 0;
let rerenderScheduled = false;
let rootComponent = null;
let rootContainer = null;
let currentVDOM = null;

function useState(initialValue) {
  const idx = hookIndex;

  if (hooks[idx] === undefined) {
    hooks[idx] = initialValue;
  }

  const setState = (newValue) => {
    const value = typeof newValue === "function"
      ? newValue(hooks[idx])
      : newValue;

    if (Object.is(hooks[idx], value)) return;
    hooks[idx] = value;

    if (!rerenderScheduled) {
      rerenderScheduled = true;
      queueMicrotask(() => {
        rerenderScheduled = false;
        performRerender();
      });
    }
  };

  hookIndex++;
  return [hooks[idx], setState];
}

function useEffect(callback, deps) {
  const idx = hookIndex;
  const prevDeps = hooks[idx]?.deps;

  const hasChanged = !prevDeps ||
    deps === undefined ||
    deps.some((dep, i) => !Object.is(dep, prevDeps[i]));

  hooks[idx] = { deps, cleanup: hooks[idx]?.cleanup };

  if (hasChanged) {
    queueMicrotask(() => {
      // Run previous cleanup
      if (hooks[idx].cleanup) hooks[idx].cleanup();
      // Run effect
      const cleanup = callback();
      hooks[idx].cleanup = typeof cleanup === "function" ? cleanup : null;
    });
  }

  hookIndex++;
}

// ── Virtual DOM ──
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat(Infinity)
        .filter(c => c != null && c !== false)
        .map(child =>
          typeof child === "object" ? child : {
            type: "TEXT",
            props: { nodeValue: String(child), children: [] },
          }
        ),
    },
  };
}

// ── Rendering ──
function createDOM(vnode) {
  if (typeof vnode.type === "function") {
    const result = vnode.type({ ...vnode.props });
    return createDOM(result);
  }

  const dom = vnode.type === "TEXT"
    ? document.createTextNode(vnode.props.nodeValue)
    : document.createElement(vnode.type);

  updateDOMProps(dom, {}, vnode.props);

  if (vnode.props.children) {
    for (const child of vnode.props.children) {
      dom.appendChild(createDOM(child));
    }
  }

  return dom;
}

function updateDOMProps(dom, oldProps, newProps) {
  // Remove old event listeners & attributes
  for (const key of Object.keys(oldProps)) {
    if (key === "children" || key === "nodeValue") continue;
    if (key.startsWith("on")) {
      const event = key.slice(2).toLowerCase();
      dom.removeEventListener(event, oldProps[key]);
    } else if (!(key in newProps)) {
      dom.removeAttribute(key === "className" ? "class" : key);
    }
  }

  // Set new event listeners & attributes
  for (const [key, value] of Object.entries(newProps)) {
    if (key === "children") continue;
    if (key === "nodeValue") {
      dom.nodeValue = value;
      continue;
    }
    if (key.startsWith("on")) {
      const event = key.slice(2).toLowerCase();
      dom.addEventListener(event, value);
    } else if (key === "className") {
      dom.setAttribute("class", value);
    } else if (key === "style" && typeof value === "object") {
      Object.assign(dom.style, value);
    } else {
      dom.setAttribute(key, value);
    }
  }
}

function render(vdom, container) {
  rootComponent = vdom.type;
  rootContainer = container;
  performRerender();
}

function performRerender() {
  hookIndex = 0;
  const vdom = createElement(rootComponent);
  rootContainer.innerHTML = "";
  rootContainer.appendChild(createDOM(vdom));
}

// ── Export ──
const MiniReact = { createElement, render, useState, useEffect };
```

### Using Mini React

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mini React Demo</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 50px auto; }
    button { margin: 4px; padding: 8px 16px; cursor: pointer; }
    .counter { font-size: 2em; margin: 16px 0; }
    input { padding: 8px; font-size: 16px; width: 100%; box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    // (paste the mini-react.js code above here)

    // ── App Component ──
    function App() {
      const [count, setCount] = MiniReact.useState(0);
      const [text, setText] = MiniReact.useState("");

      MiniReact.useEffect(() => {
        document.title = `Count: ${count}`;
        return () => { document.title = "Mini React"; };
      }, [count]);

      MiniReact.useEffect(() => {
        console.log("App mounted!");
        return () => console.log("App unmounted!");
      }, []);

      return MiniReact.createElement("div", null,
        MiniReact.createElement("h1", null, "⚛️ Mini React"),
        MiniReact.createElement("p", null, "Built from scratch with vanilla JS!"),

        MiniReact.createElement("div", { className: "counter" }, `Count: ${count}`),
        MiniReact.createElement("div", null,
          MiniReact.createElement("button", { onClick: () => setCount(c => c + 1) }, "+ Increment"),
          MiniReact.createElement("button", { onClick: () => setCount(c => c - 1) }, "- Decrement"),
          MiniReact.createElement("button", { onClick: () => setCount(0) }, "Reset"),
        ),

        MiniReact.createElement("hr", null),

        MiniReact.createElement("input", {
          value: text,
          placeholder: "Type something...",
          onInput: (e) => setText(e.target.value),
        }),
        MiniReact.createElement("p", null, text
          ? `You typed: "${text}" (${text.length} chars)`
          : "Start typing above..."
        ),
      );
    }

    // ── Mount ──
    MiniReact.render(
      MiniReact.createElement(App),
      document.getElementById("root")
    );
  </script>
</body>
</html>
```

This renders a fully functional counter and text input — all powered by our
mini React clone. No libraries, no build tools, just the JavaScript concepts
from Weeks 1-11.

> **Source:**
> - Rodrigo Pombo — "Build your own React": https://pomb.us/build-your-own-react/
> - React source (fiber): https://github.com/facebook/react/tree/main/packages/react-reconciler
> - "Getting Closure on React Hooks" — Shawn Wang: https://www.youtube.com/watch?v=KJP1E-Y-xyo

---

## 9. Exercises

### Exercise Set A: createElement and Render

```js
// A1. Use our createElement to build this UI:
//     <div class="card">
//       <img src="avatar.jpg" alt="User" />
//       <h2>Alice</h2>
//       <p>Software Engineer</p>
//       <button>Follow</button>
//     </div>

// A2. Build a List component that takes an array of items and renders <ul>/<li>
function List({ items }) {
  // YOUR CODE — use createElement
}

// A3. Build a ConditionalRender component
function ConditionalRender({ condition, ifTrue, ifFalse }) {
  // YOUR CODE
}
```

### Exercise Set B: Hooks

```js
// B1. Build a useReducer hook using our useState:
function useReducer(reducer, initialState) {
  // YOUR CODE — hint: it's just useState + dispatch wrapping
}

// B2. Build a useMemo hook
function useMemo(factory, deps) {
  // YOUR CODE — store the computed value and only recompute when deps change
}

// B3. Build a useRef hook
function useRef(initialValue) {
  // YOUR CODE — hint: it's just a stable object with a .current property
}
```

<details>
<summary><strong>Solutions</strong></summary>

```js
// B1. useReducer
function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);

  function dispatch(action) {
    setState(prevState => reducer(prevState, action));
  }

  return [state, dispatch];
}

// Usage:
function Counter() {
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "increment": return { count: state.count + 1 };
        case "decrement": return { count: state.count - 1 };
        default: return state;
      }
    },
    { count: 0 }
  );

  return createElement("div", null,
    createElement("p", null, `Count: ${state.count}`),
    createElement("button", { onClick: () => dispatch({ type: "increment" }) }, "+"),
    createElement("button", { onClick: () => dispatch({ type: "decrement" }) }, "-"),
  );
}

// B2. useMemo
function useMemo(factory, deps) {
  const idx = hookIndex;
  const prevDeps = hooks[idx]?.deps;

  const hasChanged = !prevDeps ||
    deps.some((dep, i) => !Object.is(dep, prevDeps[i]));

  if (hasChanged) {
    hooks[idx] = { value: factory(), deps };
  }

  hookIndex++;
  return hooks[idx].value;
}

// B3. useRef
function useRef(initialValue) {
  const idx = hookIndex;
  if (hooks[idx] === undefined) {
    hooks[idx] = { current: initialValue };
  }
  hookIndex++;
  return hooks[idx];
}
```

</details>

### Exercise Set C: Understanding React Patterns

```js
// C1. Explain (in writing) why this causes an infinite loop:
useEffect(() => {
  setCount(count + 1);
}, [count]);

// C2. Explain why this works correctly:
useEffect(() => {
  setCount(c => c + 1);
}, []); // runs once on mount

// C3. Explain why keys are important for lists.
// Build an example where missing keys causes a bug.
```

---

## 10. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Writing Markup with JSX | React Docs | https://react.dev/learn/writing-markup-with-jsx |
| JavaScript in JSX | React Docs | https://react.dev/learn/javascript-in-jsx-with-curly-braces |
| Build your own React | Rodrigo Pombo | https://pomb.us/build-your-own-react/ |
| Your First Component | React Docs | https://react.dev/learn/your-first-component |
| Describing the UI | React Docs | https://react.dev/learn/describing-the-ui |
| State: Component Memory | React Docs | https://react.dev/learn/state-a-components-memory |
| Rules of Hooks | React Docs | https://react.dev/reference/rules/rules-of-hooks |
| Getting Closure on Hooks | Shawn Wang (JSConf) | https://www.youtube.com/watch?v=KJP1E-Y-xyo |
| Hooks system internals | The Guild Blog | https://medium.com/the-guild/under-the-hood-of-reacts-hooks-system-eb59638c9dba |
| Synchronizing with Effects | React Docs | https://react.dev/learn/synchronizing-with-effects |
| You Might Not Need an Effect | React Docs | https://react.dev/learn/you-might-not-need-an-effect |
| Lifecycle of Effects | React Docs | https://react.dev/learn/lifecycle-of-reactive-effects |
| Updating Objects in State | React Docs | https://react.dev/learn/updating-objects-in-state |
| Updating Arrays in State | React Docs | https://react.dev/learn/updating-arrays-in-state |
| React.memo | React Docs | https://react.dev/reference/react/memo |
| Preserving/Resetting State | React Docs | https://react.dev/learn/preserving-and-resetting-state |
| Rendering Lists (keys) | React Docs | https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key |
| Reconciliation | React Legacy Docs | https://legacy.reactjs.org/docs/reconciliation.html |
| React Fiber source | GitHub | https://github.com/facebook/react/tree/main/packages/react-reconciler |
| ReactDOM source | GitHub | https://github.com/facebook/react/tree/main/packages/react-dom |

---

##  Course Complete — What's Next?

You have now built:
- An **execution context visualizer** (Week 1)
- A **type coercion debugger** (Week 2)
- A **rate limiter** using closures (Week 3)
- A **schema validator** with prototypal inheritance (Week 4)
- A **data transformation pipeline** (Week 5)
- A **plugin-based logger** with ES Modules (Week 6)
- A **virtual scrolling list** with DOM recycling (Week 7)
- An **async task queue** with concurrency control (Week 8)
- A **GitHub explorer** with debounce/abort/infinite scroll (Week 9)
- A **reactive state management library** using Proxy (Week 10)
- A **performance monitoring dashboard** (Week 11)
- A **mini React clone** from scratch (Week 12)

### Your next step: Open `react.dev` and start the official React tutorial.

Every concept will now make sense:
- Components → functions returning objects (Week 12)
- JSX → `createElement` calls (Week 12)
- State → closures over an array (Weeks 3, 12)
- Effects → scheduled callbacks with dep comparison (Week 12)
- Event handling → delegation on the root (Week 7)
- Immutable updates → spread patterns (Week 5)
- Virtual DOM → plain JS objects + diffing (Week 12)
- Re-rendering → observer pattern triggering `createDOM` (Week 10)
- Concurrent features → `requestIdleCallback` scheduling (Week 11)

**You didn't just learn JavaScript. You learned the JavaScript that *powers* React.**
