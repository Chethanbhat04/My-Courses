# Week 3 — State, Events & Controlled Components

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand how React's re-render model works,
> how to manage component state, handle user events, lift state between components,
> and build fully controlled forms — the pillars of every interactive React app.**

---

## Table of Contents

1. [Why State Exists — The Problem with Variables](#1-why-state-exists--the-problem-with-variables)
2. [useState — The Full Truth](#2-usestate--the-full-truth)
3. [Event Handling in React](#3-event-handling-in-react)
4. [Updating Objects and Arrays in State](#4-updating-objects-and-arrays-in-state)
5. [Lifting State Up](#5-lifting-state-up)
6. [Controlled Components & Forms](#6-controlled-components--forms)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. Why State Exists — The Problem with Variables

- **Regular JavaScript variables reset to their initial value on every re-render** —
  React calls your component function fresh every time it needs to update the UI.
  Any local `let` or `const` variable starts over from scratch. It cannot remember
  what the user did.

  ```jsx
  // ❌ This does NOT work — count resets to 0 on every render
  function BrokenCounter() {
    let count = 0; // re-created as 0 every time this function runs

    function handleClick() {
      count++; // increments the local variable...
      // ...but React never knows to re-render, and even if it did,
      // count would reset to 0 anyway
    }

    return <button onClick={handleClick}>Count: {count}</button>;
  }
  ```

  Two problems: (1) React does not know to re-render when `count++` happens.
  (2) Even if it did, `count` would reset to `0`. State solves both.

- **React state survives re-renders AND triggers a re-render when changed** —
  State is stored outside the component function, managed by React itself. Every
  time you call the setter, React re-runs the component function with the new state
  value and updates the DOM.

  ```jsx
  // ✅ This works — count persists and UI updates
  import { useState } from 'react';

  function Counter() {
    const [count, setCount] = useState(0); // React holds count somewhere safe

    return (
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    );
  }
  ```

---

## 2. useState — The Full Truth

- **`useState(initialValue)` returns a two-item array: `[currentValue, setter]`** —
  The initial value is ONLY used on the very first render. On every subsequent render,
  React ignores the argument and returns the current state value.

  ```jsx
  const [name, setName] = useState("Chethan");
  // React essentially does:
  // First render:  name = "Chethan"
  // After setName("Ravi"): name = "Ravi" (initial "Chethan" is gone)
  ```

- **Calling the setter replaces the state value — it does NOT merge** — This is
  different from `this.setState` in class components (which merged). The setter
  completely replaces the previous value with the new one.

  ```jsx
  const [user, setUser] = useState({ name: "Chethan", age: 22 });

  // ❌ Wrong — completely replaces the object, age is lost
  setUser({ name: "Ravi" }); // user is now { name: "Ravi" } — age gone!

  // ✅ Correct — spread old state, override only what changed
  setUser({ ...user, name: "Ravi" }); // { name: "Ravi", age: 22 }
  ```

- **Never mutate state directly — always use the setter** — If you mutate the
  state object directly (e.g., `user.name = "Ravi"`), React does not know anything
  changed and will not re-render. State must be treated as immutable.

  ```jsx
  // ❌ Direct mutation — React does NOT see this change
  user.name = "Ravi"; // just changes the JS variable, not React state

  // ✅ Correct — creates new object, triggers re-render
  setUser({ ...user, name: "Ravi" });
  ```

- **Use the functional updater form when new state depends on old state** —
  If you call `setCount(count + 1)` multiple times in the same event handler,
  React may batch them and use the same stale `count` value for all. The
  functional form `prev => prev + 1` always receives the most recent value.

  ```jsx
  // ❌ Problematic — both calls may read the same stale count
  function handleTripleClick() {
    setCount(count + 1); // count = 0, sets to 1
    setCount(count + 1); // count is STILL 0 (stale), sets to 1 again!
    setCount(count + 1); // still 0 → sets to 1. Result: 1, not 3
  }

  // ✅ Correct — functional updater always gets fresh value
  function handleTripleClick() {
    setCount(prev => prev + 1); // 0 → 1
    setCount(prev => prev + 1); // 1 → 2
    setCount(prev => prev + 1); // 2 → 3. Result: 3 ✅
  }
  ```

- **State updates are asynchronous — the new value is not available immediately** —
  After you call `setCount(5)`, reading `count` in the next line still gives the
  old value. The new value is available on the NEXT render.

  ```jsx
  function handleClick() {
    setCount(count + 1);
    console.log(count); // still the OLD value — logs 0, not 1
    // The component will re-render soon, and count will be 1 then
  }
  ```

- **Each component instance has its own independent state** — Two `<Counter />`
  components on the same page each have their own `count`. They do not share state.

  ```jsx
  <Counter />  // count = 3 (user clicked 3 times on this one)
  <Counter />  // count = 0 (this one was never clicked)
  ```

---

## 3. Event Handling in React

- **React event handlers are camelCase and take a function reference, not a
  function call** — Pass the function itself, not its return value.

  ```jsx
  // ❌ Wrong — calls handleClick immediately during render, passes its return value
  <button onClick={handleClick()}>Click</button>

  // ✅ Correct — passes the function reference; React calls it on click
  <button onClick={handleClick}>Click</button>

  // ✅ Also correct — inline arrow function (useful for passing arguments)
  <button onClick={() => handleDelete(item.id)}>Delete</button>
  ```

- **React wraps native DOM events in a SyntheticEvent** — This is a cross-browser
  wrapper around the native event. It has the same API as native events (`target`,
  `preventDefault()`, `stopPropagation()`), but works identically in every browser.

  ```jsx
  function SearchBar() {
    function handleSubmit(event) {
      event.preventDefault(); // prevent page reload on form submit
      const query = event.target.querySelector("input").value;
      console.log("Searching for:", query);
    }

    return (
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Search..." />
        <button type="submit">Search</button>
      </form>
    );
  }
  ```

- **Common event types in React** — The most frequently used events.

  ```jsx
  <button onClick={fn}>          {/* mouse click */}
  <input onChange={fn} />        {/* input value changes */}
  <form onSubmit={fn}>           {/* form submitted */}
  <input onFocus={fn} />         {/* element gains focus */}
  <input onBlur={fn} />          {/* element loses focus */}
  <div onKeyDown={fn}>           {/* key pressed while element focused */}
  <div onMouseEnter={fn}>        {/* mouse enters element area */}
  ```

---

## 4. Updating Objects and Arrays in State

React state must be treated as immutable. Always create new values — never modify existing ones.

### Updating Object State

- **To update a field in an object state, spread the old state and override the
  changed field** — This creates a completely new object, which tells React that
  state changed and a re-render is needed.

  ```jsx
  const [form, setForm] = useState({ name: "", email: "", age: 0 });

  // Update one field at a time:
  function handleNameChange(e) {
    setForm({ ...form, name: e.target.value });
    // { name: "Chethan", email: "", age: 0 }
  }

  // Or use a single generic handler:
  function handleChange(e) {
    const { name, value } = e.target; // destructure name attribute and value
    setForm(prev => ({ ...prev, [name]: value })); // computed property name
  }

  // Input uses the name attribute to match state field:
  <input name="name"  value={form.name}  onChange={handleChange} />
  <input name="email" value={form.email} onChange={handleChange} />
  ```

### Updating Array State

- **To add an item to an array in state, spread the old array into a new array** —
  Never use `.push()` on state — it mutates the array.

  ```jsx
  const [tasks, setTasks] = useState([]);

  // ❌ Wrong — mutates state directly
  function addTask(text) {
    tasks.push({ id: Date.now(), text }); // React does not see this change
    setTasks(tasks); // same array reference → React thinks nothing changed!
  }

  // ✅ Correct — creates a new array
  function addTask(text) {
    setTasks([...tasks, { id: Date.now(), text }]);
  }
  ```

- **To remove an item, use `.filter()` to create a new array without that item** —
  Never use `.splice()` on state.

  ```jsx
  function removeTask(id) {
    setTasks(tasks.filter(task => task.id !== id)); // new array, original untouched
  }
  ```

- **To update an item in an array, use `.map()` to produce a new array** — Change
  only the matching item; return all others as-is.

  ```jsx
  function toggleTask(id) {
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, done: !task.done } // new object for the changed task
        : task                           // return unchanged tasks as-is
    ));
  }
  ```

---

## 5. Lifting State Up

- **When two sibling components need to share the same state, move the state to
  their closest common parent** — The parent owns the state and passes it down as
  props. Children receive both the data and a function to update it.

  ```jsx
  // ❌ Problem: two siblings can't access each other's state
  function TemperatureInput() {
    const [temp, setTemp] = useState(0); // isolated inside this component
  }

  function TemperatureDisplay() {
    // Can't read TemperatureInput's temp from here!
  }
  ```

  ```jsx
  // ✅ Solution: lift state to the parent
  function TemperatureConverter() {
    const [celsius, setCelsius] = useState(0); // state lives in parent

    const fahrenheit = (celsius * 9) / 5 + 32;

    return (
      <div>
        {/* Pass value and setter down as props */}
        <TemperatureInput
          label="Celsius"
          value={celsius}
          onChange={setCelsius}
        />
        {/* Display receives derived data */}
        <TemperatureDisplay fahrenheit={fahrenheit} />
      </div>
    );
  }

  function TemperatureInput({ label, value, onChange }) {
    return (
      <label>
        {label}: <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
      </label>
    );
  }

  function TemperatureDisplay({ fahrenheit }) {
    return <p>In Fahrenheit: {fahrenheit.toFixed(1)}°F</p>;
  }
  ```

  This pattern is the foundation of React's data flow. Master it — it appears in
  every non-trivial React app.

---

## 6. Controlled Components & Forms

- **A controlled component is an input whose value is driven entirely by React state** —
  React is the "single source of truth" for the input value. The DOM does not own
  the value; React does. This is the standard way to handle forms in React.

  ```jsx
  function LoginForm() {
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState(null);

    function handleSubmit(e) {
      e.preventDefault();
      if (!email.includes("@")) {
        setError("Please enter a valid email.");
        return;
      }
      setError(null);
      // submit to server...
      console.log("Logging in:", { email, password });
    }

    return (
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}            // value driven by state
            onChange={e => setEmail(e.target.value)} // state updates on change
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Log In</button>
      </form>
    );
  }
  ```

- **An uncontrolled component lets the DOM manage the input value** — You read
  the value with a `ref` when you need it (e.g., on submit). Simpler but harder
  to validate and less idiomatic in React.

  ```jsx
  // Uncontrolled — using ref
  function SimpleForm() {
    const inputRef = useRef(null);
    function handleSubmit(e) {
      e.preventDefault();
      console.log(inputRef.current.value); // read DOM value on demand
    }
    return (
      <form onSubmit={handleSubmit}>
        <input ref={inputRef} type="text" defaultValue="initial" />
        <button type="submit">Submit</button>
      </form>
    );
  }
  ```

  Use controlled components (with `value` + `onChange`) for: validation, dynamic
  forms, conditionally disabling the submit button, and anything that needs to
  read the value in real time. Uncontrolled inputs are fine for simple, non-critical
  inputs where you only need the value at submission time.

- **Select and checkbox inputs follow the same controlled pattern** — Use `value`
  for `<select>` and `checked` for checkboxes.

  ```jsx
  function SettingsForm() {
    const [theme, setTheme]       = useState("dark");
    const [newsletter, setNewsletter] = useState(false);

    return (
      <form>
        {/* Controlled select */}
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>

        {/* Controlled checkbox */}
        <label>
          <input
            type="checkbox"
            checked={newsletter}
            onChange={e => setNewsletter(e.target.checked)} // .checked not .value
          />
          Subscribe to newsletter
        </label>
      </form>
    );
  }
  ```

---

## 7. Exercises

1. **State basics** — Build a `LikeButton` that starts at 0, increments by 1 each
   click, and changes its emoji from 🤍 to ❤️ when count > 0.

2. **Functional updater** — Build a `BankAccount` component with a balance that
   supports Deposit (+100) and Withdraw (-100). Ensure double-clicking deposit
   gives exactly +200 (not +100 due to stale state).

3. **Array state** — Build a `ShoppingCart` with:
   - An input + button to add items by name
   - A delete button next to each item
   - A total count shown in the header

4. **Lifting state** — Build a controlled tab system: a parent `Tabs` component
   holds the active tab index in state and passes it to `TabList` (renders buttons)
   and `TabPanel` (renders active content). Neither child holds state.

5. **Controlled form** — Build a registration form with: name, email, password,
   confirm password, age. Validate:
   - Email must contain @
   - Password must be >= 8 characters
   - Confirm password must match
   - Age must be >= 18
   Show field-level error messages. Disable submit until all valid.

---

## 8. Milestone Project

### Interactive Todo App

Build a full Todo application with:

1. **Add todos** — Controlled text input + "Add" button. Clear input after adding.
2. **Display todos** — List of todos with index-based numbering. Show total count.
3. **Toggle completion** — Checkbox per todo; completed todos are struck through.
4. **Delete todos** — Remove button per todo.
5. **Filter todos** — "All", "Active", "Completed" filter buttons (lift filter state up).
6. **Clear completed** — Button to remove all completed todos at once.
7. **Empty state** — Friendly message when no todos match the current filter.

Apply proper React patterns: small components, lifted state, immutable updates, controlled inputs.

---

## 9. Sources

| Resource | What to Search |
|----------|---------------|
| react.dev | `"State: A Component's Memory"`, `"Render and Commit"`, `"State as a Snapshot"`, `"Updating Objects in State"`, `"Updating Arrays in State"`, `"Sharing State Between Components"` |
| YouTube | `"Web Dev Simplified — useState Hook"`, `"Jack Herrington — Why React State is Confusing"` |