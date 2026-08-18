# Week 2 — React Core: JSX, Components & Props

# The Complete Deep-Dive Lesson

> **By the end of this week you will know what React actually IS under the hood,
> how JSX compiles to plain JavaScript, and how to build reusable components that
> accept and display data through props.**

---

## Table of Contents

1. [What React Actually Is](#1-what-react-actually-is)
2. [JSX — What It Compiles To](#2-jsx--what-it-compiles-to)
3. [Your First Component](#3-your-first-component)
4. [Props — Passing Data Down](#4-props--passing-data-down)
5. [The `children` Prop](#5-the-children-prop)
6. [Conditional Rendering](#6-conditional-rendering)
7. [List Rendering & the `key` Prop](#7-list-rendering--the-key-prop)
8. [Component Composition](#8-component-composition)
9. [Exercises](#9-exercises)
10. [Milestone Project](#10-milestone-project)
11. [Sources](#11-sources)

---

## 1. What React Actually Is

- **React is a JavaScript library for building user interfaces — not a framework** —
  It does one thing: given data, render a UI. It does not manage routing, HTTP calls,
  form validation, or global state by itself. You add those with other libraries.

  ```
  Your Data → React → DOM
  ```

  When your data changes, React updates the DOM efficiently. That's the entire pitch.

- **React uses a Virtual DOM to avoid expensive real DOM operations** — Instead of
  directly updating `document.getElementById(...)`, React first computes changes
  in a lightweight JavaScript copy of the DOM (the Virtual DOM), then applies only
  the minimum necessary changes to the real DOM in one batch.

  ```
  State changes
       ↓
  React re-renders Virtual DOM (fast — pure JS objects)
       ↓
  React diffs old Virtual DOM vs new Virtual DOM
       ↓
  React patches only changed parts of the real DOM (expensive — minimal)
  ```

  This is called "reconciliation". You do not trigger DOM updates manually — React
  handles it every time state changes.

- **React follows a one-way data flow** — Data flows DOWN from parent to child via
  props. Children cannot directly modify a parent's data. This makes bugs predictable:
  you always know where data comes from.

  ```
  App (data lives here)
   └── UserList (receives data as props)
        └── UserCard (receives individual user as prop)
  ```

  To send data "up" (e.g., a child button click affecting a parent), you pass a
  function down as a prop. The child calls it. This is covered in Week 3.

---

## 2. JSX — What It Compiles To

JSX is NOT HTML and it is NOT a new language. It is **syntactic sugar** for calling
`React.createElement()`. Babel (or Vite's compiler) transforms it.

- **Every JSX element compiles to a `React.createElement()` call** — Understanding
  this removes the magic. JSX is just a nicer way to write nested function calls.

  ```jsx
  // What you write:
  const element = <h1 className="title">Hello, {name}!</h1>;

  // What Babel compiles it to:
  const element = React.createElement(
    "h1",                   // tag name
    { className: "title" }, // props object
    "Hello, ",              // child 1
    name                    // child 2 (expression)
  );
  ```

  `React.createElement` returns a plain JavaScript object — a "React element" — not
  a real DOM node. React eventually uses these objects to build and update the DOM.

- **JSX rules differ from HTML — know the key differences** — JSX looks like HTML
  but has several important differences.

  ```jsx
  // 1. Use className instead of class (class is a reserved JS keyword)
  <div className="card">...</div>

  // 2. Self-close tags with no children
  <img src="/photo.jpg" alt="Profile" />
  <input type="text" />

  // 3. JavaScript expressions go inside {}
  <p>Hello, {user.name.toUpperCase()}!</p>
  <button disabled={isLoading}>Submit</button>

  // 4. CamelCase for event handlers and properties
  <button onClick={handleClick}>Click</button>   // not onclick
  <input onChange={handleChange} />               // not onchange
  <label htmlFor="email">Email</label>            // not for
  ```

- **JSX must return a single root element** — You cannot return two siblings without
  wrapping them. Use a Fragment `<>...</>` to avoid adding a pointless `<div>`.

  ```jsx
  // ❌ Invalid — two root elements
  return (
    <h1>Title</h1>
    <p>Content</p>
  );

  // ✅ Valid — wrapped in Fragment (no real DOM element created)
  return (
    <>
      <h1>Title</h1>
      <p>Content</p>
    </>
  );
  ```

- **Expressions, not statements, inside `{}`** — You can put any JS expression
  (ternary, function call, variable) inside `{}`, but NOT statements like `if`,
  `for`, or `while`.

  ```jsx
  // ✅ Expression (returns a value):
  <p>{isAdmin ? "Admin" : "User"}</p>
  <p>{formatDate(user.createdAt)}</p>
  <p>{[1, 2, 3].join(", ")}</p>

  // ❌ Statement (does not return a value — invalid inside JSX):
  <p>{if (isAdmin) { "Admin" }}</p>
  ```

---

## 3. Your First Component

- **A React component is just a JavaScript function that returns JSX** — The
  function name must start with a capital letter (this is how React tells components
  apart from plain HTML tags). Keep each component in its own file.

  ```jsx
  // Greeting.jsx
  function Greeting() {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    return (
      <div className="greeting">
        <h2>Good {timeOfDay}! 👋</h2>
        <p>Welcome to React Mastery.</p>
      </div>
    );
  }

  export default Greeting;
  ```

  ```jsx
  // App.jsx
  import Greeting from './Greeting';

  function App() {
    return (
      <main>
        <Greeting />   {/* React sees capital G → treats as component, not HTML tag */}
      </main>
    );
  }
  ```

- **The component must always return something** — Return `null` if you want to
  render nothing (e.g., a hidden element). Returning `undefined` throws an error.

  ```jsx
  function HiddenBanner({ show }) {
    if (!show) return null; // renders nothing — no DOM output
    return <div className="banner">Important notice!</div>;
  }
  ```

---

## 4. Props — Passing Data Down

Props (short for "properties") are the inputs to a component. They flow from parent
to child — never the other way around.

- **Props are passed like HTML attributes and received as a single object** —
  The component function receives one argument: the props object. You always
  destructure it for cleaner code.

  ```jsx
  // Parent passing props:
  <UserCard name="Chethan" age={22} isAdmin={true} />

  // Child receiving props (option 1 — full object):
  function UserCard(props) {
    return <p>{props.name} is {props.age} years old.</p>;
  }

  // Child receiving props (option 2 — destructured, preferred):
  function UserCard({ name, age, isAdmin }) {
    return (
      <div>
        <p>{name} is {age} years old.</p>
        {isAdmin && <span className="badge">Admin</span>}
      </div>
    );
  }
  ```

- **Props can be any JavaScript value** — strings, numbers, booleans, arrays,
  objects, functions, even other React elements. Use `{}` for non-string values.

  ```jsx
  <ProductCard
    name="Laptop"              // string — no braces needed
    price={85000}              // number — braces required
    inStock={true}             // boolean — braces required
    tags={["sale", "new"]}    // array — braces required
    onBuy={handleBuy}          // function — braces required
  />
  ```

  A boolean prop with no value defaults to `true`: `<Button disabled />` is the
  same as `<Button disabled={true} />`.

- **Props are READ-ONLY — never modify them inside the component** — This is
  React's rule of "pure components". A component with the same props must always
  produce the same output. Modifying props would break this contract.

  ```jsx
  function Badge({ label }) {
    label = label.toUpperCase(); // ❌ Never mutate props — use a local variable
    const displayLabel = label.toUpperCase(); // ✅ Derive a new value instead
    return <span>{displayLabel}</span>;
  }
  ```

- **Default prop values prevent crashes when a prop is not passed** — Use ES6
  default parameter syntax directly in the destructuring.

  ```jsx
  function Avatar({ name, size = 48, shape = "circle" }) {
    return (
      <img
        src={`/avatars/${name}.png`}
        width={size}
        height={size}
        className={`avatar avatar--${shape}`}
        alt={name}
      />
    );
  }

  <Avatar name="chethan" />                 // size=48, shape="circle"
  <Avatar name="chethan" size={96} />       // size=96, shape="circle"
  <Avatar name="chethan" shape="square" />  // size=48, shape="square"
  ```

---

## 5. The `children` Prop

- **`children` is a special built-in prop that contains whatever you put between the
  opening and closing tags** — This is how you build reusable wrapper/layout
  components like cards, modals, and page sections.

  ```jsx
  // The wrapper component:
  function Card({ children, title }) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>{title}</h3>
        </div>
        <div className="card-body">
          {children}  {/* renders whatever the parent put inside <Card>...</Card> */}
        </div>
      </div>
    );
  }

  // Using the wrapper:
  function App() {
    return (
      <Card title="User Profile">
        <img src="/avatar.png" alt="avatar" />
        <p>Name: Chethan</p>
        <button>Edit Profile</button>
      </Card>
    );
  }
  ```

  `children` can be text, a single element, multiple elements, or even null — the
  Card component does not need to know or care.

---

## 6. Conditional Rendering

React has no `v-if` or `*ngIf` directive — you use plain JavaScript inside JSX.

- **Ternary operator for if-else rendering** — The most common pattern. Returns
  one of two JSX trees based on a condition.

  ```jsx
  function StatusBadge({ isOnline }) {
    return (
      <span className={`badge ${isOnline ? "badge--green" : "badge--red"}`}>
        {isOnline ? "Online" : "Offline"}
      </span>
    );
  }
  ```

- **`&&` for "render only if true"** — When you have nothing to show in the false
  case, `&&` is cleaner than a ternary with `null`.

  ```jsx
  function Notification({ message, type }) {
    return (
      <div>
        {message && (
          <div className={`alert alert--${type}`}>{message}</div>
        )}
      </div>
    );
  }
  ```

- **Early return for complex conditions** — When the condition is complex or you
  want to render a completely different layout, return early from the component.

  ```jsx
  function UserProfile({ user, isLoading, error }) {
    if (isLoading) return <Spinner />;
    if (error)     return <ErrorMessage text={error.message} />;
    if (!user)     return null;

    // If we reach here, user is definitely available
    return (
      <div className="profile">
        <h2>{user.name}</h2>
        <p>{user.bio}</p>
      </div>
    );
  }
  ```

  Early returns are especially clean for loading/error states. This pattern is used
  in virtually every data-fetching component.

---

## 7. List Rendering & the `key` Prop

- **Use `.map()` to transform an array of data into an array of JSX elements** —
  React can render arrays of elements automatically. `.map()` is the idiomatic tool.

  ```jsx
  const products = [
    { id: 1, name: "Laptop", price: 85000 },
    { id: 2, name: "Mouse",  price: 1500  },
    { id: 3, name: "Keyboard", price: 4000 },
  ];

  function ProductList() {
    return (
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} — ₹{product.price.toLocaleString()}
          </li>
        ))}
      </ul>
    );
  }
  ```

- **The `key` prop is required and must be unique among siblings** — React uses
  `key` to identify which item changed, was added, or was removed during a
  re-render. Without it, React re-renders the whole list instead of just the
  changed item, causing bugs and performance problems.

  ```jsx
  // ❌ No key — React warns and renders inefficiently
  {items.map(item => <li>{item.name}</li>)}

  // ❌ Index as key — wrong when list order can change
  {items.map((item, index) => <li key={index}>{item.name}</li>)}

  // ✅ Stable unique ID from data — correct
  {items.map(item => <li key={item.id}>{item.name}</li>)}
  ```

  Why is index as key bad? If you reorder or delete items, the indices shift. React
  sees `key=0` still exists and thinks nothing changed — it reuses the wrong
  component instance, causing subtle state bugs (especially with forms and inputs).

- **The `key` must be on the top-level element returned from `.map()`** — Not on
  a child inside it.

  ```jsx
  // ❌ Wrong — key on inner element
  {items.map(item => (
    <div>
      <li key={item.id}>{item.name}</li>
    </div>
  ))}

  // ✅ Correct — key on the outermost element returned from map
  {items.map(item => (
    <div key={item.id}>
      <li>{item.name}</li>
    </div>
  ))}
  ```

---

## 8. Component Composition

- **Build small, focused components and compose them together** — This is the core
  mental model of React. Instead of one massive component, build a tree of small
  ones each with a single responsibility.

  ```jsx
  // Small focused components:
  function Avatar({ src, name }) {
    return <img className="avatar" src={src} alt={name} />;
  }

  function UserName({ name, role }) {
    return (
      <div>
        <strong>{name}</strong>
        <span className="role-badge">{role}</span>
      </div>
    );
  }

  function ActionMenu({ onEdit, onDelete }) {
    return (
      <div className="actions">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    );
  }

  // Composed into a larger component:
  function UserCard({ user, onEdit, onDelete }) {
    return (
      <div className="user-card">
        <Avatar src={user.avatarUrl} name={user.name} />
        <UserName name={user.name} role={user.role} />
        <ActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    );
  }
  ```

---

## 9. Exercises

1. **JSX rules** — Convert this invalid JSX to valid JSX, explaining each fix:
   ```jsx
   <div class="box">
     <label for="name">Name</label>
     <input type="text" id="name">
     <p>Hello <script>alert('hi')</script></p>
   </div>
   ```

2. **Props** — Build a `ProductCard` component that accepts `name`, `price`,
   `image`, `rating`, and an optional `discount` (default 0). Display the discounted
   price when discount > 0.

3. **children prop** — Build a `Section` component that accepts a `title` prop and
   renders any children inside a styled `<section>` element with the title as a `<h2>`.

4. **List rendering** — Given an array of GitHub repos with `{ id, name, stars, url }`,
   render a list of cards. Sort them by stars descending before rendering.

5. **Conditional rendering** — Build a `WeatherCard` component that:
   - Shows a spinner if `isLoading` is true
   - Shows an error message if `error` is present
   - Shows a temperature and condition if data is available

---

## 10. Milestone Project

### Profile Card Builder

Build a React app (using Vite: `npm create vite@latest . -- --template react`) with:

1. A `ProfileCard` component that accepts: `name`, `title`, `bio`, `avatar`,
   `skills[]`, `social = { github, linkedin, twitter }`.
2. Skills rendered as a list of styled badges.
3. Social links only shown when their URL is provided (conditional rendering).
4. A `ProfileGrid` component that renders a list of 3+ profiles using `.map()`.
5. A `Badge` component used inside skills — demonstrate component reuse.

Design it to look like a real developer portfolio card.

---

## 11. Sources

| Resource | What to Search |
|----------|---------------|
| react.dev | `"Your First Component"`, `"Passing Props to a Component"`, `"Conditional Rendering"`, `"Rendering Lists"` |
| MDN | `"JSX"` |
| YouTube | `"The Beginner's Guide to React — Kent C. Dodds"`, `"React in 100 Seconds — Fireship"` |