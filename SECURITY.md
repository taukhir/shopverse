# Security Policy

## Supported Versions

ShopVerse is a reference/portfolio project, not a distributed product with
versioned releases. Only the `master` branch is maintained; there is no
backport policy for older commits.

## Automated Security Tooling

This repo runs the following checks automatically, documented in
[`.github/workflows/README.md`](.github/workflows/README.md):

| Tool | What it checks | Where |
|---|---|---|
| [Dependabot](.github/dependabot.yml) | Known-vulnerable and outdated dependencies (Gradle, npm, Docker base images, GitHub Actions) | Weekly, automated PRs |
| [gitleaks](.github/workflows/security.yml) | Committed secrets (keys, tokens, credentials) | Every push, PR, and daily |
| [Trivy](.github/workflows/security.yml) | CRITICAL/HIGH CVEs in each service's built container image | Every push, PR, and daily; results in the repo's Security tab |
| [SpotBugs](build-logic/src/main/groovy/io.shopverse.java-service-conventions.gradle) | Common Java bug patterns (e.g. exposing mutable internal state) | Every Gradle build, report-only |
| [Checkstyle](gradle/checkstyle/checkstyle.xml) | Correctness issues (unused imports, empty catch blocks, equals/hashCode bugs) | Every Gradle build, report-only |

SpotBugs and Checkstyle are currently report-only (`ignoreFailures = true`)
and do not block a build; findings are tracked for manual triage (see
[`dev-tools/teams/BACKLOG.md`](dev-tools/teams/BACKLOG.md)).

## Reporting a Vulnerability

This is a personal/portfolio project with a single maintainer. If you find
a security issue, please open a
[private security advisory](https://github.com/taukhir/shopverse/security/advisories/new)
on GitHub rather than a public issue, so it can be reviewed before any
details are disclosed publicly.

There is no bug bounty or formal SLA — this is maintained on a best-effort
basis.
