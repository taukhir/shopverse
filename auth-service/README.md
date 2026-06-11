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
| `GET` | `/auth/.well-known/jwks.json` | Public JWKS keys |
| `GET` | `/actuator/health` | Service health |
| `GET` | `/actuator/prometheus` | Prometheus metrics |

## Login Example

```powershell
curl.exe -X POST http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```

Response:

```json
{
  "token": "<signed-jwt>"
}
```

The token contains issuer, subject, issued/expiry timestamps, roles, and
permissions. Passwords are used only for credential validation and are never
placed in the JWT or application logs.

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
    @GetMapping("/api/v1/internal/users/authenticated")
    User loadAuthenticatedUser(@RequestHeader("Authorization") String authorization);
}
```

Because the Feign client uses `name = "USER-SERVICE"`, Auth Service does not need a hardcoded User Service host and port. Spring Cloud uses Eureka service discovery and load balancing to resolve a running `USER-SERVICE` instance.

### Why Auth Service Calls A Basic-Protected User Service API

During login, Auth Service receives:

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Auth Service does not directly query the User Service database and does not manually compare the submitted password with the stored password hash.

Instead, Auth Service delegates credential validation to User Service:

```java
User user = userService.authenticate(req.username(), req.password());
```

`UserServiceClient` builds the Basic auth header:

```java
String credentials = username + ":" + password;
String encodedCredentials = Base64.getEncoder()
    .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

return "Basic " + encodedCredentials;
```

Then OpenFeign calls:

```http
GET /api/v1/internal/users/authenticated
Authorization: Basic base64(username:password)
```

User Service validates the Basic credentials using its DB-backed `UserDetailsService`, `DaoAuthenticationProvider`, and `DelegatingPasswordEncoder`. If credentials are valid, User Service returns user details and roles without returning the password hash. Auth Service then signs the JWT.

This keeps ownership clear:

| Service | Security Responsibility |
| --- | --- |
| User Service | Owns user records, encoded passwords, roles, permissions, and credential validation. |
| Auth Service | Receives login requests, delegates credential validation, builds JWT claims, signs JWTs, and exposes JWKS. |
| Resource Services | Validate JWT bearer tokens and enforce role/permission rules. |

### Login Flow

1. Client calls `POST /auth/login`.
2. `AuthService` receives the username and password.
3. `UserServiceClient` builds a Basic auth header from the submitted username/password.
4. `UserClient` calls User Service through `GET /api/v1/internal/users/authenticated`.
5. User Service validates the Basic credentials against its database.
6. User Service returns authenticated user details and roles without returning the password hash.
7. Auth Service signs and returns the JWT.

### Trace Propagation

Auth Service includes `feign-micrometer`. Spring Cloud OpenFeign therefore integrates the client call with Micrometer Observation and the configured tracing bridge. The tracing stack creates a Feign client span and propagates standard trace context to User Service without a custom MDC/header interceptor.

This keeps Zipkin spans and Loki logs connected under the same trace while avoiding manual `traceparent` and B3 header construction.

### Feign Trace And Span Propagation

When Auth Service calls User Service through Feign, we want both services to be visible under the same distributed trace.

Spring/Micrometer puts trace values into SLF4J MDC for the current request:

```text
traceId=<current-trace-id>
spanId=<current-span-id>
```

OpenFeign's Micrometer capability creates the client observation and delegates propagation to the configured tracing bridge.

W3C Trace Context header:

```http
traceparent: 00-<traceId>-<spanId>-01
```

B3 headers:

```http
X-B3-TraceId: <traceId>
X-B3-SpanId: <spanId>
X-B3-Sampled: 1
```

Example:

```http
traceparent: 00-6a1e660de4db49fe47911954296ecce5-1ee04f11149f6bee-01
X-B3-TraceId: 6a1e660de4db49fe47911954296ecce5
X-B3-SpanId: 1ee04f11149f6bee
X-B3-Sampled: 1
```

Internal flow:

1. Client calls `POST /auth/login`.
2. Auth Service receives the request and tracing creates or continues a trace.
3. Auth Service logs include `[AUTH-SERVICE,<traceId>,<spanId>]`.
4. Auth Service calls User Service through Feign.
5. The Feign interceptor copies the trace context into HTTP headers.
6. User Service receives those headers and continues the same trace.
7. User Service logs include the same `traceId` with its own span id.
8. Zipkin shows one distributed trace across Auth Service and User Service.
9. Loki can query both services by the same `traceId`.

The trace id represents the whole request journey. The span id represents one operation inside that journey. Auth Service and User Service should share the same trace id but usually have different span ids.

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

### Are We Using JWT Or OAuth2?

Shopverse uses **JWT tokens** for API authentication and authorization.

Shopverse also uses Spring Security's **OAuth2 Resource Server** support to validate those JWT bearer tokens in services.

So the precise answer is:

```text
Token format: JWT
Token usage: Bearer token
Spring module used to validate tokens: OAuth2 Resource Server
Full OAuth2 Authorization Server: Not implemented
OAuth2 grant flows: Not implemented
```

In practical terms:

| Area | What Shopverse Uses |
| --- | --- |
| Login endpoint | Custom `POST /auth/login` in Auth Service |
| Credential validation | Auth Service sends Basic credentials to User Service; User Service validates against DB |
| Issued token | JWT access token |
| Token signing | RSA private key in Auth Service |
| Token validation | Public key from Auth Service JWKS |
| Resource service security | Spring Security OAuth2 Resource Server JWT validation |
| OAuth2 Authorization Server | Not used |
| Authorization Code / PKCE | Not used |
| Client Credentials grant | Not used |
| Refresh token flow | Not implemented yet |

Why the dependency name says OAuth2:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
```

