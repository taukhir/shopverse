# Container security remediation — 2026-11-05

## Confirmed failure

At PR #52 head `6964abda936c7f85dc99d90c618c0aef2f8e8e7b`, all eight backend
images built, then Trivy rejected them for HIGH/CRITICAL vulnerabilities. This
was separate from Java compilation, Checkstyle, SpotBugs, unit tests, integration
tests, source scanning and CodeQL, which passed in that run. The corrected Web
Lighthouse check also passed in hosted CI.

The eight retained container SARIF reports contain 375 results across 30 package
coordinates (82 distinct package/CVE pairs). Counts include repeated findings
across service images. Evidence: [Backend run 42072556788](https://github.com/taukhir/shopverse/actions/runs/42072556788).
Presence of a vulnerable package is confirmed; exploitability of each advisory
in this application's configuration was not established.

## Changes

- Upgrade the central Spring Boot baseline from 4.0.6 to 4.0.9 and Spring Cloud
  from 2025.1.1 to 2025.1.4. These remain in the existing release lines, whose
  [compatibility is documented by Spring](https://spring.io/projects/spring-cloud/).
  Boot's BOM supplies patched Spring Framework, Spring Data, Spring Kafka,
  Tomcat, Netty, Jackson 2/3, Micrometer and FreeMarker versions. Cloud supplies
  patched Config Server dependencies.
- Apply `gradle/security-dependencies.gradle` to services and shared modules so
  targeted transitive fixes resolve consistently in both builds. The script
  manages existing dependencies; it does not add unused libraries to images.
- In all eight runtime Dockerfiles, explicitly upgrade/install `libexpat` with
  curl from the existing Alpine release repository. The examined JRE base had
  2.9.0-r0 installed while its repository supplied the patched 2.10.0-r0.
- Pin source and image scans to Trivy 0.76.1, the locally verified scanner version.
  The previous action default was 0.70.0 and warned about the current Alpine
  release. Keep action commit pins, HIGH/CRITICAL blocking, failure exit codes,
  SARIF retention and scanning of the built image unchanged.

| Targeted dependency family | Version | Reason for explicit management |
| --- | --- | --- |
| Apache HttpCore 5 / HTTP2 | 5.4.3 | Boot 4.0.9 still manages 5.3.6, below the reported fixes |
| Bouncy Castle jdk18on provider, PKIX and utilities | 1.85 | Fix the reported crypto advisories while aligning the related artifacts |
| Commons FileUpload | 1.6.0 | Fix CVE-2025-48976 in the packaged 1.x dependency |
| Guava | 33.7.2-jre | Fix the reported advisory in the existing JRE variant |
| Snappy Java | 1.1.10.9 | Fix the reported compression-library advisories |
| at.yawk.lz4 Java | 1.11.4 | Fix the reported compression-library advisory |

Versions were checked against published POMs in Maven Central. See the
[Boot BOM](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-dependencies/4.0.9/spring-boot-dependencies-4.0.9.pom)
and [Cloud BOM](https://repo.maven.apache.org/maven2/org/springframework/cloud/spring-cloud-dependencies/2025.1.4/spring-cloud-dependencies-2025.1.4.pom).
Remove each targeted override once an adopted BOM manages an equally patched
version, after checking the resolved runtime graph and rebuilding/scanning images.
No vulnerability allowlist, ignore-unfixed flag or severity reduction was added.

## Validation

Final review: 2026-11-06 (Asia/Calcutta).

- All eight services passed strict `check` and `bootJar` with the CI quality init
  script, `--no-daemon --no-configuration-cache --max-workers=2`. Shared modules
  passed strict `check` with the same settings.
- Order, Payment and Inventory also passed `integrationTest` against real
  Testcontainers. Their XML reports confirm four tests each: 12 total, no
  failures, errors or skipped tests.
- All eight backend runtime images rebuilt successfully. Each was scanned with
  Trivy 0.76.1 using `--scanners vuln --severity HIGH,CRITICAL --exit-code 1`.
  All eight scans exited successfully with zero HIGH/CRITICAL findings. JSON
  reports include both Alpine packages and the packaged Java libraries.
- All 29 pipeline/quality-policy tests, Actionlint, cloud configuration checks
  and `git diff --check` passed.

Local logs and JSON receipts are under the ignored `.tmp/pr52-image-security/`:
`validation-results.json`, `integration-results.json`, the eight
`*-image-scan.json` files, image build logs and original hosted SARIF reports.
These are local evidence, not proposed tracked build artifacts. No commits,
pushes, deployments or repository setting changes were performed. Team files
were untouched.

## Scope and release limits

No API, Kafka event schema, database changelog, authorization policy or business
state transition was changed. Existing checkout SAGA, Inventory expiry and
repository protection findings remain separate in
[runtime verification](runtime-verification.md). This remediation does not
establish production readiness, deployment or rollback success. Local changes
need a fresh hosted run after they are pushed; the failed run is historical
evidence and does not become successful when local files change.
