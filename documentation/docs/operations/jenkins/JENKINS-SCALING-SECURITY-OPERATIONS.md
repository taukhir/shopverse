---
title: Jenkins Scaling, Security, And Operations
description: Provision Jenkins agents at scale, keep the controller available, and treat plugins and credentials as the controller's real trust boundary.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Jenkins Shared Libraries And Multibranch Pipelines]
learning_objectives: [Size agent capacity from evidence rather than guesswork, Scope credentials and evaluate plugin trust correctly, Diagnose controller disk and capacity incidents]
technologies: [Jenkins, Kubernetes agents]
last_reviewed: "2026-11-18"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Jenkins Scaling, Security, And Operations

A Jenkins **controller** schedules work and serves the UI; it should run
little to no build work itself. An **agent** is a separate machine or pod
that actually executes pipeline steps. Scaling Jenkins is mostly about
growing agent capacity safely; securing Jenkins is mostly about limiting
what a compromised pipeline, plugin, or credential can reach.

## Static Versus Dynamic Agent Provisioning

| Model | How capacity is added | Fits |
|---|---|---|
| Static agents | pre-registered, always-on machines with fixed labels | predictable, steady build load; specialized hardware (GPU, licensed tooling) |
| Dynamic/cloud agents (Kubernetes, EC2 plugin) | a plugin provisions a fresh agent pod/instance per build, then tears it down | bursty load, untrusted/PR builds that should not persist state between runs |

Dynamic agents also close the "configuration drift" failure mode static
agents accumulate over time: each build gets a clean environment instead
of inheriting whatever a previous build left on disk.

```groovy
pipeline {
    agent {
        kubernetes {
            label 'gradle-build-agent'
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: gradle
    image: gradle:8-jdk21
    resources:
      requests: { cpu: "1", memory: "2Gi" }
      limits:   { cpu: "2", memory: "4Gi" }
'''
        }
    }
    stages {
        stage('Build') {
            steps {
                container('gradle') {
                    sh './gradlew build --no-daemon'
                }
            }
        }
    }
}
```

**Agent labels** (`label 'gradle-build-agent'` above) are how a pipeline
requests capacity with specific capabilities (a JDK version, a license
file, a GPU) rather than any available executor — a label mismatch, not a
general capacity shortage, is a common cause of a build queuing
indefinitely even when other agents sit idle.

## Executor Sizing

An **executor** is one concurrent build slot on an agent. Oversizing
executors per agent (e.g., 8 executors on a 4-core box running CPU-bound
Gradle builds) does not add real capacity — it adds contention, and
measured build time per job gets worse even though "capacity" on paper
went up. Size executors from the actual CPU/memory profile of the
workload the agent runs, not from a round number.

## Controller Availability

The controller is a single point of failure for scheduling and UI access
(not for already-running agent work, which continues independently). Core
practices:

- back up `$JENKINS_HOME` (job configuration, build history, credentials
  store, plugin list) on a schedule, and — like every other backup
  covered on this site — test the restore, not just the backup job's exit
  code;
- keep plugin versions and the controller's own version patched
  deliberately, on a tested upgrade path, rather than auto-updating
  production without a rollback plan;
- never run production builds directly on the controller (both the
  Shopverse implementation and the generic Jenkins guide already state
  this) — a build process consuming controller CPU/memory degrades
  scheduling and UI responsiveness for every other job.

## Plugin Supply-Chain Risk

A Jenkins plugin runs with the controller's own trust level — there is no
sandboxing between "the Jenkins core" and "a community plugin" the way a
browser sandboxes a web page. Installing a plugin is closer to merging an
unreviewed dependency directly into the controller process than to
installing an application-level library, the same framing this site
already uses for unreviewed container images in
[Docker Security, Compose, Resources, Logging, And Production Operations](../docker/DOCKER-SECURITY-PRODUCTION-OPERATIONS.md).
Practices that bound this risk:

- install plugins only from the official Update Center, pin specific
  versions, and track CVE advisories for installed plugins deliberately;
- minimize the installed plugin set — the Shopverse implementation's own
  `jenkins/plugins.txt` pattern (an explicit, versioned, reviewed list
  built into the image) is the right default, not an improvised
  click-through install;
- treat a plugin update the same as any other production dependency
  upgrade: test it in a non-production controller before rolling it out.

## Credential Scoping

| Scope | Visible to | Fits |
|---|---|---|
| Global | every job on the controller | rarely the right default |
| Folder | jobs inside one folder | team/project-owned credentials, the usual default |
| Job | one specific job | a credential only one pipeline should ever use |

