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
- Spring Cloud Config Client
- Micrometer Prometheus metrics
- Zipkin tracing
- Centralized logging through Promtail/Loki/Grafana

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
| `GET` | `/api/v1/public/health` | Public service health |

Example paged request:

```http
GET /api/v1/users?page=0&size=20&sortBy=username&direction=ASC&search=ahmed&status=ACTIVE&role=ADMIN
```

## API Documentation

After starting the service:

- Swagger UI: `http://localhost:8082/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8082/v3/api-docs`
- Actuator health: `http://localhost:8082/actuator/health`
- Prometheus metrics: `http://localhost:8082/actuator/prometheus`

## Environment Variables

The root Docker Compose file reads variables from `shopverse/.env`. Start by copying:

```powershell
Copy-Item ..\.env.example ..\.env
```

For direct `bootRun`, set these variables in your shell or IDE run configuration. Spring Boot does not automatically load a `.env` file when running outside Docker Compose.

| Variable | Default | Description |
| --- | --- | --- |
| `SERVER_PORT` | `8082` | HTTP port |
| `SPRING_APPLICATION_NAME` | `USER-SERVICE` | Spring application name |
| `SPRING_CONFIG_IMPORT` | `optional:configserver:http://localhost:8888` | Config Server import URL |
| `DB_URL` | `jdbc:mysql://localhost:3307/user_service` | JDBC URL |
| `DB_USERNAME` | `ahmed` | Database username |
| `DB_PASSWORD` | `Ahm3d@123` | Database password |
| `DB_DRIVER` | `com.mysql.cj.jdbc.Driver` | JDBC driver |
| `JPA_DDL_AUTO` | `none` | Hibernate DDL strategy |
| `USER_SERVICE_LIQUIBASE_ENABLED` | `true` | Enables Liquibase in Docker Compose |
| `USER_SERVICE_LIQUIBASE_CHANGELOG` | `classpath:db/changelog/db.changelog-master.yml` | Liquibase changelog path in Docker Compose |
| `EUREKA_DEFAULT_ZONE` | `http://localhost:8761/eureka` | Eureka server URL |
| `EUREKA_INSTANCE_HOSTNAME` | `localhost` | Eureka instance hostname |
| `EUREKA_PREFER_IP_ADDRESS` | `true` | Prefer IP address for Eureka registration |
| `JWK_SET_URI` | `http://localhost:8081/auth/.well-known/jwks.json` | Auth Service JWKS endpoint |
| `JPA_SHOW_SQL` | `false` | SQL logging |
| `HIBERNATE_FORMAT_SQL` | `false` | SQL formatting |
| `RATE_LIMIT_BURST_CAPACITY` | `120` | Short burst capacity |
| `RATE_LIMIT_REFRESH_PERIOD` | `60s` | Rate limiter refresh period |
| `RATE_LIMIT_TIMEOUT_DURATION` | `0` | Maximum wait time for a rate limiter permit |
| `BULKHEAD_MAX_CONCURRENT_REQUESTS` | `100` | Max concurrent API requests per instance |
| `BULKHEAD_MAX_WAIT_DURATION` | `0` | Maximum wait time for bulkhead access |
| `LOOKUP_RETRY_MAX_ATTEMPTS` | `3` | Retry attempts for safe lookup reads |
| `LOOKUP_RETRY_WAIT_DURATION` | `100ms` | Retry delay for lookup reads |
| `TRACING_ENABLED` | `true` | Enables tracing |
| `TRACING_SAMPLING_PROBABILITY` | `1.0` | Trace sampling probability |
| `ZIPKIN_ENDPOINT` | `http://localhost:9411/api/v2/spans` | Zipkin trace endpoint |
| `LOG_FILE` | `logs/${spring.application.name}.log` | Service log file path |

Root `.env` variables use a `USER_SERVICE_` prefix for Docker Compose and are mapped to the Spring variables above. For example, `USER_SERVICE_DB_URL` becomes `DB_URL` inside the user-service container.

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

Run as part of the full root stack:

```bash
cd ..
docker compose up -d
docker compose logs -f user-service
```

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

More Docker commands, flags, and Dockerfile details are in [../docker/README.md](../docker/README.md).