This starter does not mean we implemented full OAuth2 login. It gives our services the standard Spring Security machinery for:

- reading `Authorization: Bearer <jwt>`
- decoding JWTs
- validating JWT signature and expiry
- loading public keys from JWKS
- creating `JwtAuthenticationToken`
- applying role/authority checks

The current flow is:

```text
Client -> Auth Service /auth/login
Auth Service -> User Service /api/v1/internal/users/authenticated using Basic auth
User Service -> validates username/password against DB
Auth Service -> creates and signs JWT
Client -> calls APIs with Authorization: Bearer <jwt>
Resource services -> validate JWT using OAuth2 Resource Server support
```

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
User user = userService.authenticate(req.username(), req.password());
```

Feign calls User Service with HTTP Basic credentials:

```http
GET /api/v1/internal/users/authenticated
Authorization: Basic base64(username:password)
```

User Service validates the username/password against its database and returns the authenticated user data and roles. The password hash stays inside User Service.

#### 4. User Service Verifies Password

Auth Service no longer verifies the password itself in this flow. User Service verifies the password through Spring Security HTTP Basic authentication.

```java
User user = userService.authenticate(req.username(), req.password());
```

Behind the scenes:

1. Auth Service sends `Authorization: Basic base64(username:password)` to User Service.
2. User Service's Basic authentication filter extracts the credentials.
3. `DaoAuthenticationProvider` calls the DB-backed `UserDetailsService`.
4. `UserDetailsService` loads the user, password hash, roles, and permissions from the User Service database.
5. `DelegatingPasswordEncoder` reads the password prefix, such as `{bcrypt}`.
6. BCrypt checks whether the submitted password matches the stored hash.
7. If credentials are valid, User Service controller returns authenticated user details.
8. If credentials are invalid, User Service returns `401`, and Auth Service converts that to `BadCredentialsException`.

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
- `roles` is a space-separated role list, for example `ROLE_ADMIN ROLE_CUSTOMER`.

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
  "roles": "ROLE_ADMIN ROLE_CUSTOMER"
}
```

into authorities:

```text
ROLE_ADMIN
ROLE_CUSTOMER
```

Then route rules work:

```java
.requestMatchers("/api/v1/orders/admin/**").hasRole("ADMIN")
.requestMatchers("/api/v1/orders/**").hasAnyRole("CUSTOMER", "ADMIN")
```

`hasRole("ADMIN")` checks for `ROLE_ADMIN` internally.

Role names are aligned across User Service seed data, JWT claims, and resource-service rules: customer APIs accept `ROLE_CUSTOMER`, and administrator APIs accept `ROLE_ADMIN`.

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
| `UserClient` / `UserServiceClient` | Send Basic credentials to User Service and receive authenticated user details through Feign. |
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

In this POC, Auth Service delegates username/password verification to User Service through Basic-authenticated Feign:

```java
User user = userService.authenticate(req.username(), req.password());
return jwtService.generateToken(user);
```

User Service uses a DB-backed `UserDetailsService`, `DaoAuthenticationProvider`, and `PasswordEncoder` to validate those Basic credentials. Auth Service stays responsible for issuing the JWT after User Service confirms the credentials.

### Form Login Authentication

