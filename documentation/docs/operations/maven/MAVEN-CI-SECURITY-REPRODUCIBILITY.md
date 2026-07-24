---
title: Maven Testing, Repositories, Security, Reproducibility, And CI
description: Configure Surefire and Failsafe, repository mirrors and credentials, reproducible archives, supply-chain controls, caching, and release pipelines.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Maven Dependencies Reactors And Profiles]
learning_objectives: [Separate test lifecycles, Secure artifact resolution, Produce verifiable CI artifacts]
technologies: [Apache Maven, Surefire, Failsafe, CI/CD]
last_reviewed: "2026-07-23"
---

# Maven Testing, Repositories, Security, Reproducibility, And CI

## Unit Versus Integration Tests

Surefire normally runs unit tests during `test`. Failsafe runs integration tests during
`integration-test` and verifies results during `verify`, allowing teardown to occur before
the build fails.

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-failsafe-plugin</artifactId>
  <version>${maven-failsafe-plugin.version}</version>
  <executions>
    <execution>
      <goals><goal>integration-test</goal><goal>verify</goal></goals>
    </execution>
  </executions>
</plugin>
```

Use stable naming conventions, isolate test resources, publish reports, and fail on flaky
tests rather than hiding them through endless reruns. Distinguish `-DskipTests` (usually
skip execution) from `-Dmaven.test.skip=true` (also skips compilation in standard plugins).

## Repository And Settings Model

Dependencies/plugins resolve through local and remote repositories subject to mirrors,
proxies, credentials, and policies in `settings.xml`. A corporate repository manager
should proxy approved upstreams, host internal artifacts, control retention, and record
provenance.

```xml
<server>
  <id>internal-releases</id>
  <username>${env.MAVEN_REPO_USER}</username>
  <password>${env.MAVEN_REPO_TOKEN}</password>
</server>
```

The server `id` must match distribution/repository configuration. Prefer CI secret
injection and short-lived credentials. Never echo effective settings containing secrets.
Maven password encryption reduces plaintext exposure but is not a complete secret manager.

## Reproducibility

A reproducible build controls source revision, Maven/JDK/toolchain, dependency and plugin
versions, repository inputs, locale/time zone where relevant, archive timestamps/order,
generated content, and environment-dependent profiles.

Set `project.build.outputTimestamp`, use the wrapper, pin plugins, avoid dynamic versions,
and compare artifact hashes in a controlled rebuild. Release artifacts should be immutable.

## Supply-Chain Controls

- verify source and dependency provenance;
- generate and publish an SBOM tied to the artifact digest;
- scan dependencies and container images with triaged severity/exploitability;
- enforce allowed repositories and HTTPS;
- minimize CI token scope and separate snapshot/release deployment rights;
- sign or attest releases and protect promotion metadata;
- review plugin dependencies because plugins execute code during the build;
- block accidental secret/package publication.

## CI Pipeline

```text
checkout -> verify wrapper/JDK -> resolve/cache -> compile/test
 -> integration/contract tests -> static/security/license gates
 -> package -> SBOM/attestation -> publish once -> promote same digest
```

Do not rebuild independently per environment; promote the tested artifact. Cache by a
safe key and treat the cache as untrusted optimization. Maven's local repository has
concurrency and partial-download behavior; isolate jobs or use supported cache patterns.

## Release And Snapshot Policy

Snapshots support changing development outputs and timestamped resolution. Releases must
not be overwritten. Use version control tags, changelogs, protected release jobs, and a
rollback strategy. Flattening consumer POMs may help CI-friendly versions, but validate
the published POM contract.

## Production Questions

**Central repository is unavailable.** Existing cached dependencies may permit some builds,
but clean/release builds can fail. Operate redundant repository infrastructure, monitored
upstream proxies, controlled caches, and a documented degraded-build policy.

**Security override breaks Boot compatibility.** Confirm reachable vulnerable code and
fixed versions, test the complete managed graph, prefer supported platform upgrades, and
record the temporary override plus removal trigger.

**Build is fast locally and slow in CI.** Separate download, compilation, test, packaging,
and scanner timings; inspect cache keys, fork count, CPU quotas, test containers, network,
and sequential bottlenecks before adding parallelism.

## Official References

- [Maven Surefire Plugin](https://maven.apache.org/surefire/maven-surefire-plugin/)
- [Maven Failsafe Plugin](https://maven.apache.org/surefire/maven-failsafe-plugin/)
- [Maven settings reference](https://maven.apache.org/settings.html)
- [Maven reproducible builds](https://maven.apache.org/guides/mini/guide-reproducible-builds.html)

## Recommended Next

Finish with [Troubleshooting, Interview Questions, Labs, And Revision](./MAVEN-TROUBLESHOOTING-INTERVIEW-REVISION.md).

