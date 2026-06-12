---
title: Git Commands
sidebar_position: 1
---

# Git Commands

## Daily Workflow

```bash
git status
git switch main
git pull --ff-only
git switch -c feature/order-timeline
git add order-service docs
git commit -m "Add order timeline"
git push -u origin feature/order-timeline
```

`--ff-only` refuses an implicit merge during pull. Resolve divergence
deliberately with rebase or merge according to the team's policy.

## Fetch, Pull, Merge, And Rebase

These commands solve related but different problems:

| Command | What it does | Changes current branch? | Rewrites commits? |
|---|---|---:|---:|
| `git fetch` | Downloads remote branches, tags, and commit metadata | No | No |
| `git pull` | Fetches and then integrates the tracked remote branch | Yes | Depends on pull strategy |
| `git merge` | Combines another branch into the current branch | Yes | No |
| `git rebase` | Replays current branch commits on a new base | Yes | Yes |

### Git Fetch

`fetch` updates remote-tracking references such as `origin/main` without
changing local files or the current branch:

```bash
git fetch origin
git log --oneline --graph HEAD..origin/main
git diff main..origin/main
```

Use it when you want to inspect remote changes before integrating them. It is
the safest first step because it does not modify the working tree.

```text
Before fetch:

main:        A---B
origin/main: A---B
remote:      A---B---C

After fetch:

main:        A---B
origin/main: A---B---C
```

### Git Pull

`pull` is a convenience command:

```text
git pull = git fetch + integration
```

The integration can use merge, rebase, or fast-forward-only behavior:

```bash
# Fetch and merge
git pull --no-rebase

# Fetch and rebase local commits
git pull --rebase

# Update only when no merge or rebase is required
git pull --ff-only
```

Prefer an explicit strategy rather than relying on an unknown machine-level
default:

```bash
git config --global pull.ff only
```

`--ff-only` works well for `main` because it prevents an accidental merge
commit. On a feature branch with local commits, fetch first and then choose
merge or rebase deliberately.

### Git Merge

Merge combines histories and preserves existing commit IDs:

```bash
git switch feature/order-timeline
git fetch origin
git merge origin/main
```

When both branches contain unique commits, Git normally creates a merge commit:

```text
          C---D  feature
         /     \
A---B---E-------M
        main
```

Advantages:

- preserves the exact history and original commit identities;
- safe for branches already shared with other developers;
- makes the integration point visible.

Trade-offs:

- frequent merges can make history harder to read;
- a merge commit can include conflict resolution that needs careful review.

### Git Rebase

Rebase moves a line of commits by replaying them on another base:

```bash
git switch feature/order-timeline
git fetch origin
git rebase origin/main
```

```text
Before:

      C---D  feature
     /
A---B---E---F  origin/main

After:

A---B---E---F---C'---D'  feature
```

`C'` and `D'` contain equivalent changes but have new commit IDs. Rebase gives
a linear history, but rewriting shared commits can disrupt collaborators.

Use rebase for local, unpublished feature-branch commits. Do not rebase a
shared branch unless everyone using it has coordinated the rewrite.

### Merge Versus Rebase

| Consideration | Merge | Rebase |
|---|---|---|
| History | Preserves branch topology | Produces a linear history |
| Commit IDs | Remain unchanged | Rewritten for replayed commits |
| Shared branches | Generally safe | Risky without coordination |
| Conflict handling | Usually resolved once in merge commit | May require resolution for multiple replayed commits |
| Typical use | Integrating shared or completed work | Updating private feature work before review |

A practical team policy is:

1. protect `main` and update it with pull requests;
2. use `git pull --ff-only` on `main`;
3. rebase private feature branches onto the latest `origin/main`;
4. merge or squash through the pull-request platform;
5. never rewrite protected or widely shared branch history.

## Fast-Forward And Three-Way Merge

A fast-forward occurs when the current branch has no unique commits:

```text
Before:

A---B          main
     \
      C---D    feature

After merge:

A---B---C---D  main, feature
```

Git only moves the branch pointer; no merge commit is required.

A three-way merge is required when both branches have diverged. Git compares
the two branch tips and their common ancestor, then creates a merge result.

Useful options:

```bash
git merge --ff-only feature/order-timeline
git merge --no-ff feature/order-timeline
git merge --abort
```

`--no-ff` deliberately records a merge commit even when fast-forwarding is
possible. This can preserve the identity of a completed feature, although many
teams instead use squash merging for a concise `main` history.

## Resolve Conflicts

When Git reports conflicts:

```bash
git status
git diff --name-only --diff-filter=U
```

Open each conflicted file and resolve markers:

```text
<<<<<<< HEAD
current branch content
=======
incoming branch content
>>>>>>> origin/main
```

Then continue or abort:

```bash
# During merge
git add <resolved-files>
git commit

# During rebase
git add <resolved-files>
git rebase --continue

# Cancel the operation
git merge --abort
git rebase --abort
```

Do not resolve conflicts by blindly choosing "ours" or "theirs." Understand
both changes, run relevant tests, and inspect the final diff.

## Inspect Changes

```bash
git diff
git diff --staged
git diff main...feature/order-timeline
git log --oneline --decorate --graph -20
git show <commit>
git blame <file>
```

The two-dot and three-dot diff forms answer different questions:

```bash
# Difference between the two branch tips
git diff main..feature/order-timeline

# Changes introduced on the feature branch since its common ancestor with main
git diff main...feature/order-timeline
```

