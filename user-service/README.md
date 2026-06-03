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
| `JWT_ISSUER` | `shopverse-auth-service` | Expected JWT issuer used during token validation |
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

## Internal Login Authentication

Auth Service authenticates login requests by calling User Service with HTTP Basic credentials:

```http
GET /api/v1/internal/users/authenticated
Authorization: Basic base64(username:password)
```

User Service validates those credentials against the user database using a DB-backed `UserDetailsService`, `DaoAuthenticationProvider`, and `DelegatingPasswordEncoder`.

If credentials are valid, User Service returns authenticated user details and roles without returning the password hash. Auth Service then signs the JWT.

This endpoint is intentionally scoped to internal service communication. In production, protect it with internal networking, HTTPS/mTLS, rate limits, and audit logs.

User Service uses two `SecurityFilterChain` beans intentionally:

- Internal user authentication endpoints use HTTP Basic only.
- Normal user, role, and permission APIs use JWT resource-server security.

Keeping separate chains prevents HTTP Basic from being accepted across all user APIs and keeps JWT authorization rules focused on the public resource API surface.

### Why User Service Has Two Security Filter Chains

User Service handles two different authentication styles:

| Request Type | Example Endpoint | Credential Type | Purpose |
| --- | --- | --- | --- |
| Internal login validation | `/api/v1/internal/users/authenticated` | HTTP Basic | Auth Service sends submitted username/password so User Service can validate them against the DB. |
| Normal resource APIs | `/api/v1/users/**`, `/api/v1/roles/**` | JWT Bearer token | Clients call business APIs after login with the token issued by Auth Service. |

Because these two request types should not share the same authentication behavior, User Service defines two `SecurityFilterChain` beans.

Spring Security checks filter chains by order. The first matching chain handles the request.

```java
@Bean
@Order(1)
public SecurityFilterChain internalUserSecurityFilterChain(HttpSecurity http) throws Exception {
    http
        .securityMatcher(ApiConstants.INTERNAL_USERS + "/**")
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
        .httpBasic(Customizer.withDefaults());

    return http.build();
}
```

This chain matches only:

```text
/api/v1/internal/users/**
```

So the internal credential-validation endpoint accepts HTTP Basic.

The second chain handles the normal User Service APIs:

```java
@Bean
@Order(2)
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/**").permitAll()
            .requestMatchers(ApiConstants.PUBLIC_API + "/**",
                    ApiConstants.SWAGGER,
                    ApiConstants.SWAGGER_HTML,
                    ApiConstants.OPEN_API).permitAll()
            .requestMatchers(ApiConstants.USERS + "/**").hasAnyRole("USER", "ADMIN")
            .requestMatchers(ApiConstants.ROLES + "/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));

    return http.build();
}
```

This chain validates JWT bearer tokens for normal APIs.

Keeping the chains separate prevents Basic authentication from becoming valid for every User Service API. That is the main reason we keep two chains.

### How The Internal Basic Authentication Flow Works

Login starts in Auth Service:

```java
User user = userService.authenticate(req.username(), req.password());
```

Auth Service builds a Basic auth header:

```java
String credentials = username + ":" + password;
String encodedCredentials = Base64.getEncoder()
    .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

return "Basic " + encodedCredentials;
```

Then Auth Service calls User Service:

```http
GET /api/v1/internal/users/authenticated
Authorization: Basic base64(username:password)
```

Inside User Service:

1. Spring Security's Basic authentication filter reads the `Authorization` header.
2. It extracts the submitted username and password.
3. `DaoAuthenticationProvider` asks `DatabaseUserDetailsService` to load that username.
4. `DatabaseUserDetailsService` fetches the user, roles, permissions, password hash, and account flags from MySQL.
5. Spring Security uses `PasswordEncoder.matches(rawPassword, storedHash)` internally.
6. If valid, the request reaches `InternalUserController`.
7. User Service returns user details and roles without returning the password hash.
8. Auth Service signs the JWT.

### Why DatabaseUserDetailsService Exists

Spring Security does not know how our Shopverse tables are designed. It only knows the `UserDetailsService` contract:

```java
UserDetails loadUserByUsername(String username)
```

`DatabaseUserDetailsService` is the adapter between our database model and Spring Security.

```java
@Service
@RequiredArgsConstructor
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(
                "User not found with username: " + username
            ));

        return org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPassword())
            .authorities(toAuthorities(user))
            .accountExpired(!isTrue(user.getAccountNonExpired()))
            .accountLocked(!isTrue(user.getAccountNonLocked()))
            .credentialsExpired(!isTrue(user.getCredentialsNonExpired()))
            .disabled(!isTrue(user.getEnabled()) || user.getStatus() != UserStatus.ACTIVE)
            .build();
    }
}
```