Form login is the traditional Spring Security browser-login flow.

Typical behavior:

1. User opens a protected page.
2. Spring redirects the browser to a login page.
3. User submits username and password through an HTML form.
4. Spring authenticates the user.
5. Spring creates an HTTP session.
6. Browser stores a session cookie such as `JSESSIONID`.
7. Later requests use the session cookie instead of sending username/password again.

Example configuration:

```java
http
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/login", "/css/**").permitAll()
        .anyRequest().authenticated()
    )
    .formLogin(Customizer.withDefaults());
```

Form login is useful for server-rendered web apps. For Shopverse microservices, we use stateless JWT authentication instead because APIs are called by clients, API Gateway, and other services.

### In-Memory Users

In-memory authentication is useful for demos, tests, local admin tools, and quick POCs.

Example:

```java
@Bean
UserDetailsService users() {
    UserDetails admin = User.withUsername("admin")
        .password(passwordEncoder().encode("Admin@123"))
        .roles("ADMIN")
        .build();

    return new InMemoryUserDetailsManager(admin);
}
```

How it works:

1. `InMemoryUserDetailsManager` stores users in application memory.
2. `DaoAuthenticationProvider` calls `loadUserByUsername(...)`.
3. Spring gets the stored password hash and authorities.
4. `PasswordEncoder.matches(...)` validates the submitted password.
5. If valid, Spring creates an authenticated `Authentication`.

Limitations:

- users disappear when the application restarts unless hardcoded/configured again
- no central user lifecycle
- not suitable for production user management
- hard to audit password changes, account locks, and role changes

### DB-Backed Users

For production-style authentication, users should come from a database or identity provider.

Typical DB-backed Spring Security flow:

```java
@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(username));

        return org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPassword())
            .authorities(toAuthorities(user))
            .accountLocked(!user.isAccountNonLocked())
            .disabled(!user.isEnabled())
            .build();
    }
}
```

Then Spring uses:

- `UserDetailsService` to load the user
- `PasswordEncoder` to verify the password
- `GrantedAuthority` values for roles and permissions
- `AuthenticationManager` and `DaoAuthenticationProvider` to coordinate the login

In Shopverse, User Service already stores users, encoded passwords, roles, and permissions. Auth Service currently loads those through Feign instead of directly querying the DB. That is a good microservices boundary because Auth Service does not need direct access to the User Service database.

### Loading Roles And Permissions From DB

When authenticating from DB, roles and permissions usually come from relationships like:

```text
users -> user_roles -> roles -> role_permissions -> permissions
```

A user may have:

```text
ROLE_ADMIN
ROLE_CUSTOMER
```

And permissions such as:

```text
USER_READ
USER_WRITE
ORDER_CANCEL
```

Convert both into Spring Security authorities:

```java
private Collection<GrantedAuthority> toAuthorities(User user) {
    List<GrantedAuthority> authorities = new ArrayList<>();

    user.getRoles().forEach(role -> {
        authorities.add(new SimpleGrantedAuthority(role.getRoleName()));
        role.getPermissions().forEach(permission ->
            authorities.add(new SimpleGrantedAuthority(permission.getPermissionName()))
        );
    });

    return authorities;
}
```

Then method security can use both role checks and permission checks:

```java
@PreAuthorize("hasRole('ADMIN')")
public void adminOnlyAction() {}

@PreAuthorize("hasAuthority('ORDER_CANCEL')")
public void cancelOrder() {}
```

For JWT-based microservices, there are two common options:

| Option | How It Works | Tradeoff |
| --- | --- | --- |
| Put roles/permissions in JWT | Auth Service loads roles/permissions during login and writes them into JWT claims. | Fast authorization, but permission changes apply only after a new token is issued. |
| Load permissions at resource service | Resource service validates JWT, then calls User/Auth service for current permissions. | Always fresh permissions, but more network calls and tighter service coupling. |

For this POC, we include roles in the JWT. Permissions are still stored in User Service and can be added later as a `permissions` claim if we want permission-level authorization across services.

### Security Filter Chain

`SecurityFilterChain` defines how HTTP requests are secured.

Current Auth Service behavior:

```java
http.csrf(AbstractHttpConfigurer::disable)
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health", "/actuator/health/**",
                "/actuator/info", "/actuator/prometheus").permitAll()
        .requestMatchers("/auth/**").permitAll()
        .anyRequest().authenticated())
    .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

What each part does:

| Configuration | Meaning |
| --- | --- |
| `csrf(...disable)` | Disables CSRF protection because this API is stateless and does not use browser sessions. |
| Selected actuator endpoints | Allows health, info, and Prometheus metrics without exposing administrative actuator operations. |
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
- `AuthService` sends submitted credentials to User Service using internal HTTP Basic.
- User Service owns the DB-backed `UserDetailsService` and password verification.
- `JwtService` creates the token after User Service confirms the credentials.

This keeps Auth Service responsible for token issuing while User Service remains the owner of user records, password hashes, roles, and permissions.

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
  "roles": "ROLE_ADMIN ROLE_CUSTOMER"
}
```

becomes Spring Security authorities:

```text
ROLE_ADMIN
ROLE_CUSTOMER
```

Then these checks work:

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
```

For permission-style checks, store permissions in a separate claim such as `permissions` and map them without the `ROLE_` prefix. Then use:

```java
@PreAuthorize("hasAuthority('USER_READ')")
```

Current POC tokens include roles, not a separate permissions claim. Permissions are stored in User Service and can be added to the JWT later if we want permission-level method security.

### Scope Vs Role In JWT

Spring Security treats scopes and roles as authorities, but it maps them differently by default.

#### Scope Claims

OAuth2 access tokens often contain scopes:

```json
{
  "sub": "admin",
  "scope": "openid profile order.read order.write"
}
```

or:

```json
{
  "sub": "admin",
  "scp": ["order.read", "order.write"]
}
```

By default, Spring's JWT authority converter reads `scope` or `scp` and prefixes each value with `SCOPE_`.

That means:

```text
order.read
```

becomes:

```text
SCOPE_order.read
```

Then authorization checks look like:

```java
@PreAuthorize("hasAuthority('SCOPE_order.read')")
```

or in the filter chain:

```java
.requestMatchers(HttpMethod.GET, "/api/v1/orders/**").hasAuthority("SCOPE_order.read")
```

Scopes are useful for OAuth2-style API permissions.

#### Role Claims

Roles usually represent who the user is in the system:

```json
{
  "sub": "admin",
  "roles": "ROLE_ADMIN ROLE_CUSTOMER"
}
```

In Spring Security:

```java
hasRole("ADMIN")
```

is a shortcut for:

```java
hasAuthority("ROLE_ADMIN")
```

So `hasRole("ADMIN")` expects the final authority to be `ROLE_ADMIN`.

#### Why Spring Adds `ROLE_`

Spring Security has historically treated roles as a special kind of authority with a `ROLE_` prefix.

These two checks are equivalent:

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
```

This check is different:

```java
@PreAuthorize("hasAuthority('ADMIN')")
```

It only works if the authority is exactly `ADMIN`.

### Bypassing Or Controlling The `ROLE_` Prefix

There are three common approaches.

#### Option 1: Store Roles With `ROLE_` And Use Empty Converter Prefix

This is what Shopverse currently does.

JWT claim:

```json
{
  "roles": "ROLE_ADMIN ROLE_CUSTOMER"
}
```

Converter:

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

