# How This Repository Was Created — Step-by-Step Process

This document explains the exact steps taken to create the `My-Courses` GitHub repository and restructure the course folders into a single monorepo.

---

## Background

Previously, the `JS Mastery` course was a standalone GitHub repository at:
`https://github.com/Chethanbhat04/JS-Mastery`

The goal was to:
- Detach `JS Mastery` from its old repo
- Create a new unified repo called `My-Courses`
- Include `JS Mastery` and `React Mastery` as subfolders
- Allow future courses to be added easily

---

## Step 1 — Create the My-Courses Folder Locally

A new parent folder was created at:

```
C:\Chethan\MyFolder\My-Courses\
```

**Command used:**
```powershell
New-Item -ItemType Directory -Path "C:\Chethan\MyFolder\My-Courses" -Force
```

---

## Step 2 — Move Course Folders Into My-Courses

Both course folders were moved manually using File Explorer:

- `C:\Chethan\MyFolder\JS Mastery` ? `C:\Chethan\MyFolder\My-Courses\JS Mastery`
- `C:\Chethan\MyFolder\React Mastery` ? `C:\Chethan\MyFolder\My-Courses\React Mastery`

**Final structure:**
```
My-Courses/
+-- JS Mastery/
+-- React Mastery/
```

---

## Step 3 — Remove Old Git History from JS Mastery

Since `JS Mastery` had its own `.git` folder linked to the old `JS-Mastery` repo,
that git history was deleted so it could become part of the new unified repo.

**Command used:**
```powershell
Remove-Item -Recurse -Force "C:\Chethan\MyFolder\My-Courses\JS Mastery\.git"
```

---

## Step 4 — Initialize a New Git Repository

A brand new git repository was initialized at the `My-Courses` root level (not inside any subfolder).

**Command used:**
```bash
git init "C:\Chethan\MyFolder\My-Courses"
```

**Output:**
```
Initialized empty Git repository in C:/Chethan/MyFolder/My-Courses/.git/
```

---

## Step 5 — Create README.md

A root-level `README.md` was created to describe the repository and list all courses.

---

## Step 6 — Create the GitHub Repository

A new GitHub repository called `My-Courses` was created using the GitHub API.

**API call:**
```
POST https://api.github.com/user/repos
Body: { "name": "My-Courses", "description": "...", "private": false }
```

**Result:**
- Repository URL: https://github.com/Chethanbhat04/My-Courses

---

## Step 7 — Stage and Commit All Files

All course files were staged and committed with an initial commit message.

**Commands used:**
```bash
git add .
git commit -m "Initial commit: Add JS Mastery and React Mastery courses"
```

**Result:** 34 files committed across both courses.

---

## Step 8 — Add Remote and Push to GitHub

The local repo was linked to the GitHub remote and all files were pushed.

**Commands used:**
```bash
git remote add origin https://github.com/Chethanbhat04/My-Courses.git
git push -u origin master
```

**Output:**
```
* [new branch]      master -> master
branch 'master' set up to track 'origin/master'.
```

---

## Final Result

| Item | Detail |
|------|--------|
| Local path | `C:\Chethan\MyFolder\My-Courses\` |
| GitHub repo | https://github.com/Chethanbhat04/My-Courses |
| Branch | `master` |
| Courses included | JS Mastery, React Mastery |
| Total files pushed | 34 files |

---

## Adding Future Courses

To add a new course in the future:

1. Create a new folder inside `My-Courses\` (e.g., `Node Mastery\`)
2. Add your notes and files inside it
3. Run the following from the `My-Courses\` root:

```bash
git add .
git commit -m "Add Node Mastery course"
git push
```

That is all you need to keep the repo updated!
