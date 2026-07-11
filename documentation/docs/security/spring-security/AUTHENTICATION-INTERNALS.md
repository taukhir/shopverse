---
title: Username Password Authentication Internals
description: AuthenticationProvider, DaoAuthenticationProvider, UserDetailsService, password encoding, SecurityContextHolder, and the complete Spring Security request flow.
difficulty: Advanced
page_type: Concept
status: Generic
prerequisites: [Spring Security authentication fundamentals]
learning_objectives: [Trace username and password authentication internals, Understand providers user details password encoding and security context]
technologies: [Spring Security, Java]
last_reviewed: "2026-07-11"
---

# Username/Password Authentication Internals

This page follows a username and password from the HTTP request to the
controller and explains exactly which Spring Security component calls the
next one.

![Spring Security username and password authentication component map](/img/diagrams/spring-security-authentication-components.svg)

## The Mental Model

Spring Security separates **reading credentials**, **authenticating them**,
**remembering the result**, and **authorizing access**:

| Responsibility | Main component |
|---|---|
| Read credentials from HTTP | An authentication filter |
| Represent the attempt | `Authentication` |
| Choose an authentication strategy | `AuthenticationManager` / `ProviderManager` |
| Authenticate one token type | `AuthenticationProvider` |
| Load a username/password account | `UserDetailsService` |
| Represent that account | `UserDetails` |
| Verify the submitted password | `PasswordEncoder` |
| Hold the current identity | `SecurityContext` / `SecurityContextHolder` |
| Persist identity between requests | `SecurityContextRepository` |
| Decide whether access is allowed | `AuthorizationManager` |

The controller is reached only after authentication and request authorization
succeed.

## The Main Objects

### `Authentication`

`Authentication` represents either an authentication request or an
authenticated identity. The same interface is deliberately used for both:

```text
Before authentication
UsernamePasswordAuthenticationToken
  principal   = "alice"
  credentials = raw submitted password
  authorities = empty
  authenticated = false

After authentication
UsernamePasswordAuthenticationToken
  principal   = UserDetails for alice
  credentials = normally erased
  authorities = ROLE_USER, ORDER_READ, ...
  authenticated = true
```

Do not create an authenticated token merely because a client supplied a
username. The provider creates the trusted result only after validation.

### `AuthenticationManager` and `ProviderManager`

`AuthenticationManager` has one operation:

```java
Authentication authenticate(Authentication request)
        throws AuthenticationException;
```

`ProviderManager` is the usual implementation. It walks its ordered
`AuthenticationProvider` list. For each provider it asks `supports(...)`.

```java
public boolean supports(Class<?> authenticationType) {
    return UsernamePasswordAuthenticationToken.class
            .isAssignableFrom(authenticationType);
}
```

A provider can:

- return an authenticated `Authentication`;
- throw an `AuthenticationException`, meaning authentication failed;
- return `null`, allowing another compatible provider to try.

If no provider supports the token, `ProviderManager` can ask an optional parent
manager. Otherwise authentication ends with `ProviderNotFoundException`.

After success, `ProviderManager` normally erases sensitive credentials from
the returned object when it implements `CredentialsContainer`.

### `AuthenticationProvider`

An `AuthenticationProvider` knows how to authenticate one family of tokens.
Examples include:

| Provider | Input token | Validation dependency |
|---|---|---|
| `DaoAuthenticationProvider` | `UsernamePasswordAuthenticationToken` | `UserDetailsService` + `PasswordEncoder` |
| `JwtAuthenticationProvider` | bearer-token authentication | `JwtDecoder` |
| LDAP provider | username/password token | LDAP server |
| Custom API-key provider | custom API-key token | application-specific verifier |

An `AuthenticationProvider` does not parse the HTTP request. A filter does
that and passes it a framework token through the manager.

## `UserDetailsService` and `UserDetails`

`UserDetailsService` is a narrow lookup interface:

```java
UserDetails loadUserByUsername(String username)
        throws UsernameNotFoundException;
```

It does **not** authenticate the password. It retrieves the information that a
provider needs to authenticate:

- username;
- stored password hash;
- enabled, locked, account-expired, and credentials-expired flags;
- granted authorities.

`UserDetails` is the security view of an account. It need not be—and usually
should not be—the JPA entity returned directly.

Shopverse adapts its domain model in
`user-service/.../security/DatabaseUserDetailsService.java`:

