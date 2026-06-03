# Shopverse Auth Service

Auth Service authenticates users, issues asymmetric JWTs, and exposes JWKS public keys for resource services.

## Responsibilities

- Authenticate users by loading user details from `USER-SERVICE` through OpenFeign.
- Validate passwords with Spring Security password encoding.
- Issue JWT access tokens signed with an RSA private key.
- Expose public JWKS keys for resource-service JWT validation.
- Register with Eureka as `AUTH-SERVICE`.
- Emit centralized logs, metrics, and traces.

## Port

```text
8081
```

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/login` | Authenticate and return JWT |
| `GET` | `/auth/login` | Compatibility login endpoint |
| `GET` | `/auth/.well-known/jwks.json` | Public JWKS keys |
| `GET` | `/auth/verify` | Simple protected verification endpoint |
| `GET` | `/actuator/health` | Service health |
| `GET` | `/actuator/prometheus` | Prometheus metrics |

## Login Example

```powershell
curl.exe -X POST http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```

## Feign Client To User Service

Auth Service uses Spring Cloud OpenFeign to call User Service during login. This keeps Auth Service focused on authentication while User Service remains the source of user, role, permission, and password data.

Feign is enabled in `AuthServiceApplication` with:

```java
@EnableFeignClients
```

The actual client is declared as:

```java
@FeignClient(name = "USER-SERVICE")
public interface UserClient {
    @GetMapping("/api/v1/internal/users/username/{username}")
    User loadByUsername(@PathVariable String username);
}
```

Because the Feign client uses `name = "USER-SERVICE"`, Auth Service does not need a hardcoded User Service host and port. Spring Cloud uses Eureka service discovery and load balancing to resolve a running `USER-SERVICE` instance.

### Login Flow

1. Client calls `POST /auth/login`.
2. `AuthService` receives the username and password.
3. `AuthService` calls `UserServiceClient`.
4. `UserServiceClient` delegates to the OpenFeign `UserClient`.
5. `UserClient` calls User Service through `GET /api/v1/internal/users/username/{username}`.
6. Auth Service validates the password.
7. Auth Service signs and returns the JWT.

### Trace Propagation

Auth Service also has a Feign request interceptor in `FeignTracePropagationConfig`.

That interceptor reads the current `traceId` and `spanId` from MDC and forwards them to User Service using:

- W3C `traceparent`
- B3 headers: `X-B3-TraceId`, `X-B3-SpanId`, `X-B3-Sampled`

This helps Zipkin and Loki connect logs from Auth Service and User Service under the same distributed trace when a login request calls both services.

### How To Verify

Start the stack and follow both service logs:

```powershell
docker compose logs -f auth-service user-service
```

Call login:

```powershell
curl.exe -X POST http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```

In Loki, query both services together and filter by the trace id from the Auth Service log:

```logql
{application=~"AUTH-SERVICE|USER-SERVICE"} |= "trace-id-here"
```

## Spring Security And JWT

Auth Service currently works as a simple POC token issuer and OAuth2 Resource Server. It is not a full Spring Authorization Server yet.

What this means:

- `POST /auth/login` is a custom login API.
- Auth Service validates username/password by calling User Service through Feign.
- Auth Service signs a JWT with its RSA private key.
- Other services validate that JWT with the public key exposed through JWKS.
- `spring-boot-starter-oauth2-resource-server` is used for JWT validation, not for implementing all OAuth2 grant flows.

### Complete Security Flow

This is the full current Shopverse security flow from password storage to API authorization.

#### 1. Password Is Stored In User Service

When a user is created, password is changed, or password is reset, User Service hashes the raw password before saving it.

The important code path is:

```java
String encodedPassword = passwordEncoder.encode(request.password());
user.setPassword(encodedPassword);
```

The `PasswordEncoder` bean is created with:

```java
PasswordEncoderFactories.createDelegatingPasswordEncoder()
```

By default this creates a `DelegatingPasswordEncoder`. It stores passwords with an algorithm prefix, for example:

```text
{bcrypt}$2a$10$...
```

That prefix tells Spring Security which encoder should verify the password later. In our POC, the default encoding algorithm is BCrypt.

Important: passwords are not decoded. Password hashing is one-way. During login, Spring hashes/checks the submitted raw password against the stored hash.

#### 2. Login Request Reaches Auth Service

The client calls:

```http
POST /auth/login
```

Auth Service allows `/auth/**` without a token:

```java
.requestMatchers("/auth/**").permitAll()
```

That is why login and JWKS can be called before the user has a JWT.

#### 3. Auth Service Loads User Through Feign

`AuthService` calls `UserServiceClient`, which delegates to the Feign `UserClient`.

```java
User user = userService.loadByUsername(req.username());
```

Feign calls User Service:

```http
GET /api/v1/internal/users/username/{username}
```

User Service returns the user data, stored password hash, and roles.

#### 4. Auth Service Verifies Password

Auth Service does not decode the stored password. It asks Spring Security's `PasswordEncoder` to compare the raw password with the stored hash:

```java
boolean passwordMatches = passwordEncoder.matches(req.password(), user.password());
```

Behind the scenes:

1. `DelegatingPasswordEncoder` reads the password prefix, such as `{bcrypt}`.
2. It selects the matching encoder.
3. BCrypt checks whether the submitted password matches the stored hash.
4. If it matches, authentication continues.
5. If it does not match, Auth Service throws `BadCredentialsException`.

#### 5. Auth Service Builds JWT Claims

After successful password verification, `JwtService` creates claims:

```java
JwtClaimsSet claims = JwtClaimsSet.builder()
    .id(UUID.randomUUID().toString())
    .issuer(issuer)
    .issuedAt(Instant.now())
    .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
    .subject(user.username())
    .claim("roles", user.roles()
        .stream()
        .map(Role::roleName)
        .collect(Collectors.joining(" ")))
    .build();
```

In our POC:

- `sub` is the username.
- `iss` comes from centralized config: `security.jwt.issuer`.
- `exp` is one hour after token creation.
- `jti` is a unique token id.
- `roles` is a space-separated role list, for example `ROLE_ADMIN ROLE_USER`.

#### 6. JwtEncoder Signs The Token

Auth Service signs the token here:

```java
jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue()
```

The `JwtEncoder` bean is a `NimbusJwtEncoder`. It is configured with an RSA JWK containing:

- public key
- private key
- key id: `key-1`

The private key is used only by Auth Service to sign tokens.

#### 7. Auth Service Exposes JWKS

Auth Service exposes the public key here:

```http
GET /auth/.well-known/jwks.json
```

Only the public key is returned:

```java
new JWKSet(rsaKey.toPublicJWK())
```

Resource services use this public key to verify JWT signatures. They do not need the private key.

#### 8. Client Calls A Protected API

The client sends the token to API Gateway or directly to a service:

```http
Authorization: Bearer <jwt>
```

For example:

```http
GET /api/v1/orders
Authorization: Bearer eyJhbGciOiJSUzI1Ni...
```

#### 9. Spring Security Validates JWT In Resource Services

User, Order, Inventory, and Payment services are configured as OAuth2 resource servers.

They have:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://localhost:8081/auth/.well-known/jwks.json
```

They also enable JWT validation in `SecurityFilterChain`:

```java
.oauth2ResourceServer(oauth -> oauth.jwt(...))
```

Because of these two things, Spring Boot automatically creates a `JwtDecoder` bean. We do not manually call it in controllers.

Behind the scenes for every protected request:

1. `BearerTokenAuthenticationFilter` reads the bearer token from the `Authorization` header.
2. `JwtAuthenticationProvider` receives the token.
3. `JwtAuthenticationProvider` calls the auto-configured `JwtDecoder`.
4. `JwtDecoder` obtains the public key from Auth Service JWKS.
5. `JwtDecoder` verifies the JWT signature.
6. It checks token validity, including expiry.
7. Spring creates a `JwtAuthenticationToken`.
8. Spring stores it in `SecurityContext`.
9. Controller code runs only after the request is authenticated and authorized.

#### 10. Spring Extracts Roles

By default, Spring Security maps `scope` or `scp` claims into authorities like `SCOPE_read`.

Our POC uses a custom `roles` claim, so resource services define a `JwtAuthenticationConverter`:

```java
JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
converter.setAuthoritiesClaimName("roles");
converter.setAuthorityPrefix("");
```

Because Shopverse roles already include `ROLE_`, for example `ROLE_ADMIN`, we keep the prefix empty.

This turns:

```json
{
  "sub": "admin",
  "roles": "ROLE_ADMIN ROLE_USER"
}
```

into authorities:

```text
ROLE_ADMIN
ROLE_USER
```

Then route rules work:

```java
.requestMatchers("/api/v1/orders/admin/**").hasRole("ADMIN")
.requestMatchers("/api/v1/orders/**").hasAnyRole("USER", "ADMIN")
```

`hasRole("ADMIN")` checks for `ROLE_ADMIN` internally.

#### 11. Method Security Uses Same Authentication

Services that use `@EnableMethodSecurity` can also protect methods:

```java
@PreAuthorize("hasRole('ADMIN')")
```

Method security does not decode the JWT again. It reads the already authenticated `JwtAuthenticationToken` from `SecurityContext` and checks the authorities that were extracted during the filter-chain step.

#### 12. What Spring Does By Default For Us

Spring Boot and Spring Security handle a lot of background wiring:

| Spring Feature | What It Does For Us |
| --- | --- |
| `spring-boot-starter-security` | Adds Spring Security filters and default security infrastructure. |
| `SecurityFilterChain` bean | Replaces old `WebSecurityConfigurerAdapter` style and defines API security rules. |
| `PasswordEncoderFactories.createDelegatingPasswordEncoder()` | Creates a password encoder that supports `{bcrypt}` and other algorithm prefixes. |
| `spring-boot-starter-oauth2-resource-server` | Adds JWT bearer-token authentication support. |
| `jwk-set-uri` property | Lets Boot auto-create a Nimbus `JwtDecoder` for resource services. |
| `oauth2ResourceServer().jwt()` | Adds bearer-token JWT validation into the filter chain. |
| `BearerTokenAuthenticationFilter` | Extracts `Authorization: Bearer <token>` automatically. |
| `JwtAuthenticationProvider` | Authenticates the JWT using `JwtDecoder`. |
| `SecurityContext` | Stores authenticated user information for the current request. |
| `@EnableMethodSecurity` | Enables annotations like `@PreAuthorize`. |

#### 13. What We Wrote Ourselves

Shopverse-specific security code is intentionally small:

| Custom Code | Why We Added It |
| --- | --- |
| `AuthService` | Custom login flow for the POC. |
| `UserClient` / `UserServiceClient` | Load user data from User Service through Feign. |
| `JwtService` | Build Shopverse JWT claims and issue tokens. |
| `JwtConfig` | Configure RSA key, `JwtEncoder`, `JwtDecoder`, and JWKS key object. |
| `AuthController.keys()` | Expose public JWKS for other services. |
| Resource-service `JwtAuthenticationConverter` | Read roles from our custom `roles` claim. |
| Resource-service authorization rules | Protect APIs by role. |

### OAuth2 Grant Types

OAuth2 defines different ways for a client to obtain an access token.

| Grant Type | Use Case | POC Status |
| --- | --- | --- |
| Authorization Code + PKCE | Browser/mobile login through an authorization server. Best practice for real user login. | Not implemented. |
| Client Credentials | Service-to-service authentication without an end user. | Not implemented. |
| Refresh Token | Get a new access token without asking the user to login again. | Not implemented in Auth Service yet. |
| Password Grant | Client directly sends username/password to token endpoint. Legacy flow, generally avoided for new systems. | Similar idea to our custom `/auth/login`, but not a formal OAuth2 password grant implementation. |
| Device Code | Login for TVs, CLI tools, and limited-input devices. | Not implemented. |

If Shopverse becomes a production-grade OAuth2 system, prefer Spring Authorization Server with Authorization Code + PKCE for users and Client Credentials for internal service-to-service calls.

### Authentication Providers

Spring Security supports multiple authentication providers. Each provider knows how to authenticate one style of credential.

Common provider examples:

- `DaoAuthenticationProvider`: loads a user through `UserDetailsService` and validates the password with `PasswordEncoder`.
- `JwtAuthenticationProvider`: validates bearer JWTs for resource server requests.
- `OAuth2LoginAuthenticationProvider`: handles OAuth2 login with external identity providers.
- Custom provider: useful for OTP, LDAP, API key, or domain-specific authentication.

In this POC, login is handled manually inside `AuthService`:

```java
User user = userService.loadByUsername(req.username());
boolean passwordMatches = passwordEncoder.matches(req.password(), user.password());
return jwtService.generateToken(user);
```

For a more standard Spring Security login flow, we could introduce a `UserDetailsService`, a `DaoAuthenticationProvider`, and an `AuthenticationManager`. The current code keeps the flow explicit and simple for the microservices POC.

### Security Filter Chain

`SecurityFilterChain` defines how HTTP requests are secured.

Current Auth Service behavior:

```java
http.csrf(AbstractHttpConfigurer::disable)
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/**").permitAll()
        .requestMatchers("/auth/**").permitAll()
        .anyRequest().authenticated())
    .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

What each part does:

| Configuration | Meaning |
| --- | --- |
| `csrf(...disable)` | Disables CSRF protection because this API is stateless and does not use browser sessions. |
| `/actuator/** permitAll` | Allows health and metrics endpoints. |
| `/auth/** permitAll` | Allows login and JWKS endpoints without a token. |
| `anyRequest().authenticated()` | Requires authentication for all other endpoints. |
| `oauth2ResourceServer(...jwt...)` | Enables bearer-token JWT validation. |
| `SessionCreationPolicy.STATELESS` | Spring Security does not create HTTP sessions. Every request must carry its own token. |

Internally, a bearer request goes through Spring Security filters. The important path is:

1. Request enters the servlet filter chain.
2. `BearerTokenAuthenticationFilter` looks for `Authorization: Bearer <token>`.
3. The token is passed to `AuthenticationManager`.
4. `JwtAuthenticationProvider` uses `JwtDecoder`.
5. `JwtDecoder` verifies the signature, expiry, issuer, and token structure.
6. Spring creates a `JwtAuthenticationToken`.
7. The authenticated principal and authorities are stored in `SecurityContext`.
8. Controllers and method security can use the authenticated user.

### UserDetailsService And User Service

`UserDetailsService` is a Spring Security interface used by username/password authentication.

Typical flow:

```java
UserDetails loadUserByUsername(String username)
```

The returned `UserDetails` contains username, password, account status, and authorities. A `DaoAuthenticationProvider` then compares the raw password with the stored encoded password using `PasswordEncoder`.

In this Auth Service, we do not currently expose a `UserDetailsService` bean. Instead:

- `UserServiceClient` is our domain service wrapper.
- `UserClient` is the Feign client that calls `USER-SERVICE`.
- `AuthService` manually validates the password.
- `JwtService` creates the token after successful authentication.

This keeps the POC small while still showing how Auth Service and User Service communicate in a microservice architecture.

### Asymmetric JWT

JWT means JSON Web Token. It is a signed token that contains claims about the authenticated user.

Shopverse uses asymmetric JWT signing:

- Auth Service signs tokens with an RSA private key.
- Resource services validate tokens with the RSA public key.
- The private key is never needed by User, Order, Inventory, Payment, or API Gateway.

This is safer than sharing one symmetric secret across every service. If a resource service is compromised, it can validate tokens but cannot create valid new tokens.

### JWT Structure

A JWT has three Base64URL-encoded parts:

```text
header.payload.signature
```

| Part | Contains | Example Fields |
| --- | --- | --- |
| Header | Token metadata | `alg`, `typ`, `kid` |
| Payload | Claims | `sub`, `iss`, `iat`, `exp`, `jti`, `roles` |
| Signature | Cryptographic signature | Signed with Auth Service private key |

Shopverse token claims are created in `JwtService`:

```java
JwtClaimsSet claims = JwtClaimsSet.builder()
    .id(UUID.randomUUID().toString())
    .issuer(issuer)
    .issuedAt(Instant.now())
    .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
    .subject(user.username())
    .claim("roles", user.roles()
        .stream()
        .map(Role::roleName)
        .collect(Collectors.joining(" ")))
    .build();
```

The final token is signed here:

```java
jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue()
```

### JwtEncoder And JwtDecoder

`JwtEncoder` creates and signs JWTs.

In `JwtConfig`, Auth Service builds an RSA JWK using the public and private key:

```java
JWK jwk = new RSAKey.Builder(rsaKeys.publicKey())
    .privateKey(rsaKeys.privateKey())
    .keyID("key-1")
    .build();

return new NimbusJwtEncoder(jwks);
```

When `JwtService` calls `jwtEncoder.encode(...)`, Nimbus uses the private key to create the signature.

`JwtDecoder` validates JWTs.

In Auth Service:

```java
return NimbusJwtDecoder
    .withPublicKey(rsaKeys.publicKey())
    .build();
```

In other services, Spring Security can use the JWKS endpoint:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://localhost:8081/auth/.well-known/jwks.json
```

The decoder uses the public key to verify that:

- the token was signed by Auth Service
- the token has not expired
- the token has not been modified
- the token can be converted into an authenticated Spring Security principal

### JWKS

JWKS means JSON Web Key Set. It is a public JSON document containing public keys that other services use to verify JWT signatures.

Auth Service exposes:

```text
GET /auth/.well-known/jwks.json
```

The controller returns only the public part of the RSA key:

```java
JWKSet jwkSet = new JWKSet(rsaKey.toPublicJWK());
return jwkSet.toJSONObject();
```

Resource services call this endpoint through their `jwk-set-uri` configuration. They cache and use the public key to validate bearer tokens without calling Auth Service for every request.

### Roles And Method Security

Method security lets us protect service or controller methods with annotations such as:

```java
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> adminOnlyApi() {
    ...
}
```

To enable it, add:

```java
@EnableMethodSecurity
```

Spring Security method security uses the current `Authentication` from `SecurityContext`. For JWT requests, that authentication is usually a `JwtAuthenticationToken`.

Important role detail:

- `hasRole('ADMIN')` checks for authority `ROLE_ADMIN`.
- `hasAuthority('USER_READ')` checks for exact authority `USER_READ`.
- Spring's default JWT converter usually maps `scope` or `scp` claims into authorities like `SCOPE_read`.
- Our POC writes roles into a custom `roles` claim.
- Shopverse role names are stored with the `ROLE_` prefix, for example `ROLE_ADMIN`.

To make method security read the custom `roles` claim, add a JWT authority converter:

```java
@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter rolesConverter = new JwtGrantedAuthoritiesConverter();
    rolesConverter.setAuthoritiesClaimName("roles");
    rolesConverter.setAuthorityPrefix("");

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(rolesConverter);
    return converter;
}
```

Then register it in the filter chain:

```java
.oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
    jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
))
```

With that converter, a JWT claim like:

```json
{
  "sub": "admin",
  "roles": "ROLE_ADMIN ROLE_USER"
}
```

becomes Spring Security authorities:

```text
ROLE_ADMIN
ROLE_USER
```

Then these checks work:

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
```

For permission-style checks, store permissions in a separate claim such as `permissions` and map them without the `ROLE_` prefix. Then use:

```java
@PreAuthorize("hasAuthority('USER_READ')")
```

Current POC tokens include roles, not a separate permissions claim. Permissions are stored in User Service and can be added to the JWT later if we want permission-level method security.

### Important Spring Security Classes

| Class / Interface | Responsibility |
| --- | --- |
| `SecurityFilterChain` | Defines request authorization, JWT resource server setup, CSRF, and session policy. |
| `Authentication` | Represents the current authenticated principal. |
| `SecurityContext` | Holds the current `Authentication` for the request. |
| `AuthenticationManager` | Delegates authentication to one or more providers. |
| `AuthenticationProvider` | Authenticates a specific credential type. |
| `JwtAuthenticationProvider` | Validates JWT bearer tokens using `JwtDecoder`. |
| `JwtDecoder` | Parses and validates incoming JWTs. |
| `JwtEncoder` | Creates and signs JWTs. |
| `PasswordEncoder` | Verifies raw passwords against encoded hashes. |
| `UserDetailsService` | Loads user data for username/password authentication. |
| `GrantedAuthority` | Represents a role or permission used by authorization checks. |
| `JwtAuthenticationConverter` | Converts JWT claims into Spring Security authorities. |

## Docker

From the root project:

```powershell
docker compose build auth-service
docker compose up -d auth-service
docker compose logs -f auth-service
```

The full stack is started from the root:

```powershell
docker compose up -d
```

More Docker commands, flags, and Dockerfile details are in [../docker/README.md](../docker/README.md).

## Observability

- Logs are written to `/app/logs/auth-service.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Custom request counter: `shopverse_service_requests_logged_total{service="AUTH-SERVICE"}`.
- Zipkin receives request spans.
- Grafana Loki query:

```logql
{application="AUTH-SERVICE"}
```

## Security Notes

- RSA private/public keys are currently bundled for POC use.
- Replace bundled keys with mounted secrets or a secrets manager before production.
- Avoid logging passwords, tokens, private keys, or full authorization headers.
