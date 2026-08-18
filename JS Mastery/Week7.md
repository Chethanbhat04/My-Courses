# Week 7 — The DOM, Events, and Browser Rendering

# The Complete Deep-Dive Lesson

> **React abstracts the DOM. But to truly understand React — why it uses a
> Virtual DOM, why it batches updates, why keys matter — you must first
> understand what it's abstracting. This lesson is that foundation.**

---

## Table of Contents

1. [The DOM Tree — How HTML Becomes Objects](#1-the-dom-tree--how-html-becomes-objects)
2. [DOM Traversal and Manipulation](#2-dom-traversal-and-manipulation)
3. [Event Handling — addEventListener Deep Dive](#3-event-handling--addeventlistener-deep-dive)
4. [Event Bubbling, Capturing, and Delegation](#4-event-bubbling-capturing-and-delegation)
5. [The Critical Rendering Path](#5-the-critical-rendering-path)
6. [Reflow vs Repaint — Performance](#6-reflow-vs-repaint--performance)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. The DOM Tree — How HTML Becomes Objects

### What Is the DOM?

The **Document Object Model** is the browser's in-memory representation of an
HTML page. When the browser parses HTML, it creates a tree of JavaScript objects
(nodes) that you can manipulate with code.

**The DOM is NOT your HTML file.** It's the live, interactive version of it.

```html
<html>
  <body>
    <h1>Hello</h1>
    <p>World</p>
  </body>
</html>
```

Becomes:

```
document
  └── html (Element)
       ├── head (Element)
       └── body (Element)
            ├── h1 (Element)
            │    └── "Hello" (Text)
            └── p (Element)
                 └── "World" (Text)
```

### Node Types

```js
document.nodeType;                 // 9 (DOCUMENT_NODE)
document.body.nodeType;            // 1 (ELEMENT_NODE)
document.body.firstChild.nodeType; // 3 (TEXT_NODE) — might be whitespace!
```

| Node Type | Value | Example |
|-----------|-------|---------|
| `ELEMENT_NODE` | 1 | `<div>`, `<p>`, `<span>` |
| `TEXT_NODE` | 3 | `"Hello"` |
| `COMMENT_NODE` | 8 | `<!-- comment -->` |
| `DOCUMENT_NODE` | 9 | `document` |

> **Source:**
> - MDN — "Introduction to the DOM": https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction
> - JavaScript.info — "DOM tree": https://javascript.info/dom-nodes

---

## 2. DOM Traversal and Manipulation

### Selecting Elements

```js
// By ID (returns one element or null)
const header = document.getElementById("main-header");

// By CSS selector (returns first match or null)
const firstBtn = document.querySelector(".btn-primary");

// By CSS selector (returns ALL matches — a static NodeList)
const allBtns = document.querySelectorAll(".btn");

// By class name (returns live HTMLCollection)
const items = document.getElementsByClassName("item");

// By tag name (returns live HTMLCollection)
const paragraphs = document.getElementsByTagName("p");
```

**`querySelector` vs `getElementById`:** `querySelector` is more flexible (any
CSS selector), but `getElementById` is faster for ID lookups.

### Creating and Inserting Elements

```js
// Create elements
const div = document.createElement("div");
div.className = "card";
div.id = "user-card";
div.textContent = "Alice";

// Set attributes
div.setAttribute("data-user-id", "123");
div.style.backgroundColor = "#f0f0f0";

// Append to the DOM
document.body.appendChild(div);

// Insert at specific position
const container = document.querySelector(".container");
container.insertBefore(div, container.firstChild); // Insert at beginning

// Modern methods (more intuitive):
container.prepend(div);          // Insert as first child
container.append(div);           // Insert as last child
container.before(div);           // Insert before container
container.after(div);            // Insert after container

// Insert HTML strings
container.insertAdjacentHTML("beforeend", '<p class="new">New paragraph</p>');
// Positions: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
```

### Removing Elements

```js
const element = document.querySelector(".old-element");

// Modern way
element.remove();

// Old way (still used in legacy code)
element.parentNode.removeChild(element);
```

### Cloning Elements

```js
const original = document.querySelector(".template");
const clone = original.cloneNode(true);  // true = deep clone (includes children)
// false = shallow clone (element only, no children)
document.body.appendChild(clone);
```

### DocumentFragment — Batch Insertions

Inserting elements one at a time causes multiple reflows. Use a
`DocumentFragment` to batch them:

```js
// ❌ BAD — 1000 reflows
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  list.appendChild(li);  // triggers reflow each time
}

// ✅ GOOD — 1 reflow
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  fragment.appendChild(li);  // no reflow — fragment is not in the DOM
}
list.appendChild(fragment);  // ONE reflow when the fragment is inserted
```

> **Source:**
> - MDN — "Document.querySelector()": https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
> - MDN — "Document.createElement()": https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
> - MDN — "DocumentFragment": https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
> - JavaScript.info — "Modifying the document": https://javascript.info/modifying-document

---

## 3. Event Handling — addEventListener Deep Dive

### Basic Event Handling

```js
const button = document.querySelector("#submit-btn");

button.addEventListener("click", function(event) {
  console.log("Button clicked!");
  console.log("Target:", event.target);            // The element clicked
  console.log("Type:", event.type);                // "click"
  console.log("Coordinates:", event.clientX, event.clientY);
});
```

### The Event Object

Every event handler receives an `event` object with useful properties:

```js
element.addEventListener("click", (e) => {
  e.target;          // The element that TRIGGERED the event
  e.currentTarget;   // The element the listener is ATTACHED to
  e.type;            // "click", "keydown", "submit", etc.
  e.timeStamp;       // When the event occurred
  e.preventDefault();  // Prevent default behavior (e.g., form submission)
  e.stopPropagation(); // Stop the event from bubbling up
});
```

### Common Event Types

```js
// Mouse events
element.addEventListener("click", handler);
element.addEventListener("dblclick", handler);
element.addEventListener("mouseenter", handler);  // no bubbling
element.addEventListener("mouseleave", handler);  // no bubbling
element.addEventListener("mouseover", handler);   // bubbles

// Keyboard events
document.addEventListener("keydown", (e) => {
  console.log(e.key);      // "Enter", "Escape", "a", "ArrowUp"
  console.log(e.code);     // "Enter", "Escape", "KeyA", "ArrowUp"
  console.log(e.ctrlKey);  // true if Ctrl is held
  console.log(e.shiftKey); // true if Shift is held
});

// Form events
form.addEventListener("submit", (e) => {
  e.preventDefault(); // Prevent page reload
  const formData = new FormData(form);
  console.log(Object.fromEntries(formData));
});

input.addEventListener("input", (e) => {
  console.log(e.target.value); // fires on every keystroke
});

input.addEventListener("change", (e) => {
  console.log(e.target.value); // fires when input loses focus
});

// Focus events
input.addEventListener("focus", handler);
input.addEventListener("blur", handler);

// Scroll event
window.addEventListener("scroll", () => {
  console.log(window.scrollY);
});
```

### Removing Event Listeners

```js
function handleClick(e) {
  console.log("Clicked!");
}

button.addEventListener("click", handleClick);
button.removeEventListener("click", handleClick); // Must pass the SAME function reference

// ❌ This WON'T work — anonymous functions can't be removed
button.addEventListener("click", () => console.log("Hi"));
button.removeEventListener("click", () => console.log("Hi")); // different function!

// ✅ Use AbortController for easier cleanup
const controller = new AbortController();
button.addEventListener("click", handleClick, { signal: controller.signal });
// Later:
controller.abort(); // removes ALL listeners registered with this signal
```

> **Source:**
> - MDN — "EventTarget.addEventListener()": https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
> - MDN — "Event reference": https://developer.mozilla.org/en-US/docs/Web/Events
> - JavaScript.info — "Introduction to browser events": https://javascript.info/introduction-browser-events

---

## 4. Event Bubbling, Capturing, and Delegation

### The Three Phases of Event Propagation

When an event occurs, it goes through three phases:

```
PHASE 1: CAPTURING (top → down)
window → document → html → body → div → button (target)

PHASE 2: TARGET
The event fires on the target element itself

PHASE 3: BUBBLING (bottom → up)
button (target) → div → body → html → document → window
```

```
         ┌─ CAPTURING ──────────┐
         │     (top → down)     │
         ▼                      │
┌─ window ───────────────────────────────┐
│  ┌─ document ───────────────────────┐  │
│  │  ┌─ <body> ───────────────────┐  │  │
│  │  │  ┌─ <div> ──────────────┐  │  │  │
│  │  │  │  ┌─ <button> ─────┐  │  │  │  │
│  │  │  │  │   (TARGET)      │  │  │  │  │
│  │  │  │  └─────────────────┘  │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │                      ▲
         │  BUBBLING ───────────┘
         └─── (bottom → up)
```

### Bubbling in Action

```js
document.querySelector("#outer").addEventListener("click", () => {
  console.log("Outer div clicked");
});

document.querySelector("#inner").addEventListener("click", () => {
  console.log("Inner div clicked");
});

document.querySelector("#btn").addEventListener("click", () => {
  console.log("Button clicked");
});

// Click on #btn → output:
// "Button clicked"    (target phase)
// "Inner div clicked" (bubbling)
// "Outer div clicked" (bubbling)
```

### Stopping Propagation

```js
document.querySelector("#btn").addEventListener("click", (e) => {
  e.stopPropagation(); // prevents bubbling to parent elements
  console.log("Only this handler runs");
});
```

### Event Delegation

Instead of attaching listeners to every child, attach ONE listener to the
parent and check `event.target`:

```js
// ❌ INEFFICIENT — one listener per item
document.querySelectorAll(".item").forEach(item => {
  item.addEventListener("click", handleItemClick);
});

// ✅ EFFICIENT — one listener on the parent
document.querySelector("#item-list").addEventListener("click", (e) => {
  const item = e.target.closest(".item"); // find the clicked .item
  if (!item) return; // click wasn't on an item

  console.log("Clicked item:", item.dataset.id);
});
```

**Why event delegation matters:**
1. **Performance** — One listener instead of hundreds/thousands.
2. **Dynamic elements** — Works for elements added AFTER the listener was
   attached (e.g., new list items).
3. **Memory** — Fewer event listeners = less memory.

**This is exactly what React does.** React attaches a single event listener to
the root element and uses delegation for all events.

```js
// Practical example: a dynamic todo list with delegation
const todoList = document.querySelector("#todos");

todoList.addEventListener("click", (e) => {
  // Delete button
  if (e.target.matches(".delete-btn")) {
    e.target.closest(".todo-item").remove();
    return;
  }

  // Toggle complete
  if (e.target.matches(".todo-checkbox")) {
    e.target.closest(".todo-item").classList.toggle("completed");
    return;
  }
});

// New items added later will automatically have event handling!
function addTodo(text) {
  const html = `
    <li class="todo-item">
      <input type="checkbox" class="todo-checkbox">
      <span>${text}</span>
      <button class="delete-btn">×</button>
    </li>`;
  todoList.insertAdjacentHTML("beforeend", html);
}
```

> **Source:**
> - MDN — "Event bubbling": https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Event_bubbling
> - JavaScript.info — "Bubbling and capturing": https://javascript.info/bubbling-and-capturing
> - JavaScript.info — "Event delegation": https://javascript.info/event-delegation

---

## 5. The Critical Rendering Path

### How the Browser Renders a Page

```
HTML → Parser → DOM Tree
                         ↘
                      Render Tree → Layout → Paint → Composite → Screen
                         ↗
CSS  → Parser → CSSOM Tree

JavaScript can modify both the DOM and CSSOM at any step.
```

**Step-by-step:**

1. **Parse HTML** → Build the **DOM** (Document Object Model) tree.
2. **Parse CSS** → Build the **CSSOM** (CSS Object Model) tree.
3. **Combine** DOM + CSSOM → **Render Tree** (only visible elements).
4. **Layout** — Calculate the exact position and size of every element.
5. **Paint** — Fill in pixels: colors, text, images, borders.
6. **Composite** — Layer elements and display on screen.

### How `<script>` Tags Block Rendering

When the parser hits a `<script>` tag, it **stops parsing HTML**, downloads and
executes the script, then resumes. This is because the script might modify the
DOM.

```html
<!-- ❌ Blocks rendering -->
<head>
  <script src="app.js"></script>
</head>

<!-- ✅ defer — download in parallel, execute after HTML is parsed -->
<script defer src="app.js"></script>

<!-- ✅ async — download in parallel, execute immediately when ready -->
<script async src="analytics.js"></script>
```

| Attribute | Download | Execution | Use For |
|-----------|----------|-----------|---------|
| (none) | Blocks parsing | Blocks parsing | Legacy |
| `async` | Parallel | As soon as downloaded | Analytics, ads |
| `defer` | Parallel | After HTML parsed (DOMContentLoaded) | App scripts |

> **Source:**
> - MDN — "Critical rendering path": https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path
> - JavaScript.info — "Page lifecycle: DOMContentLoaded, load, beforeunload, unload": https://javascript.info/onload-ondomcontentloaded
> - web.dev — "Critical rendering path": https://web.dev/articles/critical-rendering-path

---

## 6. Reflow vs Repaint — Performance

### Reflow (Layout)

A **reflow** recalculates the position and size of elements. It's the most
expensive rendering operation.

**Triggers:** Changing `width`, `height`, `margin`, `padding`, `display`,
`position`, `font-size`, or reading layout properties like `offsetHeight`.

### Repaint

A **repaint** redraws pixels without changing layout. Cheaper than reflow.

**Triggers:** Changing `color`, `background-color`, `visibility`, `box-shadow`.

### Composite

The cheapest operation — just moves already-painted layers.

**Triggers:** `transform`, `opacity`. These are GPU-accelerated.

### Layout Thrashing

**Layout thrashing** occurs when you read a layout property and then write a
style in a tight loop. Each read forces the browser to calculate layout:

```js
// ❌ LAYOUT THRASHING — forces reflow on every iteration
const elements = document.querySelectorAll(".box");
for (const el of elements) {
  const height = el.offsetHeight;     // READ — forces layout calculation
  el.style.height = height * 2 + "px"; // WRITE — invalidates layout
  // Next READ will force another layout calculation!
}

// ✅ BATCH READS, THEN BATCH WRITES
const heights = [];
for (const el of elements) {
  heights.push(el.offsetHeight);      // READ all first
}
for (let i = 0; i < elements.length; i++) {
  elements[i].style.height = heights[i] * 2 + "px"; // WRITE all
}
// Only ONE reflow at the end
```

### Using requestAnimationFrame for Smooth Animations

```js
// ❌ Janky — runs at unpredictable times
setInterval(() => {
  element.style.left = parseInt(element.style.left) + 1 + "px";
}, 16);

// ✅ Smooth — synced to the browser's refresh rate (60fps)
function animate() {
  element.style.left = parseInt(element.style.left) + 1 + "px";
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

> **Source:**
> - MDN — "requestAnimationFrame": https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
> - web.dev — "Avoid large, complex layouts and layout thrashing": https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
> - Google Developers — "Rendering performance": https://developer.chrome.com/docs/devtools/performance

---

## 7. Exercises

### Exercise Set A: DOM Manipulation

```js
// A1. Create a dynamic table from data (no innerHTML for the structure)
const data = [
  { name: "Alice", age: 25, role: "Engineer" },
  { name: "Bob", age: 30, role: "Designer" },
  { name: "Carol", age: 28, role: "Manager" },
];
// Build a <table> with headers and rows using only DOM APIs

// A2. Build a real-time search filter
// Given a list of items, filter them as the user types in an input

// A3. Build keyboard navigation for a custom dropdown
// Arrow Up/Down to move selection, Enter to select, Escape to close
```

### Exercise Set B: Events

```js
// B1. Implement event delegation for a nested menu:
// <nav id="menu">
//   <ul>
//     <li data-page="home">Home</li>
//     <li data-page="about">About
//       <ul>
//         <li data-page="team">Team</li>
//         <li data-page="history">History</li>
//       </ul>
//     </li>
//   </ul>
// </nav>
// One listener on #menu that detects which page was clicked

// B2. Build a click-outside detector
// Create a function that calls a callback when user clicks outside an element

// B3. Implement drag-and-drop for a list (reorder items by dragging)
```

---

## 8. Milestone Project

### Build: A Virtual Scrolling List

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project uses DOM manipulation, event listeners, and classes.
> Make sure you have finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | `class`, `constructor`, `this` | Week 4 ✅ |
> | DOM — `document.createElement()`, `appendChild()` | Week 7 (this week) |
> | DOM — `addEventListener()`, event delegation | Week 7 (this week) |
> | DOM — `element.style`, `dataset` | Week 7 (this week) |
> | `Math.ceil()`, `Math.floor()` | Week 3 ✅ |
> | `for` loop with `let` | Week 1 ✅ |
> | Template literals | Week 2 ✅ |
>
> ✅ Complete all of Week 7 before starting this project.

Render 10,000 items with only ~30 DOM nodes:

```js
class VirtualList {
  constructor(container, items, rowHeight = 40) {
    this.container = container;
    this.items = items;
    this.rowHeight = rowHeight;
    this.visibleCount = Math.ceil(container.clientHeight / rowHeight) + 2;

    this.container.style.overflow = "auto";
    this.container.style.position = "relative";

    // Spacer to create scrollbar
    this.spacer = document.createElement("div");
    this.spacer.style.height = `${items.length * rowHeight}px`;
    this.container.appendChild(this.spacer);

    // Pool of reusable DOM nodes
    this.pool = [];
    for (let i = 0; i < this.visibleCount; i++) {
      const el = document.createElement("div");
      el.style.position = "absolute";
      el.style.height = `${rowHeight}px`;
      el.style.width = "100%";
      el.style.boxSizing = "border-box";
      el.style.padding = "8px 16px";
      el.style.borderBottom = "1px solid #eee";
      this.container.appendChild(el);
      this.pool.push(el);
    }

    // Handle scroll with event delegation
    this.container.addEventListener("scroll", () => this.render());

    // Single click handler (delegation)
    this.container.addEventListener("click", (e) => {
      const index = e.target.dataset?.index;
      if (index !== undefined) {
        console.log("Clicked item:", this.items[index]);
      }
    });

    this.render();
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.rowHeight);

    for (let i = 0; i < this.pool.length; i++) {
      const itemIndex = startIndex + i;
      const el = this.pool[i];

      if (itemIndex < this.items.length) {
        el.style.top = `${itemIndex * this.rowHeight}px`;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.textContent = this.items[itemIndex];
        el.dataset.index = itemIndex;
      } else {
        el.style.display = "none";
      }
    }
  }
}

// Usage:
// const items = Array.from({ length: 10000 }, (_, i) => `Item #${i + 1}`);
// new VirtualList(document.querySelector("#list-container"), items);
```

**Your extensions:**
1. Add variable height rows.
2. Add a search/filter feature.
3. Measure and log performance (DOM node count, render time).
4. Add smooth scroll-to-index functionality.

---

## 9. Sources

| Topic | Source | URL |
|-------|--------|-----|
| DOM Introduction | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction |
| DOM tree | JavaScript.info | https://javascript.info/dom-nodes |
| querySelector | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector |
| createElement | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement |
| DocumentFragment | MDN | https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment |
| Modifying document | JavaScript.info | https://javascript.info/modifying-document |
| addEventListener | MDN | https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener |
| Event reference | MDN | https://developer.mozilla.org/en-US/docs/Web/Events |
| Browser events | JavaScript.info | https://javascript.info/introduction-browser-events |
| Event bubbling | MDN | https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Event_bubbling |
| Bubbling/capturing | JavaScript.info | https://javascript.info/bubbling-and-capturing |
| Event delegation | JavaScript.info | https://javascript.info/event-delegation |
| Critical rendering path | MDN | https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path |
| Page lifecycle | JavaScript.info | https://javascript.info/onload-ondomcontentloaded |
| Critical rendering path | web.dev | https://web.dev/articles/critical-rendering-path |
| requestAnimationFrame | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame |
| Layout thrashing | web.dev | https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing |
| Rendering performance | Chrome DevDocs | https://developer.chrome.com/docs/devtools/performance |
