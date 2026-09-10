# React App Setup & Commands Guide (Vite, NPM & Testing)

> A complete reference guide on how to create, run, manage, and test React applications for every week of the **React Mastery** course.

---

## Table of Contents

1. [Understanding React Creation Tools](#1-understanding-react-creation-tools)
2. [Prerequisites & System Setup](#2-prerequisites--system-setup)
3. [How to Create a React App with Vite (Recommended)](#3-how-to-create-a-react-app-with-vite-recommended)
4. [Project Structure Explained](#4-project-structure-explained)
5. [Essential NPM Commands Reference](#5-essential-npm-commands-reference)
6. [Weekly Testing & Setup Guide (Weeks 1–8)](#6-weekly-testing--setup-guide-weeks-18)
7. [Troubleshooting & Frequently Asked Questions](#7-troubleshooting--frequently-asked-questions)

---

## 1. Understanding React Creation Tools

Over the years, the way developers create React applications has evolved. Here is a breakdown of the 3 main tools you will hear about:

### 1. **Vite** (`npm create vite@latest`) — ⭐ *Recommended Standard*
* **What it is**: A modern, extremely fast frontend build tool created by Evan You (creator of Vue.js).
* **Why use it**: 
  * Instant server start (uses native ES modules).
  * Lightning-fast Hot Module Replacement (HMR) — changes update instantly without reloading the whole page.
  * Lightweight and simple configuration.
* **When to use**: Perfect for learning React, building Single Page Applications (SPAs), and all weekly exercises in this course.

### 2. **Next.js** (`npx create-next-app@latest`) — *Full-Stack Framework*
* **What it is**: The official React framework for production applications with built-in server-side rendering (SSR), API routes, and file-based routing.
* **When to use**: When building full-stack, SEO-heavy production websites (covered in Week 8 and Phase 3).

### 3. **Create React App (CRA)** (`npx create-react-app`) — ⚠️ *Deprecated / Legacy*
* **What it is**: The old official CLI tool created by Facebook in 2016.
* **Why to avoid it**: CRA is officially deprecated. It is slow to start, uses outdated Webpack configs, and has unmaintained dependencies. **Do not use CRA for new projects.**

---

## 2. Prerequisites & System Setup

Before creating any React app, ensure you have **Node.js** and **npm** installed on your machine.

### Check if installed:
Open your terminal (PowerShell, Command Prompt, or VS Code Terminal) and run:

```bash
node -v
npm -v
```

* **Node.js Version**: Should be `v18.0.0` or higher (Recommended: `v20.x` or `v22.x` LTS).
* If not installed, download the **LTS version** from [nodejs.org](https://nodejs.org/).

---

## 3. How to Create a React App with Vite (Recommended)

Follow these steps to create a new React application for your practice:

### Step 1: Open Terminal in your working directory
Navigate to where you want to store your practice project:
```bash
cd "C:\path\to\your\course\folder\React Mastery"
```

### Step 2: Run the Vite creation command
Run the non-interactive one-line command:

```bash
npm create vite@latest week2-practice -- --template react
```

*(If you prefer TypeScript, use `--template react-ts` instead).*

Alternatively, run interactive mode:
```bash
npm create vite@latest
```
Follow the prompts:
1. **Project name**: `week2-practice`
2. **Select a framework**: `React`
3. **Select a variant**: `JavaScript` (or `JavaScript + SWC`)

> 💡 **What is the difference between `JavaScript` and `JavaScript + SWC`?**
>
> When creating a React app with Vite, you will see variant choices. Here is what they mean:
> 
> * **`JavaScript` (Standard / Babel)**: Uses **Babel** (written in JS) to translate your JSX code into standard JavaScript. It is the traditional, tried-and-tested React compiler.
> * **`JavaScript + SWC` (Recommended)**: Uses **SWC** (*Speedy Web Compiler* written in **Rust**). It does the exact same job as Babel, but is **20x to 50x faster**.
> 
> **Which one should you pick?**
> For all course exercises, **either option works completely fine**, but picking **`JavaScript + SWC`** gives you faster compilation speed and instant hot-reloading!

### Step 3: Navigate into the project folder
```bash
cd week2-practice
```

### Step 4: Install dependencies
Vite creates project files without pre-downloading heavy `node_modules`. Run:
```bash
npm install
```

### Step 5: Start the local development server
```bash
npm run dev
```

You will see output similar to this:
```bash
  VITE v5.x.x  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + click to show help
```

Hold `Ctrl` and click the link `http://localhost:5173/` in your terminal to open your brand new React app in your browser!

---

## 4. Project Structure Explained

When you open `week2-practice` in VS Code, you'll see the following structure:

```text
week2-practice/
├── node_modules/       # Downloaded third-party packages (never edit)
├── public/             # Static assets (favicons, images) served directly
├── src/                # Your source code (Where 99% of your work happens)
│   ├── assets/         # Images, SVGs, global media
│   ├── App.css         # Component styling
│   ├── App.jsx         # Main Root Component
│   ├── index.css       # Global CSS styles
│   └── main.jsx        # Entry point: Mounts <App /> into index.html
├── .gitignore          # Tells git to ignore node_modules and build files
├── index.html          # Main HTML template containing <div id="root"></div>
├── package.json        # Project metadata, scripts, and list of dependencies
├── package-lock.json   # Lockfile ensuring exact dependency versions
└── vite.config.js      # Vite build configuration file
```

---

## 5. Essential NPM Commands Reference

Here is a quick lookup table of commands you will use daily:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | **Start Dev Server** | Runs local app with hot reload on `localhost:5173`. |
| `npm install` (or `npm i`) | **Install All Dependencies** | Reads `package.json` and installs `node_modules`. |
| `npm i <package>` | **Install Third-Party Package** | Installs a library (e.g. `npm i axios`). |
| `npm i -D <package>` | **Install Dev Dependency** | Installs tool needed only during build (e.g. `npm i -D tailwindcss`). |
| `npm uninstall <package>` | **Remove Package** | Deletes a library from `node_modules` and `package.json`. |
| `npm run build` | **Production Build** | Bundles JSX into optimized static HTML/JS/CSS inside `dist/`. |
| `npm run preview` | **Preview Build** | Tests the production build locally before deploying. |

---

## 6. Weekly Testing & Setup Guide (Weeks 1–8)

Use this guide to set up your practice workspace for each week of the course:

### 🟡 Week 1 — JS Foundations
* **Setup**: No React setup required! You can test pure JS functions using Node.js directly.
* **Commands**:
  ```bash
  # Create a practice file
  touch practice.js
  # Run it with Node
  node practice.js
  ```

---

### 🔵 Week 2 — JSX, Components & Props
* **Goal**: Test JSX syntax, custom components, and passing props.
* **Setup Commands**:
  ```bash
  npm create vite@latest week2-components -- --template react
  cd week2-components
  npm install
  npm run dev
  ```
* **What to edit**: 
  1. Open `src/App.jsx` and clear out starter code.
  2. Create component files inside `src/components/UserCard.jsx`.
  3. Import and test `<UserCard name="Alex" age={22} />` in `App.jsx`.

---

### 🟢 Week 3 — State, Events & Controlled Forms
* **Goal**: Practice `useState`, handling input changes, and lifting state up.
* **Setup Commands**:
  ```bash
  npm create vite@latest week3-state -- --template react
  cd week3-state
  npm install
  npm run dev
  ```
* **Testing Checklist**:
  * Create counter components, toggle buttons, and form inputs.
  * Verify state changes in real time in browser developer tools (React Developer Tools extension).

---

### 🔴 Week 4 — useEffect, Data Fetching & Side Effects
* **Goal**: Fetch API data from external endpoints (e.g., JSONPlaceholder or GitHub API).
* **Setup Commands**:
  ```bash
  npm create vite@latest week4-data-fetching -- --template react
  cd week4-data-fetching
  npm install
  # Optional: Install Axios HTTP client
  npm install axios
  npm run dev
  ```
* **Testing Practice**:
  * Practice `fetch()` inside `useEffect`.
  * Test cleanups (cancelling fetch with `AbortController`).

---

### 🟣 Week 5 — Advanced Hooks & Custom Hooks
* **Goal**: Practice `useRef`, `useReducer`, `useMemo`, `useCallback`, and custom hooks.
* **Setup Commands**:
  ```bash
  npm create vite@latest week5-custom-hooks -- --template react
  cd week5-custom-hooks
  npm install
  npm run dev
  ```

---

### 🟠 Week 6 — React Router & Navigation
* **Goal**: Multi-page client-side routing.
* **Setup Commands**:
  ```bash
  npm create vite@latest week6-router -- --template react
  cd week6-router
  npm install
  # Install React Router DOM package
  npm install react-router-dom
  npm run dev
  ```
* **Testing Practice**:
  * Wrap `<App />` with `<BrowserRouter>` in `src/main.jsx`.
  * Set up `<Routes>` and `<Route path="/about" element={<About />} />`.

---

### 🟤 Week 7 — Global State (Context API & Zustand)
* **Goal**: Manage global state without prop drilling.
* **Setup Commands**:
  ```bash
  npm create vite@latest week7-global-state -- --template react
  cd week7-global-state
  npm install
  # Install Zustand for lightweight global state
  npm install zustand
  npm run dev
  ```

---

### ⚪ Week 8 — Performance & Production Build
* **Goal**: Learn to optimize apps and build for deployment + Next.js introduction.
* **Production Build Test Commands**:
  ```bash
  # 1. Build optimized bundle
  npm run build

  # 2. Preview the production output locally
  npm run preview
  ```
* **Next.js Creation Command (Preview for Phase 3)**:
  ```bash
  npx create-next-app@latest my-next-app
  ```

---

## 7. Troubleshooting & Frequently Asked Questions

### Q1: "Port 5173 is already in use!"
**Cause**: Another Vite development server is running in another terminal window.
**Fix**: Press `Ctrl + C` in the other terminal to terminate it, or let Vite automatically switch to `http://localhost:5174/`.

### Q2: "Cannot find module 'react' or 'vite'"
**Cause**: You forgot to run `npm install` after creating the project or cloning a repository.
**Fix**: `cd` into the project folder containing `package.json` and run `npm install`.

### Q3: "Changes in code are not updating in the browser!"
**Fix**: 
1. Make sure `npm run dev` is running in your terminal.
2. Check your browser console (`F12` -> Console) for JavaScript errors that might prevent re-rendering.
3. Save the file (`Ctrl + S` in VS Code).

### Q4: "Do I need to create a new Vite app every single week?"
**Recommendation**: 
* You can create a single master practice app called `react-practice-hub` and create different components/pages for each week, **OR**
* Create small standalone apps (e.g. `week2-practice`, `week3-practice`) so each week's code stays isolated and clean.
