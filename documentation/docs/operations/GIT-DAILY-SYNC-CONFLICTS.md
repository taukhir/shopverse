---
title: "Git Daily Workflow, Sync, And Conflicts"
description: "Git Daily Workflow, Sync, And Conflicts with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Git Daily Workflow, Sync, And Conflicts"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Git Daily Workflow, Sync, And Conflicts

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

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

## Command Cheat Sheet

| Task | Command | Notes |
|---|---|---|
| check changes | `git status` | first command before risky operations |
| inspect file diff | `git diff path/to/file` | unstaged changes |
| stage file | `git add path/to/file` | puts changes into the index |
| unstage file | `git restore --staged path/to/file` | keeps working-tree changes |
| amend last commit | `git commit --amend` | rewrites last commit; avoid after sharing |
| rollback shared commit | `git revert <commit>` | creates a new inverse commit |
| rollback local commits but keep changes | `git reset --soft HEAD~2` | moves branch, keeps staged changes |
| rollback local commits and unstage | `git reset --mixed HEAD~2` | keeps files changed |
| combine commits | `git rebase -i HEAD~3` | squash/fixup local commits |
| save temporary work | `git stash push -m "message"` | use before switching context |
| restore stashed work | `git stash pop` | applies and drops the stash |
| list branches | `git branch -a` | includes remote-tracking branches |
| create branch | `git switch -c feature/name` | starts new local branch |
| track remote branch | `git switch --track origin/feature/name` | creates local branch from remote |
| safer force push | `git push --force-with-lease` | protects unseen remote changes |

`origin` is the conventional name for the remote repository. A remote branch
such as `origin/main` is Git's local record of what the remote branch looked
like after the last fetch.

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

## Recommended Next

Return to [Git Engineering Guide](./GIT-COMMANDS.md) to select the next focused guide.


## Official References

- [Docusaurus documentation](https://docusaurus.io/docs)
- [Git documentation](https://git-scm.com/docs)
