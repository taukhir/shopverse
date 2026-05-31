# Shopverse User Service

User Service manages users, roles, permissions, password lifecycle, audit history, and user-facing account APIs for the Shopverse platform.

## Tech Stack

- Java 21
- Spring Boot 4
- Spring Security
- Spring Data JPA
- Liquibase
- MySQL
- Resilience4j
- Springdoc OpenAPI
- Docker
- Eureka Discovery Client

## Features

- REST APIs for users, roles, and permissions
- Pagination, filtering, and sorting for collection endpoints
- Soft delete for users
- Password change and administrator reset APIs
- Delegating password encoder with BCrypt hashes such as `{bcrypt}...`
- Password history validation against recent passwords
- User audit logging
- Consistent error and success response models
- OpenAPI/Swagger documentation
- Resilience4j rate limiter, bulkhead, and retry
- In-memory lookup caching for roles and permissions

## Important Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/users` | Paged user summaries |
| `GET` | `/api/v1/users/{id}` | User details |
| `POST` | `/api/v1/users` | Create user |
| `PATCH` | `/api/v1/users/{id}` | Update user |
| `DELETE` | `/api/v1/users/{id}` | Soft delete user |
| `PATCH` | `/api/v1/users/{id}/password` | Change password |
| `POST` | `/api/v1/users/{id}/password/reset` | Admin password reset |
| `GET` | `/api/v1/roles` | Paged roles |
| `GET` | `/api/v1/permissions` | Paged permissions |
| `GET` | `/api/v1/users/public/health` | Public service health |

Example paged request:

```http
GET /api/v1/users?page=0&size=20&sortBy=username&direction=ASC&search=ahmed&status=ACTIVE&role=ADMIN
```

## API Documentation

After starting the service:

- Swagger UI: `http://localhost:8082/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8082/v3/api-docs`
- Actuator health: `http://localhost:8082/actuator/health`

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `SERVER_PORT` | `8082` | HTTP port |
| `SPRING_APPLICATION_NAME` | `user-service` | Spring application name |
| `DB_URL` | `jdbc:mysql://localhost:3307/user_service` | JDBC URL |
| `DB_USERNAME` | `ahmed` | Database username |
| `DB_PASSWORD` | `Ahm3d@123` | Database password |
| `DB_DRIVER` | `com.mysql.cj.jdbc.Driver` | JDBC driver |
| `LIQUIBASE_ENABLED` | `true` | Enables Liquibase |
| `LIQUIBASE_CHANGELOG` | `classpath:db/changelog/db.changelog-master.yml` | Liquibase changelog path |
| `EUREKA_DEFAULT_ZONE` | `http://localhost:8761/eureka` | Eureka server URL |
| `JPA_SHOW_SQL` | `false` | SQL logging |
| `HIBERNATE_FORMAT_SQL` | `false` | SQL formatting |
| `RATE_LIMIT_ENABLED` | `true` | Enables Resilience4j rate limiter filter |
| `RATE_LIMIT_REFILL_TOKENS_PER_MINUTE` | `60` | Rate limiter refresh amount |
| `RATE_LIMIT_BURST_CAPACITY` | `120` | Short burst capacity |
| `BULKHEAD_ENABLED` | `true` | Enables Resilience4j bulkhead filter |
| `BULKHEAD_MAX_CONCURRENT_REQUESTS` | `100` | Max concurrent API requests per instance |
| `LOOKUP_RETRY_MAX_ATTEMPTS` | `3` | Retry attempts for safe lookup reads |
| `LOOKUP_RETRY_WAIT_DURATION_MILLIS` | `100` | Retry delay for lookup reads |

## Running Locally

Start MySQL from the bundled compose file:

```bash
cd src/main/resources/db
docker compose up -d
```

Run the service:

```bash
cd user-service
$env:JAVA_HOME='C:\Users\Ahmed\.jdks\azul-21.0.5'
.\gradlew.bat bootRun
```

Run tests:

```bash
.\gradlew.bat test
```

## Docker

Build the image:

```bash
docker build -t shopverse/user-service:latest .
```

Run the container:

```bash
docker run --rm -p 8082:8082 ^
  -e DB_URL=jdbc:mysql://host.docker.internal:3307/user_service ^
  -e DB_USERNAME=ahmed ^
  -e DB_PASSWORD=Ahm3d@123 ^
  -e EUREKA_DEFAULT_ZONE=http://host.docker.internal:8761/eureka ^
  shopverse/user-service:latest
```

The Dockerfile uses:

- multi-stage build
- Java 21 JDK for build
- Java 21 JRE for runtime
- non-root runtime user
- container-aware JVM memory settings
- Actuator healthcheck
- `.dockerignore` to reduce build context size

## Resilience

This service uses Resilience4j core modules directly:

- `RateLimiter` protects `/api/**` from request bursts.
- `Bulkhead` limits concurrent API requests per service instance.
- `Retry` is used only for safe read-only role/permission lookup operations.

Write operations are not retried automatically to avoid duplicate mutations. For horizontally scaled production deployments, move rate limiting and cache state to Redis or enforce limits at the API gateway.

## Security Notes

- Passwords are never returned in API responses.
- Passwords are stored with Spring Security `DelegatingPasswordEncoder`.
- New passwords are checked against recent password history.
- User deletion is soft delete: status becomes `DELETED`, account is disabled, and audit history is retained.
- Current development security uses in-memory users; replace this with JWT/security-service integration before production.

## Database Tables

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `refresh_tokens`
- `login_audit`
- `password_history`
- `user_audit`

## Test Coverage

Unit tests cover:

- user, role, permission services
- password history
- audit logging
- validation helpers
- pagination validation
- exception handler behavior
- Resilience4j rate limiting and bulkhead filters
- lookup service retry seam

## Production Follow-Ups

- Replace in-memory Spring Security users with JWT/security-service integration.
- Add Testcontainers integration tests for MySQL and Liquibase.
- Move cache/rate limit state to Redis for multi-instance deployments.
- Add centralized logging, tracing, and metrics dashboards.