## Branches

```bash
git branch
git branch -r
git switch <branch>
git switch -c <new-branch>
git branch -d <merged-branch>
```

## Restore Carefully

```bash
git restore <file>
git restore --staged <file>
```

These commands can discard work. Always inspect `git diff` first. Avoid
`git reset --hard` in a shared or dirty workspace.

## Rebase

```bash
git fetch origin
git rebase origin/main
```

Rebase rewrites commit IDs. Do not rebase commits already consumed by other
developers unless the team explicitly agrees.

Interactive rebase can clean local commits before review:

```bash
git rebase -i HEAD~4
```

Common actions are `pick`, `reword`, `squash`, `fixup`, and `drop`. Only use
interactive rebase on commits that are safe to rewrite.

If a rebased branch was already pushed and rewriting it is intentional:

```bash
git push --force-with-lease
```

Prefer `--force-with-lease` over `--force`. It refuses the update when the
remote branch contains work that was not present in the expected local
remote-tracking reference.

## Tags

```bash
git tag -a v1.0.0 -m "Shopverse v1.0.0"
git push origin v1.0.0
```

## GitHub CLI

```bash
gh auth status
gh pr create --fill
gh pr checks
gh pr view --web
gh run list
gh run view <run-id> --log-failed
```

## Commit Practices

- keep one coherent purpose per commit;
- do not commit `.env`, private keys, tokens, or generated build output;
- include migrations and code that depends on them together;
- update tests and documentation with behavior changes;
- prefer messages that describe the outcome, not the editing action.

## Important Git Interview Questions

### What is the difference between Git and GitHub?

Git is a distributed version-control system that stores repository history
locally. GitHub is a hosted collaboration platform built around Git, adding
pull requests, issue tracking, reviews, automation, and repository hosting.

### What is the difference between `git fetch` and `git pull`?

`git fetch` downloads remote information without changing the current branch.
`git pull` fetches and immediately integrates the tracked remote branch using
merge, rebase, or fast-forward behavior.

### What is the difference between merge and rebase?

Merge combines histories without rewriting existing commits and may create a
merge commit. Rebase replays commits on a new base, creating new commit IDs and
a linear history. Merge is safer for shared history; rebase is useful for
private feature work.

### What is `HEAD`?

`HEAD` identifies the currently checked-out commit, normally indirectly
through the current branch reference. In a detached `HEAD` state, it points
directly to a commit rather than a branch.

### What is a detached `HEAD`?

It occurs when a commit or tag is checked out directly:

```bash
git switch --detach <commit>
```

New commits are not attached to a named branch and can become difficult to
find. Preserve them by creating a branch:

```bash
git switch -c recovery/my-work
```

### What is the staging area?

The staging area, or index, is the proposed content for the next commit.
`git add` copies selected changes into it, allowing one working-tree change set
to be divided into multiple focused commits.

### What is the difference between `reset`, `restore`, and `revert`?

| Command | Primary purpose | Shared-history safety |
|---|---|---|
| `git restore` | Restore working-tree or staged file content | Safe when used carefully before committing |
| `git reset` | Move a branch or adjust index/working tree | Can rewrite history; dangerous after sharing |
| `git revert` | Create a new commit that reverses an older commit | Preferred for shared history |

Use `git revert <commit>` to undo a commit already merged into a shared branch.

### What is the difference between `git reset --soft`, `--mixed`, and `--hard`?

- `--soft` moves `HEAD` but keeps changes staged.
- `--mixed` moves `HEAD` and unstages changes while keeping working files.
- `--hard` moves `HEAD` and discards tracked working-tree changes.

`--hard` is destructive and should not be used without first checking what
would be lost.

### What is `cherry-pick`?

`git cherry-pick <commit>` applies the change introduced by a specific commit
onto the current branch, creating a new commit ID. It is useful for targeted
backports and hotfixes, but routine cherry-picking between long-lived branches
can create duplicate history and future conflicts.

### What is the difference between squash merge and rebase?

A squash merge combines all feature changes into one new commit on the target
branch. Rebase preserves each feature commit but rewrites it onto a new base.
Squashing gives a concise target history; rebasing retains individual commit
structure.

### Why use `--force-with-lease` instead of `--force`?

`--force-with-lease` checks that the remote branch still matches the expected
state before replacing it. It protects changes pushed by another developer
since the last fetch. Plain `--force` can overwrite those changes silently.

### How does Git identify a commit?

A commit is a content-addressed object containing a tree reference, parent
commit references, author and committer metadata, and the message. Its hash
changes when any of that commit data changes, which is why rebasing creates
new commit IDs.

### What is a merge conflict?

A conflict occurs when Git cannot safely combine changes automatically, such
as overlapping edits or delete-versus-modify changes. The developer must
choose the correct combined result, stage it, and continue the merge or rebase.

### How can a deleted branch or commit be recovered?

Use the reflog to locate a recently reachable commit:

```bash
git reflog
git switch -c recovery/my-branch <commit>
```

The reflog is local and retention-limited, so it is a recovery mechanism rather
than a backup strategy.

### What should a good Git workflow protect?

A good workflow protects:

- a releasable and reviewed default branch;
- small, understandable commits;
- automated test and policy checks;
- secrets and generated artifacts;
- traceability between changes, reviews, and releases;
- collaborators from unexpected history rewrites.
