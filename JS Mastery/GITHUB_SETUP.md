#  Pushing JS Mastery to GitHub — Complete Guide

This document records the complete process used to upload the **JS Mastery** project to GitHub.

---

## [list] Prerequisites

Before starting, make sure you have:
- [x] A [GitHub account](https://github.com)
- [x] [Git](https://git-scm.com/downloads) installed on your machine
- [x] A GitHub **Personal Access Token (PAT)** — needed instead of a password

### How to Create a Personal Access Token (PAT)
1. Go to **GitHub → Settings**
2. Scroll down to **Developer Settings**
3. Click **Personal Access Tokens → Tokens (classic)**
4. Click **Generate new token (classic)**
5. Give it a name, set expiration, and check the **`repo`** scope
6. Click **Generate token** — copy and save it somewhere safe!

---

## ️ Step-by-Step Process

### Step 1 — Create a New GitHub Repository

1. Go to -> [https://github.com/new](https://github.com/new)
2. Set the **Repository name** (e.g., `JS-Mastery`)
3. Choose **Public** or **Private**
4. ❌ Do **NOT** check "Add a README file"
5. ❌ Do **NOT** check "Add .gitignore" or "Choose a license"
6. Click **Create repository**

---

### Step 2 — Open Terminal and Navigate to Your Project

```powershell
cd "c:\Chethan\MyFolder\JS Mastery"
```

---

### Step 3 — Set Your Git Identity (Name & Email)

> ⚠️ This is required before making any commit. Use the same email linked to your GitHub account.

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

**Verify it was set correctly:**
```powershell
git config --global user.name
git config --global user.email
```

---

### Step 4 — Initialize Git

```powershell
git init
```

This creates a hidden `.git` folder, turning your folder into a Git repository.

---

### Step 5 — Stage All Files

```powershell
git add .
```

Stages all project files for the first commit.

---

### Step 6 — Make the First Commit

```powershell
git commit -m "Initial commit - JS Mastery project"
```

> ⚠️ You **must** commit before pushing — the `main` branch doesn't exist until you do!

---

### Step 7 — Rename Branch to `main`

```powershell
git branch -M main
```

---

### Step 8 — Generate a Personal Access Token (PAT)

GitHub no longer accepts passwords — you need a **PAT** to authenticate.

1. Go to -> [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Fill in:
   - **Note**: Give it a name (e.g., `JS-Mastery push`)
   - **Expiration**: 90 days or No expiration
   - **Scopes**: ✅ Check **`repo`**
3. Click **Generate token**
4. **Copy the token immediately** — you won't see it again!

---

### Step 9 — Connect to GitHub with Your Token

```powershell
git remote add origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/JS-Mastery.git
```

**Example:**
```powershell
git remote add origin https://Chethanbhat04:ghp_yourTokenHere@github.com/Chethanbhat04/JS-Mastery.git
```

> If you already added the remote without a token, update it with:
> ```powershell
> git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/JS-Mastery.git
> ```

---

### Step 10 — Push Code to GitHub

```powershell
git push -u origin main
```

You should see output like:
```
Writing objects: 100% ...
To https://github.com/YOUR_USERNAME/JS-Mastery.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

---

## ✅ Verification

Visit your repository at:
```
https://github.com/YOUR_USERNAME/JS-Mastery
```

You should see all your files uploaded! 

---

##  Future Updates (How to Push Changes)

Whenever you make changes to your project:

```powershell
git add .
git commit -m "Describe what you changed"
git push
```

---

##  Branching

Branches let you work on features/fixes without affecting the main code.

### Create a New Branch
```powershell
git branch feature/my-feature
```

### Switch to a Branch
```powershell
git checkout feature/my-feature
```

### Create and Switch in One Command
```powershell
git checkout -b feature/my-feature
```

### List All Branches
```powershell
git branch        # local branches
git branch -a     # local + remote branches
```

### Push a New Branch to GitHub
```powershell
git push -u origin feature/my-feature
```

### Delete a Branch (after merging)
```powershell
git branch -d feature/my-feature          # delete locally
git push origin --delete feature/my-feature  # delete on GitHub
```

---

##  Merging

Merging combines changes from one branch into another.

### Step 1 — Switch to the branch you want to merge INTO
```powershell
git checkout main
```

### Step 2 — Merge the feature branch
```powershell
git merge feature/my-feature
```

### Step 3 — Push the merged result
```powershell
git push
```

### ⚠️ Merge Conflicts
If Git shows a conflict, open the file and look for:
```
<<<<<<< HEAD
your changes
=======
incoming changes
>>>>>>> feature/my-feature
```
Edit the file to keep what you want, then:
```powershell
git add .
git commit -m "Resolved merge conflict"
```

---

##  Pull Requests (PR)

Pull Requests are how you merge branches on GitHub with review.

1. Push your feature branch to GitHub
2. Go to your repo on GitHub
3. Click **"Compare & pull request"** (yellow banner)
4. Add a **title** and **description**
5. Click **"Create pull request"**
6. Review changes → Click **"Merge pull request"**
7. Click **"Confirm merge"**

> Note: PRs are the **recommended way** to merge in team projects.

---

##  Pulling Changes

Pull downloads the latest changes from GitHub to your local machine.

### Pull latest changes
```powershell
git pull
```

### Pull from a specific branch
```powershell
git pull origin main
```

---

##  Stashing (Save Work Temporarily)

Stash lets you save unfinished work without committing.

### Save current changes to stash
```powershell
git stash
```

### View all stashes
```powershell
git stash list
```

### Restore the latest stash
```powershell
git stash pop
```

### Discard the latest stash
```powershell
git stash drop
```

---

## ↩️ Undoing Changes

### Undo changes in a file (before staging)
```powershell
git checkout -- filename.js
```

### Unstage a file (after `git add`)
```powershell
git restore --staged filename.js
```

### Undo last commit (keep changes)
```powershell
git reset --soft HEAD~1
```

### Undo last commit (discard changes ⚠️ permanent)
```powershell
git reset --hard HEAD~1
```

---

## [list] Useful Status & Log Commands

| Command | What it does |
|---------|-------------|
| `git status` | Shows staged/unstaged/untracked files |
| `git log` | Shows commit history |
| `git log --oneline` | Compact commit history |
| `git diff` | Shows unstaged changes |
| `git diff --staged` | Shows staged changes |
| `git branch` | Lists all local branches |
| `git remote -v` | Shows remote connections |

---

## ️ Using VS Code Source Control UI

You can do all Git actions without terminal using VS Code's built-in Source Control panel.

### Open Source Control
```
Ctrl + Shift + G
```

| Action | How to do it in UI |
|--------|--------------------|
| Stage all files | Click `+` next to "Changes" |
| Stage one file | Click `+` next to that file |
| Commit | Type message in box → click ✓ |
| Push | `...` menu → Push |
| Pull | `...` menu → Pull |
| Create branch | Click branch name (bottom-left) → "Create new branch" |
| Switch branch | Click branch name (bottom-left) → select branch |
| View file diff | Click any changed file in Source Control |
| Merge branch | `...` menu → Branch → Merge Branch |
| Stash | `...` menu → Stash → Stash All Changes |

---

##  Troubleshooting

| Problem | Solution |
|--------|----------|
| `git` is not recognized | Install Git from [git-scm.com](https://git-scm.com/downloads) and restart terminal |
| `src refspec main does not match` | You haven't committed yet — run `git add .` then `git commit -m "message"` |
| `remote: Repository not found` | The GitHub repo doesn't exist yet — create it at [github.com/new](https://github.com/new) |
| `remote origin already exists` | Use `git remote set-url origin <url>` instead of `git remote add origin <url>` |
| Authentication failed | Use a Personal Access Token (PAT) in the URL instead of your password |

---

*Documented on: 2026-07-21 | Repository: [github.com/Chethanbhat04/JS-Mastery](https://github.com/Chethanbhat04/JS-Mastery)*
