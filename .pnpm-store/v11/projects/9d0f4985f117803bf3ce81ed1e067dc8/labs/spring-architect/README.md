# Shopverse Spring Architect Labs

Executable Java 21 and Spring Boot 4 examples backing the Spring documentation.

Run from the repository root:

```powershell
.\shopverse-platform\gradlew.bat -p .\documentation\labs\spring-architect clean test
```

The suite proves transaction rollback, an entity-graph fetch plan, cache eviction,
bounded retry, a named async executor, replay idempotency, and request plus method
authorization. Kafka infrastructure configuration is compiled without requiring a
broker; deterministic replay behavior is tested directly.
