---
title: Java Time, Numeric Correctness And Security Boundaries
description: Time zones, DST, BigDecimal, overflow, randomness, TLS, XML, paths, commands, regex, secrets, and diagnostic data.
---

# Java Time, Numeric Correctness And Security Boundaries

Use `Instant` for a timeline point, `LocalDateTime` for a wall-clock value without
zone, `OffsetDateTime` when an offset is part of the contract, and `ZonedDateTime`
when region rules matter. DST creates gaps and overlaps; converting a local time
can adjust or be ambiguous. Persist timeline events in an unambiguous instant and
retain zone where future civil-time intent matters. Inject `Clock` in tests.
`Duration` measures time-based amounts; `Period` is date-based and behaves through
calendar rules. Document database precision and JSON offset/zone contracts.

`BigDecimal.equals` includes scale while `compareTo` compares numerical value.
Construct decimals from strings for exact decimal intent, define scale and
rounding at domain boundaries, and model money with currency plus amount. Use
`Math.addExact`/related operations where primitive overflow must fail rather than
wrap.

Security review includes:

- `SecureRandom`, not predictable PRNGs, for security tokens;
- hostname verification and supported TLS policy rather than trust-all managers;
- hardened XML factories with external entities/DTDs disabled;
- normalized/real-path authorization beneath an allowed root;
- no shell command concatenation from user data;
- bounded regex complexity and input size;
- strict native-deserialization filtering or safer formats;
- minimal reflective/module opening;
- no secrets/PII in strings, exceptions, logs, heap dumps or JFR exports.

Diagnostic artifacts are production data. Heap dumps can contain credentials and
customer objects; JFR can contain paths, class names, thread names and event data.
Encrypt, access-control, retain briefly and audit their handling.

## Tricky Interview Questions

1. Why can one local time map to zero or two instants? DST gaps and overlaps.
2. Why can equal monetary values fail `BigDecimal.equals`? Scale participates.
3. Does converting a password to `String` preserve wipeability? No; immutable copies can remain until GC.

## Official References

- [Java time](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/time/package-summary.html)
- [`BigDecimal`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/math/BigDecimal.html)
- [Java secure coding guidelines](https://www.oracle.com/java/technologies/javase/seccodeguide.html)

## Recommended Next

Apply these checks during the [Concurrency Architecture Review](./JAVA-CONCURRENCY-DESIGN-REVIEW.md).