```java
@Service
@RequiredArgsConstructor
public class DatabaseUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword()) // already encoded in the DB
                .authorities(toAuthorities(user))
                .disabled(!user.getEnabled())
                .build();
    }
}
```

Avoid returning different public errors for “username missing” and “password
wrong”; that leaks whether an account exists. `DaoAuthenticationProvider`
supports hiding username-not-found details behind a generic bad-credentials
failure.

## Exactly When `loadUserByUsername()` Is Called

It is called when all of these are true:

1. an authentication mechanism produces a username/password token;
2. `ProviderManager` selects `DaoAuthenticationProvider`;
3. the provider needs to retrieve the user and there is no usable cached
   `UserDetails`;
4. authentication has not already been restored from a trusted context.

Typical triggers:

- a form-login POST processed by `UsernamePasswordAuthenticationFilter`;
- an HTTP Basic header processed by `BasicAuthenticationFilter`;
- application code that explicitly calls `AuthenticationManager.authenticate`
  with a username/password token.

It is **not automatically called by every secured request**:

- a session request can restore an already authenticated context;
- a bearer JWT request uses `JwtAuthenticationProvider` and `JwtDecoder`;
- a public endpoint may require no authentication;
- a custom provider may use an entirely different account source.

In Shopverse's stateless internal Basic chain, credentials are presented and
authenticated on each Basic request, so the database lookup normally happens
on each request unless user caching is deliberately added.

## `DaoAuthenticationProvider` Under The Hood

![DaoAuthenticationProvider internal phases](/img/diagrams/spring-security-dao-provider-flow.svg)

The provider's work can be understood in three phases.

### 1. Retrieve the account

The username is extracted from the unauthenticated token. The provider calls
`UserDetailsService.loadUserByUsername(username)`, or uses a cached
`UserDetails` when configured.

### 2. Run account and credential checks

Pre-authentication checks reject disabled, locked, or expired accounts. The
provider then calls:

```java
passwordEncoder.matches(
        presentedRawPassword,
        userDetails.getPassword()
);
```

Post-authentication checks include credentials-expired state. A failure throws
a specific `AuthenticationException`, which the HTTP layer should normally
translate to a generic client response.

### 3. Create the trusted result

On success the provider returns an authenticated
`UsernamePasswordAuthenticationToken` whose principal is normally the loaded
`UserDetails` and whose authorities come from that account. In Spring Security
7, the successful password authentication also has the password-factor
authority used by multi-factor authentication support.

The provider returns the result to the manager; it does not itself place the
result in `SecurityContextHolder`. The filter or other caller that initiated
authentication does that.

## Passwords Are Encoded, Never Decoded

There is no password decoder in a secure username/password flow.

![Password encoding, matching, and upgrading](/img/diagrams/spring-security-password-lifecycle.svg)

### Registration or password change: `encode()`

```java
String storedHash = passwordEncoder.encode(rawPassword);
user.setPassword(storedHash);
```

`encode()` performs a one-way, salted, deliberately expensive transformation.
Encoding the same password twice normally produces different hashes because
each receives a new random salt.

### Login: `matches()`

```java
boolean valid = passwordEncoder.matches(rawSubmittedPassword, storedHash);
```

For BCrypt, the stored value contains the algorithm parameters and salt.
`matches()` reads them, hashes the submitted value using compatible parameters,
and performs the comparison. It does not recover the original password.

Never compare like this:

```java
// Wrong: a new salt means a new encoded value.
passwordEncoder.encode(raw).equals(storedHash)
```

### `DelegatingPasswordEncoder`

Shopverse creates its encoder with:

```java
PasswordEncoderFactories.createDelegatingPasswordEncoder()
```

Its storage format is:

```text
{id}encodedPassword

{bcrypt}$2a$10$...
{pbkdf2}...
{scrypt}...
```

For `encode`, the configured current encoder is selected and its identifier is
prefixed. For `matches`, the stored `{id}` selects the matching encoder. This
allows old hashes to remain verifiable while new passwords use the current
policy.

An absent or unknown identifier fails by default. Do not silently use
`{noop}` or a permissive fallback in production.

### `upgradeEncoding()`

