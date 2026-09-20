---
name: GitHub empty repository initialization
description: Git Data API blob uploads need an initial commit when the target GitHub repository has no commits.
---

For a completely empty GitHub repository, create one initial file through the Contents API first. After that, Git Data API blobs, trees, commits, and branch refs work normally.

**Why:** GitHub returns `409 Git Repository is empty` for blob creation before the repository has an initial commit, even when the connection has write permissions.

**How to apply:** Seed the repository once, fetch the initial branch ref, build the complete tree, create a commit with the existing commit as parent, and update the target branch.