## Jenkins Pipeline

User Service has a simple service-specific Jenkins pipeline:

```text
user-service/Jenkinsfile
```

Use this when you want Jenkins to build and test only `user-service`, then optionally build its Docker image.

### Create The Jenkins Job

1. Start Jenkins from the Shopverse root folder:

```powershell
docker compose -f jenkins/docker-compose.yml up -d
```

2. Open Jenkins:

```text
http://localhost:8085
```

3. Login:

```text
admin / admin
```

4. Click **New Item**.
5. Enter:

```text
shopverse-user-service
```

6. Select **Pipeline**.
7. Under **Pipeline**, choose **Pipeline script from SCM**.
8. Select **Git**.
9. Add the Shopverse GitHub repository URL.
10. Set **Branch Specifier** to your branch, for example:

```text
*/main
```

11. Set **Script Path** to:

```text
user-service/Jenkinsfile
```

12. Save.
13. Click **Build with Parameters**.

### Jenkins Parameters

| Parameter | Default | Use |
| --- | --- | --- |
| `BUILD_DOCKER_IMAGE` | `true` | Builds the user-service Docker image after Gradle build/test. |
| `DEPLOY_LOCALLY` | `false` | Tags the image as `shopverse/user-service:local` and deploys it through root Docker Compose. |
| `IMAGE_NAME` | `shopverse/user-service` | Docker image repository/name. |
| `IMAGE_TAG` | empty | Optional tag. If empty, Jenkins uses `<build-number>-<git-sha>`. |

### Pipeline Stages

| Stage | What it does |
| --- | --- |
| `Checkout` | Pulls the latest code from GitHub using Jenkins SCM. |
| `Resolve Image Tag` | Creates the Docker image tag used by later stages. |
| `Build And Test` | Runs `./gradlew clean build --no-daemon` inside `user-service`. |
| `Build Docker Image` | Builds `shopverse/user-service:<tag>` using the service Dockerfile. |
| `Verify Docker Image` | Runs `docker image inspect` to confirm the image exists. |
| `Deploy Locally` | Optional. Re-tags the image as `shopverse/user-service:local`, runs `docker compose up -d user-service`, and waits for container health. |

### Deploy Locally From Jenkins

Use this when you want Jenkins to build the image and restart `user-service` in your local Docker Compose stack.

Run **Build with Parameters** using:

```text
BUILD_DOCKER_IMAGE=true
DEPLOY_LOCALLY=true
IMAGE_NAME=shopverse/user-service
IMAGE_TAG=
```

What Jenkins does:

1. Builds and tests `user-service`.
2. Builds an image such as:

```text
shopverse/user-service:<build-number>-<git-sha>
```

3. Tags that same image as:

```text
shopverse/user-service:local
```

4. Runs from the Shopverse root:

```powershell
docker compose up -d user-service
```

5. Waits for:

```text
shopverse-user-service
```

to become healthy.

Important:

- The root stack dependencies should be available: MySQL, Config Server, Discovery Server, Auth Service, and Zipkin.
- If the full stack is not running, Docker Compose will start required dependencies for `user-service`.
- Jenkins deploys into your local Docker daemon because the Jenkins container mounts `/var/run/docker.sock`.
- The deployed service uses the image expected by root Compose: `shopverse/user-service:local`.

### Docker Image Commands

Build the user-service image manually from the Shopverse root:

```powershell
docker build -t shopverse/user-service:local ./user-service
```

Build with Docker Compose:

```powershell
docker compose build user-service
```

Recreate only user-service after a rebuild:

```powershell
docker compose up -d --force-recreate user-service
```

List user-service images:

```powershell
docker image ls shopverse/user-service
```

Inspect a Jenkins-built image:

```powershell
docker image inspect shopverse/user-service:<tag>
```

Run the image directly:

```powershell
docker run --rm -p 8082:8082 `
  -e SERVER_PORT=8082 `
  -e DB_URL=jdbc:mysql://host.docker.internal:3307/user_service `
  -e DB_USERNAME=ahmed `
  -e DB_PASSWORD=Ahm3d@123 `
  -e EUREKA_DEFAULT_ZONE=http://host.docker.internal:8761/eureka `
  -e JWK_SET_URI=http://host.docker.internal:8081/auth/.well-known/jwks.json `
  shopverse/user-service:<tag>