`upgradeEncoding(storedHash)` reports whether the stored representation should
be replaced—for example, because its work factor is now too weak. A successful
login can be followed by re-encoding and saving the raw submitted password
through an explicitly configured password-upgrade path. Merely defining a
`PasswordEncoder` does not mean every application automatically updates its
database schema and password row.

Password hashing is intentionally CPU/memory expensive. Tune the work factor
for the deployment and rate-limit authentication endpoints.

## In-Memory Users Use The Same DAO Flow

`InMemoryUserDetailsManager` implements `UserDetailsService`; it is not a
separate password authentication algorithm.

```java
@Bean
UserDetailsService users(PasswordEncoder encoder) {
    UserDetails learner = User.withUsername("learner")
            .password(encoder.encode("change-me"))
            .roles("USER")
            .build();

    return new InMemoryUserDetailsManager(learner);
}
```

The normal path is still:

```text
authentication filter
  -> ProviderManager
  -> DaoAuthenticationProvider
  -> InMemoryUserDetailsManager.loadUserByUsername()
  -> PasswordEncoder.matches()
```

Use it for demonstrations, focused tests, and small operational tools. Users
live only in that application process, are not shared automatically between
replicas, and are lost when reconstructed on restart.

Spring Boot may create a generated default user only when security is present
and the application has not supplied its own relevant user/authentication
configuration. Defining application security beans changes or backs off that
default configuration; do not depend on a generated user in production.

## How Spring Wires The DAO Provider

For a conventional username/password setup, Spring Security can build an
internal `AuthenticationManager` containing a `DaoAuthenticationProvider` when
a usable `UserDetailsService` is exposed and no competing explicit provider or
manager configuration has taken ownership of that setup.

Conceptually:

```text
UserDetailsService bean + PasswordEncoder bean
  -> DaoAuthenticationProvider
  -> ProviderManager
  -> authentication filters configured by SecurityFilterChain
```

For explicit control:

```java
@Bean
AuthenticationProvider daoProvider(
        UserDetailsService users,
        PasswordEncoder encoder
) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
    provider.setPasswordEncoder(encoder);
    return provider;
}
```

Prefer one clear configuration style. Publishing a custom `AuthenticationProvider`
or populating an authentication-manager builder can change when the convenient
`UserDetailsService`-based setup applies.

## Complete HTTP Basic Request Flow

The animated diagram highlights the active stage in sequence.

![Animated Spring Security HTTP Basic request lifecycle](/img/diagrams/animated-spring-security-basic-auth.svg)

1. Tomcat creates `HttpServletRequest` and enters Spring Security's filter
   chain.
2. `SecurityContextHolderFilter` obtains a deferred or existing context from
   the configured `SecurityContextRepository` and associates it with the
   current execution.
3. `BasicAuthenticationFilter` finds the Basic header, Base64-decodes the
   transport value into username and raw password, and creates an
   unauthenticated `UsernamePasswordAuthenticationToken`. This Base64 decoding
   is **not password-hash decoding**.
4. The filter calls `ProviderManager.authenticate(token)`.
5. `ProviderManager` selects a provider whose `supports(...)` accepts that
   token, normally `DaoAuthenticationProvider`.
6. The DAO provider calls `loadUserByUsername`, checks account flags, and calls
   `PasswordEncoder.matches`.
7. The authenticated result returns to the filter. The filter creates/updates
   a `SecurityContext`, sets the result, and applies its configured context
   persistence strategy.
8. `AuthorizationFilter` evaluates request rules using the authenticated
   authorities.
9. `DispatcherServlet` and the controller run. Controllers can inject
   `Authentication` or `@AuthenticationPrincipal`.
10. At request completion, the filter infrastructure clears the thread-bound
    holder to prevent identity leakage into the next request on the reused
    container thread.

On failure, the authentication filter invokes its failure handling path and an
`AuthenticationEntryPoint` commonly produces `401`; the controller is not
called.

## `SecurityContextHolder` Lifecycle

`SecurityContextHolder` is an access strategy around the current
`SecurityContext`; it is not the database and not inherently the HTTP session.
Servlet applications commonly use a thread-local strategy.

```java
Authentication current =
        SecurityContextHolder.getContext().getAuthentication();
```

Prefer framework injection when possible:

```java
@GetMapping("/me")
Profile me(Authentication authentication) { ... }

@GetMapping("/profile")
Profile profile(@AuthenticationPrincipal UserDetails user) { ... }
```