Usage:

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
```

This works because the JWT already contains `ROLE_ADMIN`.

#### Option 2: Store Roles Without `ROLE_` And Add Prefix During Conversion

JWT claim:

```json
{
  "roles": "ADMIN CUSTOMER"
}
```

Converter:

```java
@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter rolesConverter = new JwtGrantedAuthoritiesConverter();
    rolesConverter.setAuthoritiesClaimName("roles");
    rolesConverter.setAuthorityPrefix("ROLE_");

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(rolesConverter);
    return converter;
}
```

Usage:

```java
@PreAuthorize("hasRole('ADMIN')")
```

This works because Spring converts `ADMIN` from the token into `ROLE_ADMIN`.

#### Option 3: Avoid `hasRole` And Use Exact Authorities

If we do not want Spring's role shortcut behavior, use `hasAuthority(...)`.

JWT claim:

```json
{
  "roles": "ADMIN CUSTOMER"
}
```

Converter:

```java
rolesConverter.setAuthoritiesClaimName("roles");
rolesConverter.setAuthorityPrefix("");
```

Usage:

```java
@PreAuthorize("hasAuthority('ADMIN')")
```

This bypasses Spring's `ROLE_` role convention because we are checking the exact authority string.

#### Optional: Change The Global Role Prefix

Spring also allows changing the global role prefix:

```java
@Bean
GrantedAuthorityDefaults grantedAuthorityDefaults() {
    return new GrantedAuthorityDefaults("");
}
```

With this, `hasRole("ADMIN")` no longer adds `ROLE_`.

Use this carefully. It affects role checks globally and can confuse teams if some services use default Spring behavior and others remove the prefix.

Recommended Shopverse POC rule:

- keep DB roles as `ROLE_ADMIN`, `ROLE_CUSTOMER`
- keep JWT roles as `ROLE_ADMIN ROLE_CUSTOMER`
- use `setAuthorityPrefix("")`
- use `hasRole("ADMIN")` or `hasAuthority("ROLE_ADMIN")`
- keep role names consistent across User Service seed data, JWT claims, and resource-service rules

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

### Official References

- [Spring Security Architecture and SecurityFilterChain](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
- [Spring Security HTTP Basic Authentication](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/basic.html)
- [Spring Security UserDetailsService](https://docs.enterprise.spring.io/spring-security/reference/servlet/authentication/passwords/user-details-service.html)
- [Spring Security OAuth2 Resource Server JWT](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)

## Security Concepts

### Access Tokens

An access token is a short-lived credential used to call protected APIs.

In Shopverse:

- access token format is JWT
- token is sent as `Authorization: Bearer <token>`
- resource services validate it using JWKS
- token currently expires after one hour

Access tokens should be short-lived because they are bearer credentials. Whoever has the token can use it until it expires.

### Refresh Tokens

A refresh token is a longer-lived credential used to get a new access token.

Typical flow:

1. User logs in.
2. Auth Service returns access token and refresh token.
3. Client calls APIs with the access token.
4. When the access token expires, client sends refresh token to Auth Service.
5. Auth Service validates refresh token and issues a new access token.

Refresh tokens should be stored securely, rotated after use, revocable, and persisted server-side as hashed values.

Current POC status: refresh-token flow is not implemented in Auth Service yet.

### Sessions And Cookies

A session is server-side login state. A cookie is browser-side storage that carries a session id or token.

Classic Spring form login uses:

```text
JSESSIONID cookie -> server-side session
```

JWT APIs usually avoid server sessions:

```text
Authorization: Bearer <jwt> -> stateless validation
```

Cookies can also store JWTs, but then CSRF protection becomes important because browsers automatically send cookies.

### JWT

JWT is a signed token with:

```text
header.payload.signature
```

JWTs are useful because resource services can validate them without calling Auth Service for every request. They must be protected carefully because a stolen JWT can be used as a bearer token.

### OAuth2

OAuth2 is an authorization framework for issuing and using access tokens.

Common actors:

- Resource Owner: the user
- Client: frontend/mobile/backend client
- Authorization Server: issues tokens
- Resource Server: validates tokens and protects APIs

Current POC: Auth Service behaves like a simple custom token issuer and resource server. For production OAuth2, use Spring Authorization Server.

### API Keys

An API key is a static credential used by clients or services.

API keys are simple but risky:

- often long-lived
- easy to leak
- usually do not represent a user
- need rotation, rate limits, scopes, and audit logs

For internal service-to-service auth, prefer mTLS or OAuth2 Client Credentials over raw API keys.

### Other Credentials

| Credential Type | Typical Use |
| --- | --- |
| Basic Auth | Simple username/password over HTTPS. Avoid for modern APIs unless very controlled. |
| mTLS certificate | Strong service-to-service authentication. |
| Signed request/HMAC | Protects request integrity for webhooks or partner APIs. |
| One-time token | Password reset, email verification, MFA challenge. |
| Personal access token | User-generated long-lived token for developer/API access. |

## Microservices Security Principles

Security in microservices should be layered. Do not rely on only one control.

### API Security

- Put APIs behind API Gateway.
- Validate JWTs in each service, not only at the gateway.
- Use HTTPS everywhere outside local development.
- Use clear public, internal, user, and admin routes.
- Apply least privilege with roles and permissions.
- Validate request bodies with Bean Validation.
- Never log passwords, tokens, private keys, or full authorization headers.
- Use rate limiting and bulkheads for sensitive endpoints.
- Return consistent error responses without leaking internal details.

### Service-To-Service Security

- Prefer service discovery plus internal network isolation.
- Use mTLS for strong service identity in production.
- Use OAuth2 Client Credentials for service-to-service authorization.
- Do not trust a request only because it came from inside the network.
- Propagate trace ids, but do not treat trace ids as authentication.
- Avoid sharing one static API key across many services.

### Database Security

- Use parameterized queries, JPA repositories, or Criteria APIs to reduce SQL injection risk.
- Never concatenate untrusted input into SQL.
- Use least-privilege DB users per service.
- Keep each service database private to that service.
- Encrypt sensitive data at rest where required.
- Back up databases and test restore procedures.
- Store password hashes, never raw passwords.
- Use migration tools such as Liquibase for controlled schema changes.

### SQL Injection Protection

SQL injection happens when user input becomes executable SQL.

Good patterns:

```java
userRepository.findByUsername(username)
```

or:

```java
criteriaBuilder.equal(root.get("username"), username)
```

Risky pattern:

```java
"select * from users where username = '" + username + "'"
```

Spring Data JPA and prepared statements help, but input validation and safe query construction are still required.

### DDoS And Bot Protection

- Apply rate limits at API Gateway.
- Apply per-service rate limits for sensitive APIs.
- Use CAPTCHA or step-up verification for public login/register flows if abuse appears.
- Block suspicious IPs or clients at gateway/WAF level.
- Use request size limits and timeouts.
- Add account lockout or progressive delays after repeated failed login attempts.
- Monitor login failures, high traffic, and abnormal user behavior.

### JWT Attack Protection

- Use asymmetric signing such as RS256.
- Keep private keys secret and outside source control in production.
- Validate signature, expiry, issuer, and audience.
- Use short-lived access tokens.
- Rotate signing keys and publish new keys through JWKS.
- Use `kid` to identify active keys.
- Reject tokens with unexpected algorithms.
- Do not accept unsigned tokens.
- Do not store sensitive secrets in JWT payload because payload can be decoded by clients.
- Re-issue tokens after role/permission changes when immediate enforcement is needed.

### Secrets Management

- Do not commit production secrets.
- Use Docker secrets, Kubernetes secrets, Vault, AWS Secrets Manager, Azure Key Vault, or similar tools.
- Rotate DB passwords, API keys, and signing keys.
- Give each service only the secrets it needs.
- Avoid printing secrets in logs, stack traces, or CI/CD output.

### CSRF

CSRF mainly affects browser apps that use cookies automatically.

For stateless bearer-token APIs:

- CSRF is commonly disabled.
- Clients send tokens explicitly in `Authorization` headers.

For cookie-based login:

- keep CSRF protection enabled
- use `SameSite=Lax` or `SameSite=Strict`
- require CSRF tokens for state-changing requests

### CORS

CORS controls which browser origins can call APIs.

Best practices:

- Allow only known frontend origins.
- Avoid `allowedOrigins("*")` with credentials.
- Limit allowed methods and headers.
- Keep CORS config environment-specific.

### JavaScript And Browser Attacks

Main browser risks:

- XSS: attacker runs JavaScript in the user's browser.
- CSRF: attacker makes the browser send unwanted cookie-authenticated requests.
- Token theft: attacker steals tokens from local storage or exposed JS state.

Mitigations:

- sanitize and encode user-controlled output
- use Content Security Policy
- avoid storing long-lived tokens in local storage
- use HttpOnly cookies if cookie-based auth is chosen
- keep dependencies updated
- validate input on server side even if frontend validates it too

### Malicious Users And Account Abuse

- Lock or throttle accounts after repeated failed logins.
- Add audit logs for login, password change, admin actions, and permission changes.
- Support disabling compromised users.
- Use MFA for admin users.
- Alert on unusual login locations, high-value actions, and privilege changes.
- Keep admin APIs separate and strongly protected.

### Untrusted Services And API Key Abuse

An untrusted service can exploit weak service-to-service security by replaying API keys, calling internal APIs, or impersonating another service.

Mitigations:

- do not expose internal APIs publicly
- require service authentication for internal APIs
- scope API keys to the minimum permissions
- rotate keys regularly
- bind credentials to a service identity where possible
- log service identity and request id for audit
- use mTLS or OAuth2 Client Credentials instead of shared static keys

### Production Hardening Checklist

- Replace bundled RSA keys with managed secrets.
- Add refresh-token rotation if refresh tokens are implemented.
- Add issuer and audience validation in every resource service.
- Add key rotation with multiple JWKS keys.
- Add centralized audit logging for security events.
- Add rate limits for login, registration, password reset, and admin APIs.
- Add account lockout or risk-based login throttling.
- Add CORS allowlists per environment.
- Add mTLS or OAuth2 Client Credentials for internal service calls.
- Use least-privilege DB users and network policies.
- Keep dependencies patched and scan images in CI/CD.

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