```

Useful verification commands:

```powershell
curl.exe http://localhost:8082/actuator/health
curl.exe http://localhost:8082/actuator/prometheus
docker compose logs -f user-service
```

Important notes:

- The Jenkinsfile enables Docker BuildKit because the Dockerfile uses `RUN --mount=type=cache`.
- Jenkins collects JUnit XML test results from `user-service/build/test-results/test/*.xml`.
- Jenkins archives Gradle HTML test reports from `user-service/build/reports/tests/test/**`.
- The service needs MySQL, Config Server, Discovery Server, and Auth Service/JWKS for full runtime behavior in the complete stack.

## Observability

- Logs are written to `/app/logs/user-service.log` in Docker.
- Prometheus scrapes `/actuator/prometheus`.
- Custom request counter: `shopverse_service_requests_logged_total{service="USER-SERVICE"}`.
- Zipkin receives request spans.
- Grafana Loki query:

```logql
{application="USER-SERVICE"}
```

## Resilience

User Service uses annotation-based Resilience4j. The controller methods are protected with annotations instead of manually creating Resilience4j beans around each service call.

### Rate Limiter

`@RateLimiter(name = "user-service-api-rate-limiter")` protects the user APIs from too many requests in a short time.

It works like a permit counter:

1. A request enters a protected API.
2. Resilience4j checks whether a rate-limit permit is available.
3. If a permit is available, the request continues to the controller.
4. If no permit is available, the request is rejected with `429 Too Many Requests`.

The important configuration values are:

| Variable | Purpose |
| --- | --- |
| `RATE_LIMIT_BURST_CAPACITY` | How many requests are allowed in one refresh window. |
| `RATE_LIMIT_REFRESH_PERIOD` | How often the permit counter is refreshed. |
| `RATE_LIMIT_TIMEOUT_DURATION` | How long a request waits for a permit. `0` means fail fast. |

### Bulkhead

`@Bulkhead(name = "user-service-api-bulkhead", type = Bulkhead.Type.SEMAPHORE)` limits how many requests can run inside protected user APIs at the same time.

It works like a concurrency gate:

1. A request enters a protected API.
2. Resilience4j checks whether the service instance has free concurrent capacity.
3. If capacity is available, the request runs normally.
4. If all slots are busy, the request is rejected with `503 Service Unavailable`.

The important configuration values are:

| Variable | Purpose |
| --- | --- |
| `BULKHEAD_MAX_CONCURRENT_REQUESTS` | Maximum concurrent protected user API requests per service instance. |
| `BULKHEAD_MAX_WAIT_DURATION` | How long a request waits for a free bulkhead slot. `0` means fail fast. |

The bulkhead is useful because one slow or overloaded endpoint should not consume all available request capacity for the whole service.

### Where It Is Applied

The shared rate limiter and bulkhead are applied to the main user APIs:

- `GET /api/v1/users`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{id}`
- `PATCH /api/v1/users/{id}/password`
- `POST /api/v1/users/{id}/password/reset`
- `DELETE /api/v1/users/{id}`

`@Retry(name = "user-service-lookup-retry")` is used only for safe read-only role and permission lookup operations. Write operations are not retried automatically because retrying create, update, delete, or password operations can create duplicate or confusing mutations.

For horizontally scaled production deployments, move rate limiting and cache state to Redis or enforce limits at the API Gateway so limits are shared across all service instances.

## Security Notes

- Passwords are never returned in API responses.
- Passwords are stored with Spring Security `DelegatingPasswordEncoder`.
- New passwords are checked against recent password history.
- User deletion is soft delete: status becomes `DELETED`, account is disabled, and audit history is retained.
- Current POC security validates JWTs through the Auth Service JWKS endpoint.

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
- annotation-based Resilience4j rate limiting and bulkhead behavior
- lookup service retry behavior

## Production Follow-Ups

- Replace in-memory Spring Security users with JWT/auth-service integration.
- Add Testcontainers integration tests for MySQL and Liquibase.
- Move cache/rate limit state to Redis for multi-instance deployments.
- Move secrets to Docker secrets or a secret manager before production.