### Session-based requests

A `SecurityContextRepository` can load an authenticated context associated
with the session. A later request may therefore skip username/password
authentication entirely. Modern Spring Security defaults to requiring the
authentication mechanism to save a newly authenticated context explicitly.

### Stateless requests

With `SessionCreationPolicy.STATELESS`, the application does not use the HTTP
session as the authentication context repository. Basic credentials or a
bearer token are evaluated again on each request. The context still exists for
the duration of that request so authorization and application code can use it.

### Async and new threads

A plain thread-local value does not safely or automatically propagate to an
arbitrary executor thread. Use Spring Security's delegating context wrappers or
another supported propagation mechanism, and always understand who clears the
context. WebFlux uses Reactor Context and `ReactiveSecurityContextHolder`
instead of the servlet thread-local model.

## Failure Map

| Failure | Usually thrown/detected by | Result |
|---|---|---|
| No provider supports token | `ProviderManager` | `ProviderNotFoundException` |
| Username absent | `UserDetailsService` | commonly hidden as bad credentials |
| Password mismatch | `DaoAuthenticationProvider` | `BadCredentialsException` |
| Account disabled | account pre-check | `DisabledException` |
| Account locked | account pre-check | `LockedException` |
| Account expired | account pre-check | `AccountExpiredException` |
| Credentials expired | post-check | `CredentialsExpiredException` |
| No credentials on protected endpoint | authorization/filter chain | `401` via entry point |
| Authenticated but insufficient authority | authorization | `403` via denied handler |

Log enough to diagnose safely, but return generic authentication failures to
clients and never log raw passwords or hashes.

## Shopverse Flow

Shopverse User Service exposes two servlet security chains:

```text
/api/v1/internal/users/**
  -> stateless HTTP Basic
  -> DatabaseUserDetailsService
  -> DelegatingPasswordEncoder / stored BCrypt hash

remaining protected APIs
  -> bearer JWT
  -> JwtAuthenticationProvider + JwtDecoder
  -> no UserDetailsService lookup for ordinary JWT validation
```

The encoder bean lives in `user-service/.../security/SecurityConfig.java`.
The complete token-oriented path is covered in
[JWT JWKS And Resource Server Security](JWT-JWKS-RESOURCE-SERVER.md).

## Debugging Checklist

When `loadUserByUsername()` is unexpectedly not called, check:

1. Did an authentication filter recognize credentials in this request?
2. What concrete `Authentication` token did it create?
3. Does any configured provider support that token class?
4. Was authentication already restored from a session/context repository?
5. Is this request using JWT, OAuth2 login, LDAP, or another provider instead?
6. Did an earlier security filter reject or short-circuit the request?
7. Did custom provider/manager configuration replace the expected DAO setup?

When password matching fails, check:

1. Is the database value the encoded hash rather than a raw password?
2. Does a delegating hash contain the correct `{id}` prefix?
3. Is the same encoding policy used when accounts are created or changed?
4. Is the raw submitted value being altered, trimmed, or Base64-confused?
5. Are account flags failing before or after credential verification?

Enable Spring Security debug logging only in a safe development environment;
do not expose credentials or sensitive tokens.

## Summary

- Filters extract HTTP credentials; providers validate authentication tokens.
- `ProviderManager` selects providers by token type through `supports(...)`.
- `DaoAuthenticationProvider` calls `UserDetailsService`, checks account state,
  and delegates password verification to `PasswordEncoder`.
- `loadUserByUsername()` is triggered by DAO username/password authentication,
  not by every request and not by ordinary JWT validation.
- `InMemoryUserDetailsManager` is simply an in-memory `UserDetailsService` and
  normally uses the same DAO provider path.
- Passwords are one-way encoded. `matches()` verifies; nothing decodes the
  stored hash.
- The initiating filter stores the authenticated result in a `SecurityContext`;
  context persistence determines whether later requests reuse it.
- The request context must be cleared after processing to avoid thread-reuse
  leaks.

## Official References

- [Servlet authentication architecture](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/architecture.html)
- [`DaoAuthenticationProvider`](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/passwords/dao-authentication-provider.html)
- [`UserDetailsService`](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/passwords/user-details-service.html)
- [Password storage](https://docs.spring.io/spring-security/reference/7.0/features/authentication/password-storage.html)
- [Authentication persistence](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/persistence.html)