A shared-library step (see the previous page) that hardcodes a global
credential ID is a security smell even if the library itself is
well-tested: every consuming pipeline across every team now implicitly
depends on, and can potentially exfiltrate, that one global secret. Prefer
passing a credential ID as a parameter into the shared-library step so
each consuming pipeline supplies its own folder- or job-scoped credential.

```groovy
// smell: the shared-library step owns a global credential ID
def call(String serviceDir) {
    withCredentials([usernamePassword(credentialsId: 'global-registry-creds', ...)]) { ... }
}

// better: the caller supplies its own appropriately-scoped credential
def call(String serviceDir, String credentialsId) {
    withCredentials([usernamePassword(credentialsId: credentialsId, ...)]) { ... }
}
```

## Incident Runbooks

**Controller is out of disk space from build-log/artifact retention.**
Identify which jobs' `buildDiscarder` retention policy is missing or too
generous (see the `logRotator` setting both `JENKINS.md` and
`SHOPVERSE-JENKINS.md` already use per job) before deleting anything by
hand; a controller-wide disk-usage plugin report, not guesswork, should
drive which job's artifacts are safe to prune. Fix the retention policy at
the source so the problem does not recur on the same timeline.

**A runaway or compromised agent is consuming disproportionate
capacity.** Determine whether the agent is a static machine (investigate
and remediate in place) or a dynamic/cloud agent (the simpler, usually
correct response is terminating the pod/instance — a fresh one will be
provisioned on the next build, and no state on a dynamic agent should be
considered durable in the first place). Correlate with recent pipeline or
shared-library changes before assuming it is purely an infrastructure
fault.

**A build is queued indefinitely with idle agents visible in the
fleet.** Check the requested agent label against the labels actually
registered on available agents first — a typo'd or renamed label is a far
more common cause than genuine capacity exhaustion, and "idle agents
exist but the queue isn't draining" is the specific symptom that points
at a label mismatch rather than a capacity problem.

## Tricky Interview Questions

**A team argues dynamic Kubernetes agents are strictly better than
static agents because they "never have configuration drift." What is the
actual trade-off being made?** Dynamic agents remove drift by starting
clean every build, but they add provisioning latency (pulling the agent
pod's image, scheduling it) to every build's start time, and they cannot
hold specialized long-lived state (a large persistent build cache, a
licensed-tool install) as conveniently as a static agent can — the choice
trades per-build latency and state-retention for environment
consistency, not a strict improvement.

**Why is installing a Jenkins plugin a bigger trust decision than
installing most application-level libraries?** A Jenkins plugin runs
inside the same controller process with the same privileges as Jenkins
core — there is no sandbox boundary between plugin code and the
controller's credential store, job configuration, and scheduling engine.
An application dependency, by contrast, usually runs inside the
application's own, more limited runtime boundary.

**A shared-library step was written with a hardcoded global credential
ID "to keep it simple." A security review flags it. What is the actual
risk, concretely?** Every pipeline across every team that calls that
shared-library step now implicitly has access to whatever that global
credential can do, and a bug or malicious change in any one consuming
pipeline's `Jenkinsfile` could exfiltrate or misuse it — the fix is
parameterizing the credential ID so each caller supplies its own
appropriately-scoped (folder- or job-level) credential instead.

## One-Page Revision

- Controller schedules and serves UI; agents execute work — keep builds
  off the controller.
- Static agents trade drift risk for state retention and lower
  per-build latency; dynamic agents trade provisioning latency for a
  clean environment every run.
- Size executors from measured CPU/memory profile, not a round number —
  oversized executor counts add contention, not capacity.
- A Jenkins plugin runs at controller trust level; treat installing one
  like merging an unreviewed dependency into the controller process.
- Scope credentials to the folder/job that needs them; a shared-library
  step should take a credential ID as a parameter, never hardcode a
  global one.
- A queued build with idle agents visible usually means a label
  mismatch, not real capacity exhaustion.

## Official References

- [Jenkins distributed builds](https://www.jenkins.io/doc/book/scaling-jenkins/)
- [Jenkins Kubernetes plugin](https://plugins.jenkins.io/kubernetes/)
- [Jenkins credentials documentation](https://www.jenkins.io/doc/book/using/using-credentials/)
- [Jenkins security advisories](https://www.jenkins.io/security/advisories/)

## Recommended Next

Return to the [Jenkins Architect Path](../JENKINS-ARCHITECT-PATH.md) completion standard and verify each item against this track.
