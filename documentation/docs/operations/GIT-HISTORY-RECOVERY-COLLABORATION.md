---
title: "Git History, Recovery, And Collaboration"
description: "Git History, Recovery, And Collaboration with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Git History, Recovery, And Collaboration"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Git History, Recovery, And Collaboration

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

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

<ExpandableAnswer title="What is the difference between Git and GitHub?">

Git is a distributed version-control system that stores repository history
locally. GitHub is a hosted collaboration platform built around Git, adding
pull requests, issue tracking, reviews, automation, and repository hosting.

</ExpandableAnswer>
<ExpandableAnswer title="What is the difference between git fetch and git pull?">

`git fetch` downloads remote information without changing the current branch.
`git pull` fetches and immediately integrates the tracked remote branch using
merge, rebase, or fast-forward behavior.

</ExpandableAnswer>
<ExpandableAnswer title="What is the difference between merge and rebase?">

Merge combines histories without rewriting existing commits and may create a
merge commit. Rebase replays commits on a new base, creating new commit IDs and
a linear history. Merge is safer for shared history; rebase is useful for
private feature work.

</ExpandableAnswer>
<ExpandableAnswer title="What is HEAD?">

`HEAD` identifies the currently checked-out commit, normally indirectly
through the current branch reference. In a detached `HEAD` state, it points
directly to a commit rather than a branch.

</ExpandableAnswer>
<ExpandableAnswer title="What is a detached HEAD?">

It occurs when a commit or tag is checked out directly:

```bash
git switch --detach <commit>
```

New commits are not attached to a named branch and can become difficult to
find. Preserve them by creating a branch:

```bash
git switch -c recovery/my-work
```

</ExpandableAnswer>
<ExpandableAnswer title="What is the staging area?">

The staging area, or index, is the proposed content for the next commit.
`git add` copies selected changes into it, allowing one working-tree change set
to be divided into multiple focused commits.

</ExpandableAnswer>
<ExpandableAnswer title="What is the difference between reset, restore, and revert?">

| Command | Primary purpose | Shared-history safety |
|---|---|---|
| `git restore` | Restore working-tree or staged file content | Safe when used carefully before committing |
| `git reset` | Move a branch or adjust index/working tree | Can rewrite history; dangerous after sharing |
| `git revert` | Create a new commit that reverses an older commit | Preferred for shared history |

Use `git revert <commit>` to undo a commit already merged into a shared branch.

</ExpandableAnswer>
<ExpandableAnswer title="What is the difference between git reset --soft, --mixed, and --hard?">

- `--soft` moves `HEAD` but keeps changes staged.
- `--mixed` moves `HEAD` and unstages changes while keeping working files.
- `--hard` moves `HEAD` and discards tracked working-tree changes.

`--hard` is destructive and should not be used without first checking what
would be lost.

</ExpandableAnswer>
<ExpandableAnswer title="What is cherry-pick?">

`git cherry-pick <commit>` applies the change introduced by a specific commit
onto the current branch, creating a new commit ID. It is useful for targeted
backports and hotfixes, but routine cherry-picking between long-lived branches
can create duplicate history and future conflicts.

</ExpandableAnswer>
<ExpandableAnswer title="What is the difference between squash merge and rebase?">

A squash merge combines all feature changes into one new commit on the target
branch. Rebase preserves each feature commit but rewrites it onto a new base.
Squashing gives a concise target history; rebasing retains individual commit
structure.

</ExpandableAnswer>
<ExpandableAnswer title="Why use --force-with-lease instead of --force?">

`--force-with-lease` checks that the remote branch still matches the expected
state before replacing it. It protects changes pushed by another developer
since the last fetch. Plain `--force` can overwrite those changes silently.

</ExpandableAnswer>
<ExpandableAnswer title="How does Git identify a commit?">

A commit is a content-addressed object containing a tree reference, parent
commit references, author and committer metadata, and the message. Its hash
changes when any of that commit data changes, which is why rebasing creates
new commit IDs.

</ExpandableAnswer>
<ExpandableAnswer title="What is a merge conflict?">

A conflict occurs when Git cannot safely combine changes automatically, such
as overlapping edits or delete-versus-modify changes. The developer must
choose the correct combined result, stage it, and continue the merge or rebase.

</ExpandableAnswer>
<ExpandableAnswer title="How can a deleted branch or commit be recovered?">

Use the reflog to locate a recently reachable commit:

```bash
git reflog
git switch -c recovery/my-branch <commit>
```

The reflog is local and retention-limited, so it is a recovery mechanism rather
than a backup strategy.

</ExpandableAnswer>
<ExpandableAnswer title="What should a good Git workflow protect?">

A good workflow protects:

- a releasable and reviewed default branch;
- small, understandable commits;
- automated test and policy checks;
- secrets and generated artifacts;
- traceability between changes, reviews, and releases;
- collaborators from unexpected history rewrites.

</ExpandableAnswer>

## Recommended Next

Return to [Git Engineering Guide](./GIT-COMMANDS.md) to select the next focused guide.


## Official References

- [Docusaurus documentation](https://docusaurus.io/docs)
- [Git documentation](https://git-scm.com/docs)