This class is needed because Basic authentication needs to verify a submitted username/password. The DB-backed `UserDetailsService` gives Spring Security:

- username
- stored encoded password
- account status flags
- roles
- permissions

Then Spring Security performs password matching for us through `DaoAuthenticationProvider` and `PasswordEncoder`.

### How Roles And Permissions Are Loaded

The repository loads the user together with roles and permissions:

```java
@EntityGraph(attributePaths = {"roles", "roles.permissions"})
Optional<User> findByUsername(String username);
```

Then `DatabaseUserDetailsService` converts roles and permissions into Spring Security authorities:

```java
private Collection<GrantedAuthority> toAuthorities(User user) {
    Set<GrantedAuthority> authorities = new LinkedHashSet<>();

    user.getRoles().forEach(role -> {
        authorities.add(new SimpleGrantedAuthority(role.getRoleName()));
        role.getPermissions().forEach(permission ->
            authorities.add(new SimpleGrantedAuthority(permission.getPermissionName()))
        );
    });

    return authorities;
}
```

Example authorities:

```text
ROLE_ADMIN
ROLE_CUSTOMER
USER_READ
USER_WRITE
ORDER_CANCEL
```

Roles can be used with:

```java
@PreAuthorize("hasRole('ADMIN')")
```

Permissions can be used with:

```java
@PreAuthorize("hasAuthority('USER_READ')")
```

### Why JwtAuthenticationConverter Exists

The Basic authentication chain is only for login validation. After login, clients call normal APIs with JWT:

```http
Authorization: Bearer <jwt>
```

Spring Security can validate the JWT signature using the Auth Service JWKS endpoint. But it also needs to know where roles are stored in the JWT.

Our JWT stores roles in a custom `roles` claim:

```json
{
  "sub": "admin",
  "roles": "ROLE_ADMIN ROLE_CUSTOMER"
}
```

By default, Spring Security maps `scope` or `scp` claims into authorities like `SCOPE_read`. Since our token uses `roles`, we provide a converter:

```java
@Bean
public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
    converter.setAuthoritiesClaimName("roles");
    converter.setAuthorityPrefix("");

    JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
    jwtConverter.setJwtGrantedAuthoritiesConverter(converter);

    return jwtConverter;
}
```

`setAuthoritiesClaimName("roles")` tells Spring Security to read authorities from the `roles` claim.

`setAuthorityPrefix("")` tells Spring Security not to add another prefix because our roles already contain `ROLE_`.

Then this route rule works:

```java
.requestMatchers(ApiConstants.ROLES + "/**").hasRole("ADMIN")
```

`hasRole("ADMIN")` checks for the authority:

```text
ROLE_ADMIN
```

### JWT Signature, Expiry, And Issuer Validation

For normal User Service APIs, JWT validation happens before the request reaches the controller.

User Service validates:

| Check | Purpose |
| --- | --- |
| Signature | Confirms the JWT was signed by Auth Service. |
| Expiry | Rejects expired tokens using the `exp` claim. |
| Not-before time | Rejects tokens used before the `nbf` claim, if present. |
| Issuer | Confirms the `iss` claim matches the expected Auth Service issuer. |

The public key is loaded from Auth Service JWKS:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: ${JWK_SET_URI:http://localhost:8081/auth/.well-known/jwks.json}
```

The expected issuer is configured separately:

```yaml
security:
  jwt:
    issuer: ${JWT_ISSUER:shopverse-auth-service}
```

User Service uses a custom `JwtDecoder` bean:

```java
@Bean
public JwtDecoder jwtDecoder() {
    NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer(issuer)
    );

    jwtDecoder.setJwtValidator(validator);
    return jwtDecoder;
}
```

`JwtValidators.createDefaultWithIssuer(issuer)` includes Spring Security's default timestamp validators and also validates the `iss` claim.

That means this token is accepted only if:

- it is signed by the Auth Service private key
- it is not expired
- it is not used before its valid time
- its issuer is `shopverse-auth-service`

If any of these checks fail, Spring Security rejects the request before the controller method runs.

### Official References

- [Spring Security Architecture and SecurityFilterChain](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
- [Spring Security HTTP Basic Authentication](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/basic.html)
- [Spring Security UserDetailsService](https://docs.enterprise.spring.io/spring-security/reference/servlet/authentication/passwords/user-details-service.html)
- [Spring Security OAuth2 Resource Server JWT](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)

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

- Add Testcontainers integration tests for MySQL and Liquibase.
- Add mTLS or OAuth2 client credentials for internal Auth Service -> User Service authentication.
- Move cache/rate limit state to Redis for multi-instance deployments.
- Move secrets to Docker secrets or a secret manager before production.
